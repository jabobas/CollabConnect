# wyatt mccurdy
# this scraper is meant to scrape the roux institute and provide data for our database
# https://roux.northeastern.edu/our-people/
# The script will provide a json file with all retrieved information 
# which will then be inserted into the database

#

import re
import time
import json
import pathlib
import logging
import argparse
import urllib.parse
import urllib.request
import random
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Tuple
from html.parser import HTMLParser
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

ROUX_BASE = "https://roux.northeastern.edu"
PEOPLE_URL = f"{ROUX_BASE}/our-people/"
DEFAULT_USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) CollabConnectScraper/1.0 (+https://collabconnect.example/contact)"

# --------------------------------------------------------------------
# Data structures aligned with existing table columns (no schema change)
# --------------------------------------------------------------------
@dataclass
class InstitutionRow:
    institution_name: str
    institution_type: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipcode: Optional[str] = None
    institution_phone: Optional[str] = None

@dataclass
class DepartmentRow:
    institution_id: int
    department_name: str
    department_email: Optional[str] = None
    department_phone: Optional[str] = None

@dataclass
class PersonRow:
    person_name: str
    person_email: Optional[str]
    person_phone: Optional[str]
    bio: Optional[str]
    expertise_1: Optional[str]
    expertise_2: Optional[str]
    expertise_3: Optional[str]
    main_field: str
    department_id: Optional[int]

@dataclass
class WorksInRow:
    person_id: int
    department_id: int

@dataclass
class TagRow:
    tag_name: str

# --------------------------------------------------------------------
# Minimal robots.txt handling (respect crawl-delay)
# --------------------------------------------------------------------
def get_robots_meta(domain: str) -> Tuple[int, List[str]]:
    robots_url = urllib.parse.urljoin(domain, "/robots.txt")
    crawl_delay = 0
    disallows: List[str] = []
    try:
        with urllib.request.urlopen(robots_url, timeout=10) as resp:
            content = resp.read().decode("utf-8", errors="ignore")
        ua_block = []
        current_block = []
        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if line.lower().startswith("user-agent:"):
                if current_block:
                    ua_block.append(current_block)
                current_block = [("user-agent", line.split(":", 1)[1].strip())]
            elif ":" in line:
                k, v = line.split(":", 1)
                current_block.append((k.lower().strip(), v.strip()))
        if current_block:
            ua_block.append(current_block)
        # Find block for '*'
        for block in ua_block:
            ua = [v for k, v in block if k == "user-agent"]
            if "*" in ua:
                for k, v in block:
                    if k == "crawl-delay":
                        try:
                            crawl_delay = int(float(v))
                        except ValueError:
                            pass
                    if k == "disallow":
                        disallows.append(v)
        return crawl_delay, disallows
    except Exception as e:
        logging.warning(f"robots.txt fetch failed: {e}")
        return 0, []

# --------------------------------------------------------------------
# Fallback HTML parser if BeautifulSoup unavailable
# --------------------------------------------------------------------
class TeamCardParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_card = False
        self.current_text = []
        self.cards = []
    def handle_starttag(self, tag, attrs):
        # detect team-card on any tag (e.g., <a class="team-card"> or <div class="team-card">)
        cls = dict(attrs).get("class", "")
        classes = cls.split() if isinstance(cls, str) else []
        if "team-card" in classes:
            self.in_card = True
            self.current_text = []
    def handle_endtag(self, tag):
        if self.in_card and tag in ("a", "div"):
            text = " ".join(t.strip() for t in self.current_text if t.strip())
            if text:
                self.cards.append(text)
            self.in_card = False
    def handle_data(self, data):
        if self.in_card:
            self.current_text.append(data)

# --------------------------------------------------------------------
# Fetch or read local snapshot
# --------------------------------------------------------------------
def fetch_live_html(url: str, crawl_delay: int, user_agent: str) -> str:
    logging.info(f"Fetching live page: {url} (delay={crawl_delay}s, UA='{user_agent}')")
    time.sleep(crawl_delay)
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": user_agent,
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "close",
        }
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        status = getattr(resp, "status", None)
        cache_control = resp.headers.get("Cache-Control")
        logging.info(f"HTTP status={status}, Cache-Control={cache_control}")
        return resp.read().decode("utf-8", errors="ignore")

# --------------------------------------------------------------------
# Parse people cards (attempt to extract names; placeholder if absent)
# --------------------------------------------------------------------
def parse_people(html: str) -> List[Dict]:
    # BeautifulSoup-based parsing of team cards
    soup = BeautifulSoup(html, "html.parser")
    cards = soup.select(".team-card")
    people: List[Dict] = []
    for card in cards:
        name = None
        profile_url = None
        # Extract link if card is <a> or contains <a>
        if card.name == "a" and card.get("href"):
            profile_url = card["href"]
        else:
            link = card.find("a", href=True)
            if link:
                profile_url = link["href"]
        # Try common name containers (prioritize actual heading tags)
        for selector in ["h3", "h4", "h2", ".name"]:
            el = card.select_one(selector)
            if el:
                txt = el.get_text(strip=True)
                if txt:
                    name = txt
                    break
        # Try image alt text if available (but avoid "Placeholder image for" patterns)
        if not name:
            img = card.find("img", alt=True)
            if img and img.get("alt"):
                alt = img["alt"].strip()
                # Strip common prefixes
                alt = re.sub(r"^(Placeholder image for|Image of|Photo of)\s+", "", alt, flags=re.IGNORECASE).strip()
                if alt and not alt.lower().startswith(("image", "photo")):
                    name = alt
        # Fallback: first capitalized word sequence in card text (excluding common noise)
        if not name:
            raw = card.get_text(" ", strip=True)
            # Remove image placeholders first
            raw = re.sub(r"Placeholder image for\s+", "", raw, flags=re.IGNORECASE)
            m = re.search(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b", raw)
            name = m.group(1) if m else "Unknown Person"
        people.append({
            "person_name": name,
            "person_email": None,
            "person_phone": None,
            "bio": None,
            "expertise": [],
            "main_field": "General",
            "departments": ["General Faculty and Staff"],
            "profile_url": profile_url
        })
    logging.info(f"Extracted {len(people)} people entries (BeautifulSoup)")
    return people

# --------------------------------------------------------------------
# Parse person detail page (title, email, bio)
# --------------------------------------------------------------------
def parse_person_detail(html: str, base_url: str) -> Dict:
    """
    Parse a person's detail page HTML and extract:
      - title (job title from <p class="h6 uppercase fw-300">)
      - email (from mailto: link or meta tags)
      - bio (from <div> elements containing <p> tags, after the title)
    Returns dict with keys: title, email, bio.
    """
    soup = BeautifulSoup(html, "html.parser")
    detail = {"title": None, "email": None, "bio": None}
    
    # Extract title from <p class="h6 uppercase fw-300">
    title_el = soup.select_one("p.h6.uppercase.fw-300")
    if title_el:
        detail["title"] = title_el.get_text(separator=" ", strip=True)
    
    # Extract email from mailto: link or Cloudflare obfuscation
    email_link = soup.find("a", href=re.compile(r"^/cdn-cgi/l/email-protection#"))
    if email_link:
        span = email_link.find("span", class_="__cf_email__")
        if span and span.get("data-cfemail"):
            encoded = span["data-cfemail"]
            try:
                key = int(encoded[:2], 16)
                decoded = "".join(chr(int(encoded[i:i+2], 16) ^ key) for i in range(2, len(encoded), 2))
                detail["email"] = decoded
            except Exception:
                pass
    if not detail["email"]:
        mailto_match = re.search(r"mailto:([^\s\"'<>]+)", html)
        if mailto_match:
            detail["email"] = mailto_match.group(1)
    
    # Extract bio: look for <div> elements containing <p> tags in the main content area
    # Strategy: find the column containing the title, then look for the main content div
    # The structure is: .col-md-6 > div (main content) > [h1, p.title, div.email, div.bio]
    bio_parts = []
    
    if title_el:
        # Navigate up to find the .col-md-6 container
        col_container = title_el.find_parent("div", class_="col-md-6")
        if col_container:
            # The first direct div child contains all the content
            main_content_div = col_container.find("div", recursive=False)
            if main_content_div:
                # Look for div children that contain paragraph bio content
                for child in main_content_div.children:
                    if hasattr(child, 'name') and child.name == "div":
                        # Check if this div contains bio paragraphs
                        paragraphs = child.find_all("p", recursive=False)
                        for p in paragraphs:
                            txt = p.get_text(" ", strip=True)
                            # Filter out navigation/empty paragraphs
                            # Bio paragraphs are typically longer than 50 chars
                            if txt and len(txt) > 50 and "Back to Our People" not in txt and txt != "\xa0":
                                bio_parts.append(txt)
    
    # Fallback: if no bio found via main structure, search broadly in .col-md-6
    if not bio_parts:
        content_col = soup.select_one(".col-md-6")
        if content_col:
            # Get all <p> tags that are not the title element
            for p in content_col.find_all("p"):
                # Skip the title element itself
                if p == title_el:
                    continue
                txt = p.get_text(" ", strip=True)
                if txt and len(txt) > 50 and "Back to Our People" not in txt:
                    bio_parts.append(txt)
    
    # Clean up and join bio parts
    if bio_parts:
        bio_text = " ".join(bio_parts)
        bio_text = re.sub(r"\s+", " ", bio_text).strip()
        # Remove excessive non-breaking spaces
        bio_text = bio_text.replace("\xa0", " ")
        detail["bio"] = bio_text if bio_text else None
    
    return detail

# --------------------------------------------------------------------
# Normalize to table row dicts matching schema columns
# --------------------------------------------------------------------
def normalize_rows(people: List[Dict]) -> Dict[str, List[Dict]]:
    institution = InstitutionRow(institution_name="Roux Institute at Northeastern University",
                                 institution_type="Academic",
                                 city="Portland",
                                 state="ME")
    institution_id = 1  # Assume first insert will get ID 1
    department_map: Dict[str, int] = {}
    department_rows: List[Dict] = []
    person_rows: List[Dict] = []
    worksin_rows: List[Dict] = []
    tag_rows: Dict[str, TagRow] = {}

    next_department_id = 1
    next_person_id = 1

    for p in people:
        for dept in p["departments"]:
            if dept not in department_map:
                department_map[dept] = next_department_id
                department_rows.append(asdict(DepartmentRow(
                    institution_id=institution_id,
                    department_name=dept
                )))
                next_department_id += 1
        expertise = p.get("expertise", [])
        # Register tags (expertise as tags)
        for tag in expertise:
            if tag and tag not in tag_rows:
                tag_rows[tag] = TagRow(tag_name=tag)
        # Break expertise into up to 3 columns
        ex = expertise + [None, None, None]
        person_rows.append(asdict(PersonRow(
            person_name=p["person_name"],
            person_email=p["person_email"],
            person_phone=p["person_phone"],
            bio=p["bio"],
            expertise_1=ex[0],
            expertise_2=ex[1],
            expertise_3=ex[2],
            main_field=p.get("main_field", "General"),
            department_id=None  # Single-department column kept nullable; use WorksIn for M:N
        )))
        # WorksIn rows
        for dept in p["departments"]:
            worksin_rows.append(asdict(WorksInRow(
                person_id=next_person_id,
                department_id=department_map[dept]
            )))
        next_person_id += 1

    data = {
        "Institution": [asdict(institution)],
        "Department": department_rows,
        "Person": person_rows,
        "WorksIn": worksin_rows,
        "Tag": [asdict(t) for t in tag_rows.values()]
    }
    return data

# --------------------------------------------------------------------
# Optional: emit parameterized INSERT templates (without executing)
# --------------------------------------------------------------------
def generate_insert_templates(data: Dict[str, List[Dict]]) -> Dict[str, List[str]]:
    templates: Dict[str, List[str]] = {}
    for table, rows in data.items():
        statements = []
        for row in rows:
            cols = ", ".join(row.keys())
            placeholders = ", ".join(["%s"] * len(row))
            stmt = f"INSERT INTO {table} ({cols}) VALUES ({placeholders}); -- {list(row.values())}"
            statements.append(stmt)
        templates[table] = statements
    return templates

# --------------------------------------------------------------------
# Main CLI
# --------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Scrape Roux people page into CollabConnect-ready rows.")
    parser.add_argument("--export-json", default="roux_people.json", help="Output JSON file path.")
    parser.add_argument("--show-sql", action="store_true", help="Print INSERT templates.")
    parser.add_argument("--user-agent", default=DEFAULT_USER_AGENT, help="Override User-Agent header.")
    parser.add_argument("--dump-person-html", metavar="FILE", help="Fetch one random person detail page and save HTML to FILE.")
    parser.add_argument("--limit", type=int, default=50, help="Max number of people to scrape (default: 50).")
    args = parser.parse_args()

    # Always fetch live, respecting robots.txt
    crawl_delay, disallows = get_robots_meta(ROUX_BASE)
    if any("/our-people" in d for d in disallows):
        logging.error("Disallowed by robots.txt; aborting live fetch.")
        return
    html = fetch_live_html(PEOPLE_URL, crawl_delay, args.user_agent)

    people = parse_people(html)
    
    # Optional: dump one random person's detail page HTML
    if args.dump_person_html:
        candidates = [p for p in people if p.get("profile_url")]
        if not candidates:
            logging.warning("No profile URLs found; skipping person detail fetch.")
        else:
            chosen = random.choice(candidates)
            profile_url = chosen["profile_url"]
            if not profile_url.startswith("http"):
                profile_url = urllib.parse.urljoin(ROUX_BASE, profile_url)
            logging.info(f"Fetching random person detail: {chosen['person_name']} -> {profile_url}")
            person_html = fetch_live_html(profile_url, crawl_delay, args.user_agent)
            pathlib.Path(args.dump_person_html).write_text(person_html, encoding="utf-8")
            logging.info(f"Saved person detail HTML to {args.dump_person_html}")

    # Fetch detail pages until we have enough people with bios
    people_with_bios = []
    idx = 0
    total_fetched = 0
    
    logging.info(f"Fetching detail pages until we have {args.limit} people with bios...")
    
    while len(people_with_bios) < args.limit and idx < len(people):
        person = people[idx]
        idx += 1
        
        profile_url = person.get("profile_url")
        if not profile_url:
            logging.warning(f"No profile URL for {person['person_name']}, skipping")
            continue
            
        if not profile_url.startswith("http"):
            profile_url = urllib.parse.urljoin(ROUX_BASE, profile_url)
        
        total_fetched += 1
        logging.info(f"[{total_fetched}] Fetching {person['person_name']} (have {len(people_with_bios)}/{args.limit} with bios) -> {profile_url}")
        
        try:
            detail_html = fetch_live_html(profile_url, crawl_delay, args.user_agent)
            detail = parse_person_detail(detail_html, ROUX_BASE)
            
            # Merge detail into person dict (update only non-None values)
            if detail["email"]:
                person["person_email"] = detail["email"]
            if detail["bio"]:
                person["bio"] = detail["bio"]
            # Store title separately and also update main_field
            if detail["title"]:
                person["title"] = detail["title"]
                person["main_field"] = detail["title"]
            
            # Only add person if they have a bio
            if person["bio"]:
                people_with_bios.append(person)
                logging.info(f"✓ Added {person['person_name']} (bio length: {len(person['bio'])})")
            else:
                logging.warning(f"✗ Skipping {person['person_name']} - no bio found")
                
        except Exception as e:
            logging.warning(f"Failed to fetch detail for {person['person_name']}: {e}")
    
    if len(people_with_bios) < args.limit:
        logging.warning(f"Only found {len(people_with_bios)} people with bios out of {total_fetched} fetched (wanted {args.limit})")
    else:
        logging.info(f"Successfully collected {len(people_with_bios)} people with bios!")
    
    # Use only people with bios
    people = people_with_bios

    normalized = normalize_rows(people)

    pathlib.Path(args.export_json).write_text(json.dumps(normalized, indent=2), encoding="utf-8")
    logging.info(f"Wrote JSON: {args.export_json}")

    if args.show_sql:
        inserts = generate_insert_templates(normalized)
        for table, stmts in inserts.items():
            print(f"-- {table}")
            for s in stmts[:5]:
                print(s)

if __name__ == "__main__":
    main()
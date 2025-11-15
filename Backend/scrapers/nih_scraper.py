"""
Author: Aubin Mugisha
Description: Fetches Maine research projects from NIH Reporter API and exports to JSON

"""

import argparse
import datetime as dt
import json
import os
import sys
from typing import Dict, List, Optional

import requests


NIH_API_URL = "https://api.reporter.nih.gov/v2/projects/search"


def fetch_projects(keyword: str, fiscal_year: Optional[int], limit: int = 25, states: Optional[List[str]] = None) -> List[Dict]:
    """Call NIH Reporter API and return raw project dictionaries."""
    payload = {
        "criteria": {
            "advanced_text_search": {
                "search_text": keyword,
                "search_field": "all",
                "operator": "AND",
            },
        },
        "offset": 0,
        "limit": limit,
    }
    
    # Add fiscal year filter if provided
    if fiscal_year:
        payload["criteria"]["fiscal_years"] = [fiscal_year]
    
    # Add state filter if provided
    if states:
        payload["criteria"]["org_states"] = states

    year_info = f", fiscal_year={fiscal_year}" if fiscal_year else " (all years)"
    state_info = f", states={states}" if states else ""
    print(f"Fetching NIH projects: keyword='{keyword}'{year_info}, limit={limit}{state_info}")
    response = requests.post(NIH_API_URL, json=payload, timeout=30)
    response.raise_for_status()
    data = response.json()
    results = data.get("results", [])
    print(f"✓ Fetched {len(results)} projects from NIH Reporter")
    return results


def parse_date(value: Optional[str]) -> Optional[str]:
    """Parse date string to ISO 8601 format (YYYY-MM-DD)."""
    if not value:
        return None
    try:
        # Try ISO 8601 datetime format first (2021-05-20T00:00:00)
        if 'T' in value:
            parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00')).date()
        else:
            # Fallback to simple date format (YYYY-MM-DD)
            parsed = dt.datetime.strptime(value, "%Y-%m-%d").date()
        return parsed.isoformat()
    except (ValueError, AttributeError):
        return None


def transform_to_unified_schema(projects: List[Dict]) -> Dict:
    """
    Transform NIH API response to unified CollabConnect JSON schema.
    
    Returns a dict with:
        - institutions: list of institutions with nested departments and people
        - projects: list of all projects
        - workedon: list of person-project relationships
        - belongsto: list of department-institution relationships
    """
    institutions_map = {}  # keyed by institution_name
    projects_list = []
    workedon_list = []
    belongsto_list = []
    
    # Track seen entities to avoid duplicates
    seen_people = set()  # person keys
    seen_projects = set()  # project_num
    seen_belongsto = set()  # (dept_name, inst_name, start_date)
    
    # Track projects per person for nesting
    person_projects_map = {}  # person_key -> list of project objects
    
    for project in projects:
        project_num = project.get("project_num")
        if not project_num or project_num in seen_projects:
            continue
        seen_projects.add(project_num)
        
        # Extract project details
        project_title = project.get("project_title") or f"NIH Project {project_num}"
        project_description = project.get("abstract_text") or project.get("project_title")
        org_type = project.get("organization_type", {})
        project_tags = org_type.get("name") if isinstance(org_type, dict) else str(org_type) if org_type else "NIH Grant"
        start_date = parse_date(project.get("project_start_date")) or dt.date.today().isoformat()
        end_date = parse_date(project.get("project_end_date"))
        
        # Get principal investigator (lead person)
        investigators = project.get("principal_investigators") or []
        leadperson_name = None
        if investigators:
            lead_inv = investigators[0]
            leadperson_name = (
                lead_inv.get("full_name")
                or lead_inv.get("name")
                or lead_inv.get("first_name")
            )
        
        projects_list.append({
            "project_title": project_title,
            "project_description": project_description,
            "project_tags": project_tags,
            "leadperson_name": leadperson_name,  # Add lead person for linking
            "start_date": start_date,
            "end_date": end_date,
            "external_id": project_num,
        })
        
        # Extract institution from organization object
        org = project.get("organization", {})
        institution_name = org.get("org_name")
        if institution_name:
            if institution_name not in institutions_map:
                institutions_map[institution_name] = {
                    "institution_name": institution_name,
                    "institution_type": project_tags,
                    "street": None,
                    "city": org.get("org_city"),
                    "state": org.get("org_state"),
                    "zipcode": org.get("org_zipcode"),
                    "country": org.get("org_country"),
                    "institution_phone": None,
                    "departments": {},  # keyed by dept_name
                }
            
            # Extract department
            dept_name = org.get("dept_type") or "Unknown Department"
            institution = institutions_map[institution_name]
            if dept_name not in institution["departments"]:
                institution["departments"][dept_name] = {
                    "department_name": dept_name,
                    "department_email": None,
                    "department_phone": None,
                    "people": [],
                }
            
            # BelongsTo relationship
            belongsto_key = (dept_name, institution_name, start_date)
            if belongsto_key not in seen_belongsto:
                seen_belongsto.add(belongsto_key)
                belongsto_list.append({
                    "department_name": dept_name,
                    "institution_name": institution_name,
                    "effective_start": start_date,
                    "effective_end": end_date,
                    "justification": f"NIH project {project_num}",
                })
        
        # Extract investigators
        investigators = project.get("principal_investigators") or []
        for idx, investigator in enumerate(investigators, start=1):
            profile_id = str(investigator.get("profile_id") or "").strip()
            name = (
                investigator.get("full_name")
                or investigator.get("name")
                or investigator.get("first_name")
                or "NIH Investigator"
            )
            
            # Use name as unique key since email is not available
            person_key = f"{name}_{profile_id}" if profile_id else name
            
            if person_key not in seen_people:
                seen_people.add(person_key)
                
                # Add person to department
                if institution_name and dept_name in institutions_map[institution_name]["departments"]:
                    institutions_map[institution_name]["departments"][dept_name]["people"].append({
                        "person_name": name,
                        "person_email": None,  # Email not available from NIH API
                        "person_phone": None,
                        "bio": None,  # Bio not available from NIH API
                        "profile_url": None,
                        "expertise_1": None,
                        "expertise_2": None,
                        "expertise_3": None,
                        "main_field": None,
                    })
            
            # WorkedOn relationship
            role = investigator.get("role") or "Principal Investigator" if idx == 1 else "Co-Investigator"
            workedon_list.append({
                "person_email": None,  # Email not available from NIH API
                "person_name": name,   # Use name for matching instead
                "project_title": project_title,
                "project_role": role,
                "start_date": start_date,
                "end_date": end_date,
            })
            
            # Add project to person's projects array
            if person_key not in person_projects_map:
                person_projects_map[person_key] = []
            person_projects_map[person_key].append({
                "project_title": project_title,
                "project_description": project_description,
                "project_role": role,
                "start_date": start_date,
                "end_date": end_date,
            })
    
    # Convert institutions_map to list format and add projects to each person
    institutions_list = []
    for inst in institutions_map.values():
        inst["departments"] = list(inst["departments"].values())
        # Add projects array to each person
        for dept in inst["departments"]:
            for person in dept["people"]:
                person_name = person["person_name"]
                # Find person_key (try with and without profile_id)
                person_key = None
                for key in person_projects_map.keys():
                    if key.startswith(person_name):
                        person_key = key
                        break
                
                person["projects"] = person_projects_map.get(person_key, [])
        
        institutions_list.append(inst)
    
    return {
        "source": "nih",
        "scraped_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "institutions": institutions_list,
        "projects": projects_list,
        "workedon": workedon_list,
        "belongsto": belongsto_list,
    }


def main():
    parser = argparse.ArgumentParser(description="Scrape NIH Reporter and output JSON")
    parser.add_argument(
        "--keyword",
        type=str,
        default=os.getenv("NIH_KEYWORD", "machine learning"),
        help="Search keyword for NIH projects (default: 'machine learning')",
    )
    parser.add_argument(
        "--fiscal-year",
        type=int,
        default=None,
        help="Fiscal year to search (default: all years)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=25,
        help="Maximum number of projects to fetch (default: 25)",
    )
    parser.add_argument(
        "--state",
        type=str,
        action="append",
        help="Filter by state(s) (e.g., --state ME --state MA). Can be used multiple times.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="../data/nih_projects.json",
        help="Output JSON file path (default: ../data/nih_projects.json)",
    )
    
    args = parser.parse_args()
    
    try:
        # Fetch from NIH API
        raw_projects = fetch_projects(args.keyword, args.fiscal_year, args.limit, args.state)
        
        if not raw_projects:
            print("⚠ No projects found matching criteria")
            sys.exit(0)
        
        # Debug: save raw API response
        if os.getenv("DEBUG"):
            debug_path = "Backend/scrapers/data/nih_raw_debug.json"
            with open(debug_path, "w") as f:
                json.dump(raw_projects, f, indent=2)
            print(f"DEBUG: Saved raw API response to {debug_path}")
        
        # Transform to unified schema
        print("Transforming to unified schema...")
        unified_data = transform_to_unified_schema(raw_projects)
        
        # Save to JSON
        output_path = args.output
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(unified_data, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Saved to {output_path}")
        print(f"  Institutions: {len(unified_data['institutions'])}")
        print(f"  Projects: {len(unified_data['projects'])}")
        print(f"  WorkedOn relationships: {len(unified_data['workedon'])}")
        print(f"  BelongsTo relationships: {len(unified_data['belongsto'])}")
        
    except requests.RequestException as e:
        print(f"✗ Error fetching from NIH API: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"✗ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
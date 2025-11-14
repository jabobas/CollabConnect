"""
Filename: department_data_cleaning.py
Author: Lucas Matheson
Edited by: Lucas Matheson
Date: November 10, 2025


This data is currently in a nested dictionary format, with departments as keys
and people as nested keys within each department. This format is good for inserting
the data into the relational database by iterating over the dictionary and grabbing
each object and its properties to insert it into the database using defined procedures.

The data has many properties that can be cleaned and split into multiple columns. For example,
some projects are apa 7 citations that can be split into authors, year, title, etc. This
can cover more columns and add more people into the database.
"""

import json
from pathlib import Path
import re
from openai import OpenAI

def extract_apa_details(citation):
    details = {"author": None, "year": None, "title": None, "source": None}

    author_match = re.match(r"([^(]+)", citation)
    if author_match:
        details["author"] = author_match.group(1).strip()

    year_match = re.search(r"\((\d{4})\)", citation)
    if year_match:
        details["year"] = year_match.group(1)

    title_match = re.search(r'"([^"]+)"', citation)
    if title_match:
        details["title"] = title_match.group(1)

    source_match = re.search(r"(?:_|In\s)([^.,]+)(?:[.,]|\d{4}|$)", citation)
    if source_match:
        details["source"] = source_match.group(1).strip()

    return details


def check_apa7_citation(citation_text):
    in_text_pattern = r"\((?:[A-Za-zÀ-ÖØ-öø-ÿ]+(?:, [A-Za-zÀ-ÖØ-öø-ÿ]+\.?)*|et al\.), (?:19|20)\d{2}(?:, p\. \d+)?\)"

    reference_pattern = (
        r"^[A-Za-zÀ-ÖØ-öø-ÿ]+, [A-Z]\. ?(?:[A-Z]\.)? \((?:19|20)\d{2}\)\. .*?\."
    )

    is_in_text = bool(re.search(in_text_pattern, citation_text or ""))
    is_reference_entry = bool(re.match(reference_pattern, citation_text or ""))

    regex = r"\((?:[A-Za-z\s&,.]+), (\d{4})\)"
    re.findall(regex, citation_text or "")

    if is_in_text:
        return "Likely APA 7th edition in-text citation."
    elif is_reference_entry:
        return "Likely a simplified APA 7th edition reference list entry."
    else:
        return "Does not strongly resemble a typical APA 7th edition citation."


def clean_unicode_escapes(text: str) -> str:
    if text is None:
        return None

    cleaned = text.replace('\\"', '"')
    try:
        decoded = cleaned.encode("utf-8").decode("unicode_escape", errors="replace")
    except Exception:
        decoded = cleaned

    decoded = decoded.replace("\r", "").replace("\n", " ")
    decoded = decoded.replace('\\"', "")
    decoded = " ".join(decoded.split())

    return decoded


def clean_phone_number(phone: str) -> str:
    if not phone:
        return None

    cleaned = re.sub(r"[^\d]", "", str(phone))

    if len(cleaned) == 11 and cleaned.startswith("1"):
        cleaned = cleaned[1:]

    if len(cleaned) == 10:
        return f"({cleaned[:3]}) {cleaned[3:6]}-{cleaned[6:]}"

    return cleaned if cleaned else None


def clean_name(name) -> str:
    if not name:
        return name
    parts = name.split(",")
    first_part = parts[0]
    words = first_part.split()
    cleaned_words = [
        w
        for w in words
        if not w.isupper()
        and not w.endswith(("PhD", "MD", "PsyD", "MBA", "BCBA", "Esq"))
    ]
    cleaned_name = " ".join(cleaned_words)

    cleaned_name = clean_unicode_escapes(cleaned_name)

    return cleaned_name.strip()


def normalize_empty(val: str) -> str:
    if val is None:
        return None
    if isinstance(val, str):
        s = val.strip()
        return None if s == "" else s
    if isinstance(val, (list, tuple)):
        return None if len(val) == 0 else list(val)
    if isinstance(val, dict):
        return None if len(val) == 0 else val
    if isinstance(val, (set,)):
        return None if len(val) == 0 else val
    return val


def project_is_empty(proj: dict) -> bool:
    if not isinstance(proj, dict):
        return True
    for v in proj.values():
        if normalize_empty(v) is not None:
            return False
    return True


if __name__ == "__main__":

    path = Path("../unprocessed/pre_cleaning_usm_data.json")
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)


    expertise_data = []

    departments = data.get("departments", {})
    for dept_key, dept in departments.items():

        expertise_data.append(dept.get("department_name", dept_key))

        dept_email = normalize_empty(dept.get("department_email"))
        dept_phone = normalize_empty(dept.get("department_phone"))
        dept["department_email"] = dept_email
        dept["department_phone"] = dept_phone


        people = dept.get("people", {})

        people_items = list(people.items())

        for person_name, person_data in people_items:


            curr_title = person_data.get("bio", "N/A")
            if curr_title == "":
                person_data["bio"] = None
            curr_bio = clean_unicode_escapes(curr_title)
            person_data["bio"] = curr_bio

            person_data["bio"] = curr_bio.replace(dept_key, " ")
            expertise_data.append(person_data["bio"])

            temp = person_name
            cleaned_name = clean_name(temp)

            if cleaned_name != person_name:
                people[cleaned_name] = people.pop(person_name)
                person_name = cleaned_name

            curr_phone = person_data.get("person_phone", "")

            cleaned_phone = clean_phone_number(curr_phone)
            person_data["person_phone"] = normalize_empty(cleaned_phone)

            for k in list(person_data.keys()):
                if k == "projects":
                    continue
                person_data[k] = normalize_empty(person_data.get(k))

            projects = person_data.get("projects", [])
            
            if projects:
                for i, project in enumerate(projects, start=1):
                    if project.get("project_title"):
                        project["project_title"] = clean_unicode_escapes(
                            project["project_title"]
                        )
                        expertise_data.append(project["project_title"])
                        citation_check = check_apa7_citation(
                            project.get("project_title")
                        )
                    for pk in list(project.keys()):
                        project[pk] = normalize_empty(project.get(pk))
                if projects and all(project_is_empty(p) for p in projects):
                    person_data["projects"] = None

    path = Path("../processed/post_cleaning_usm_data.json")
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)


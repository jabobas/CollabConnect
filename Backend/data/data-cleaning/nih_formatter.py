"""
Filename: nih_formatter.py
Author: Lucas Matheson
Edited by: Lucas Matheson
Date: November 14, 2025

This instance of the NIH data (scraped by Abbas and Aubin) came back in a 
format that cannot be inserted easily using the current procedures set up
in db_inti.py. So this algorithm looks to take their data are format it to 
be inserted easily. 
"""
import json

def convert_people_to_keyed_dict(data):
    """
    Converts each department's 'people' list into a dictionary keyed by person_name.
    Keeps all existing fields—including already-attached projects—unchanged.
    """

    institutions = data.get("institutions", [])

    for institution in institutions:
        for dept in institution.get("departments", []):

            people_list = dept.get("people", [])

            # Only convert if this is still a list
            if isinstance(people_list, list):
                
                people_dict = {}

                for person in people_list:
                    if not isinstance(person, dict):
                        continue

                    name = person.get("person_name")
                    if not name:
                        continue

                    # Store the entire person dict exactly as-is,
                    # including their existing "projects" field.
                    people_dict[name] = person

                # Replace the list with the new dictionary
                dept["people"] = people_dict

    return data

def people_to_keyed_dict(data):
    

    # Ensure we have a list of institutions
    if isinstance(data, dict) and "institutions" in data:
        institutions = data["institutions"]
    elif isinstance(data, list):
        institutions = data
    else:
        raise TypeError("Data must be a list of institutions or contain 'institutions'")

    for institution in institutions:

        # Safety: skip if not a dict
        if not isinstance(institution, dict):
            continue

        for dept in institution.get("departments", []):

            # Safety: skip if not a dict
            if not isinstance(dept, dict):
                continue

            people_dict = {}

            for person in dept.get("people", []):
                if not isinstance(person, dict):
                    continue

                name = person.get("person_name")
                if not name:
                    continue

                # Build dictionary keyed by person name
                people_dict[name] = {
                    "main_field": person.get("main_field"),
                    "project_role": person.get("project_role"),
                    "person_email": person.get("person_email"),
                    "person_phone": person.get("person_phone"),
                    "bio": person.get("bio"),
                    "expertise_1": person.get("expertise_1"),
                    "expertise_2": person.get("expertise_2"),
                    "expertise_3": person.get("expertise_3"),
                }

            # Replace list with the new dict
            dept["people"] = people_dict

    return data


def attach_projects_to_people(data):
    # Identify where the institutions are stored
    if isinstance(data, dict) and "institutions" in data:
        institutions = data["institutions"]
    elif isinstance(data, list):
        institutions = data
    else:
        raise TypeError("Data must contain institution list or 'institutions' dict key")

    people_lookup = {}

    for institution in institutions:
        for dept in institution.get("departments", []):
            people = dept.get("people", {})
            for person_name, person_info in people.items():

                # Add a projects list if missing
                person_info.setdefault("projects", [])

                # Register in flat lookup
                people_lookup[person_name] = person_info

    # Now process projects
    projects = data.get("projects", [])

    for project in projects:
        # lead_person is always a single string
        lead = project.get("lead_person")

        # principal_investigators may be a list
        pis = project.get("principal_investigators", [])

        # Combine both lists safely
        involved_people = set()
        if lead:
            involved_people.add(lead)
        if isinstance(pis, list):
            involved_people.update(pis)

        # Assign project to all involved people
        for person_name in involved_people:
            if person_name in people_lookup:
                people_lookup[person_name]["projects"].append(project)

    return data



if __name__ == "__main__":
    
    with open("../unprocessed/nih_projects.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    data = convert_people_to_keyed_dict(data)
    data = attach_projects_to_people(data)
    with open("../processed/nih_projects_formatted.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
        
    with open("../processed/post_cleaning_nih_maine_data.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    data = people_to_keyed_dict(data)
    data = attach_projects_to_people(data)
    with open("../processed/nih_maine_data_formatted.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
        
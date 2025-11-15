"""
Filename: person-department-scraper.py
Author: Lucas Matheson
Edited by: Lucas Matheson
Date: November 08, 2025

The USM website contains many departments that contain professors and their research projects/publications. This
is great data to include in our database. This scraper will go through each department page, grab each person,
then go to their individual page to grab their projects/publications. The results of the scrape will be output to a json file.

Notes:
    For leadperson_id and person_id, are we just assuming there is only two people per project? I think it would make more sense to allow for multiple people per project
    It could look something like this
    project_people (
        project_id BIGINT UNSIGNED,
        person_id BIGINT UNSIGNED,
        role ENUM('lead', 'contributor')
    )

    Also, for each person in a project, we need to have that person in the people table first before we can add them to the project_people table
    this means we would need a department for them as well, or leave it null. It can also be done during the cleaning phase

    We recieved lots of feedback about transparency about data sources. Something needs to be added to address this issue. It could also be a hard coded
    page on the frontend that lists all data sources with links to the original pages, including the time it was scraped
"""

import re
import requests
from bs4 import BeautifulSoup
import json


def scrape_usm_person(url):
    # Gets around certian anti scraper measures
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/117.0.0.0 Safari/537.36"
        )
    }

    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    projects = []
    expertise_list = []
    
    # These grabs the bio of the person. Depending on the profile, sometimes it is
    # Found in .kt-inside=inner-col, and sometimes in .bio. Grab both
    bio = soup.select(".kt-inside-inner-col")
    backup_bio = soup.select(".bio")
    
    # Some profiles have defined expertise and publications under div class .expertise and .publications
    expertise_text = soup.select(".expertise")
    publications = soup.select(".publications")

    # Run a check to see which bio is used
    bio = ''
    if backup_bio:
        # the bio under .bio is a unordered list of sections, all contained in p wrappers
        # This iterates over them and saves the results to one string
        all_bio = backup_bio[0].find_all("p")
        for block in all_bio:
            bio += block.get_text(strip=True) + ' '
    
    if publications:
        # simular to .bio, all publications defined on the usm website are wrapped in <p>, 
        # grab all of them and iterate over them
        all_publications = publications[0].find_all("p")
        for pub in all_publications:
            # The project object we look to create
            project = {
                "project_title": "",
                "project_description": "",
                "start_date": None,
                "end_date": None,
            }
            if pub.get_text(strip=True) == "":
                continue
            # If something is <strong> (bolded) on the website, its often not a publication and 
            # a header that isn't wrapped in a header tag, so ignore it
            if "<strong>" in pub.decode_contents():
                continue
            publication = pub.get_text(strip=True)
            project["project_title"] = publication
            # This regex searches the publication looking for a publish year. If it finds it, save it to end_date
            match = re.search(r"\((\d{4})\)", publication)

            if match:
                project["end_date"] = match.group(1)

            projects.append(project)
    if expertise_text:
        # the expertise is found in p tag, with each tag seperated by a comma
        # So seperate by comma and take first three as expertise_1,2,3.
        expertise = expertise_text[0].get_text(strip=True)
        expertise_list = expertise.split(",")
    return projects, bio, expertise_list


def scrape_usm_department(url):
    # Gets around anti scraping measures
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/117.0.0.0 Safari/537.36"
        )
    }

    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    # Build a dict keyed by person name for easy lookups
    people_by_name = {}
    
    # On the department website when inspecting it, each person is encapsalated by 
    # .grid_item.people_item.kt_item_fade_in.kad_people_fade_in.postclass. So grabbing
    # This will allow us to iterate over each person indiviually, keeping data consistent
    person_blocks = soup.select(
        ".grid_item.people_item.kt_item_fade_in.kad_people_fade_in.postclass"
    )

    # department/title element (string) for all people on this page
    dept_elem = soup.select_one(".entry-site-title")
    dept_name = dept_elem.get_text(strip=True) if dept_elem else ""
    print("Scraping department:", dept_name)
    for block in person_blocks:
        # Name tag is found at header three
        name_tag = block.find("h3")
        if not name_tag:
            continue

        name = name_tag.get_text(strip=True)

        # default person record
        person = {
            "department": dept_name,
            "person_email": "",
            "person_phone": "",
            "profile_url": "",
            "bio": "",
            "expertise_1": None,
            "expertise_2": None,
            "expertise_3": None,
            "main_field": None,
            "projects": [],
        }

        link_tag = block.find("a", href=True)
        if link_tag and link_tag.find("h3"):
            # if a persons link exists, grab it to scrape later
            person["profile_url"] = link_tag.get("href")
            projects, bio, expertise_list = scrape_usm_person(link_tag.get("href"))
            person["projects"] = projects
            person["bio"] = bio
            temp = 1
            for i in range(len(expertise_list)):
                if temp >= 3:
                    break
                # Max tag length is 100 characters
                if len(expertise_list[i].strip()) < 100:
                    person["expertise_" + str(temp)] = expertise_list[i].strip()
                    # Expertise added, ensure we only add three
                    temp += 1
        tel_tag = block.find("a", href=lambda x: x and x.startswith("tel:"))
        if tel_tag:
            person["person_phone"] = tel_tag.get_text(strip=True)

        # Looking for @maine.edu in the <a> tag ensure that we just grab the person's email and no other text wrapped in <a>
        email = block.find("a", href=lambda x: x and "@maine.edu" in x)
        if email:
            person["person_email"] = email.get_text(strip=True)

        title = block.find("p")
        if title:
            # Sometimes p tag contains strong tag. If thats the case its going to grab their pronouns instead of bio/title
            # Everytime this is the case, li is the correct bio/title
            if "<strong>" in title.decode_contents():
                title = block.find("li")
                if not title:
                    title = ""
                else:
                    title = title.get_text(strip=True)

        people_by_name[name] = person

    return people_by_name, dept_name

#  AI generated by ChatGPT to print the data in a readable format
#  Primarily for debugging purposes
def print_institution_data(data):
    spacing = "  "

    # --- Institution Info ---
    institution = data.get("institution", {})
    print(f"{spacing}Institution: {institution.get('institution_name', 'N/A')}")
    print(f"{spacing}  Type: {institution.get('institution_type', 'N/A')}")
    print(
        f"{spacing}  Address: {institution.get('street', '')}, {institution.get('city', '')}, "
        f"{institution.get('state', '')} {institution.get('zipcode', '')}"
    )
    print(f"{spacing}  Phone: {institution.get('institution_phone', 'N/A')}")
    print()

    # --- Departments ---
    departments = data.get("departments", {})
    for dept_key, dept in departments.items():
        print(f"{spacing}Department: {dept.get('department_name', dept_key)}")
        print(f"{spacing}  Email: {dept.get('department_email', 'N/A')}")
        print(f"{spacing}  Phone: {dept.get('department_phone', 'N/A')}")
        print()

        # --- People ---
        people = dept.get("people", {})
        for person_name, person_data in people.items():
            print(f"{spacing}  Name: {person_name}")
            print(f"{spacing}    Title/Bio: {person_data.get('bio', 'N/A')}")
            print(f"{spacing}    Email: {person_data.get('person_email', 'N/A')}")
            print(f"{spacing}    Phone: {person_data.get('person_phone', 'N/A')}")
            print(f"{spacing}    Profile: {person_data.get('profile_url', 'N/A')}")

            # Expertise
            expertise = [person_data.get(f"expertise_{i}") for i in range(1, 4)]
            expertise = [e for e in expertise if e]
            if expertise:
                print(f"{spacing}    Expertise: {', '.join(expertise)}")

            # Projects
            projects = person_data.get("projects", [])
            if projects:
                print(f"{spacing}    Projects:")
                for i, project in enumerate(projects, start=1):
                    print(f"{spacing}      Project {i}:")
                    print(
                        f"{spacing}        Title: {project.get('project_title', 'N/A')}"
                    )
                    print(
                        f"{spacing}        Description: {project.get('project_description', 'N/A')}"
                    )
                    print(
                        f"{spacing}        Start Date: {project.get('start_date', 'N/A')}"
                    )
                    print(
                        f"{spacing}        End Date: {project.get('end_date', 'N/A')}"
                    )
            print()  # newline between people
        print("-" * 60)  # separator between departments
        print()


if __name__ == "__main__":
    # Base data structure
    usm_data = {
        "institution": {
            "institution_name": "University of Southern Maine",
            "institution_type": "University",
            "street": "96 Falmouth St",
            "city": "Portland",
            "state": "Maine",
            "zipcode": "04038",
            "institution_phone": "800-800-4876",
        },
        "departments": {},
    }
    # List of USM department people pages to scrape
    usm_department_pages = [
        "https://usm.maine.edu/department-computer-science/people/",
        "https://usm.maine.edu/department-physics/people/",
        "https://usm.maine.edu/department-chemistry/people/",
        "https://usm.maine.edu/department-linguistics/people/",
        "https://usm.maine.edu/department-mathematics-statistics/people/",
        "https://usm.maine.edu/department-engineering/people/",
        "https://usm.maine.edu/department-art/people/",
        "https://usm.maine.edu/communication-media-studies-department/people/",
        "https://usm.maine.edu/department-history/people/",
        "https://usm.maine.edu/department-biological-sciences/people/",
        "https://usm.maine.edu/department-technology/people/",
        "https://usm.maine.edu/department-sociology-criminology/people/",
        "https://usm.maine.edu/department-exercise-health-sport-sciences/people/",
        "https://usm.maine.edu/department-psychology/people/",
        "https://usm.maine.edu/department-english/people/",
        "https://usm.maine.edu/department-political-science/people/",
        "https://usm.maine.edu/department-environmental-science-policy/people/",
        "https://usm.maine.edu/department-theatre/people/",
        "https://usm.maine.edu/social-behavioral-sciences/people/",
        "https://usm.maine.edu/school-social-work/people/",
        "https://usm.maine.edu/college-management-human-services/people/",
    ]

    for url in usm_department_pages:
        try:
            usm_scraped_data = {}
            dept = ""
            usm_scraped_data, dept = scrape_usm_department(url)
            # usm does not have a dept email or phone, store as None
            usm_data["departments"][dept] = {
                "department_name": dept,
                "department_email": None, 
                "department_phone": None,
                "people": usm_scraped_data,
            }

        except Exception as e:
            print("Error during scrape:", e)
    print('Saving results to ../data/unprocessed/pre_cleaning_usm_data.json')
    with open("../data/unprocessed/pre_cleaning_usm_data.json", "w") as f:
        json.dump(usm_data, f, indent=4)


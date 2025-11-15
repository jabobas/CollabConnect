"""
Filename: format_roux_data.py
Author: Lucas Matheson
Edited by: Lucas Matheson
Date: November 12, 2025

The Roux Institute data (scraped by Wyatt) came back good and in a good format.
However, to ensure that it can be inserted easily into the database using
db_init.py, it needs to be formatted differently to match the insert 
algorithm. 
"""

import json

def format_data():
    json_data = get_json_data("../data/unprocessed/roux_institute_data.json")

    institution = json_data['Institution']
    department = json_data['Department']
    people = json_data['Person']
    formatted_data = {}
    formatted_data["institution"] = institution[0]

    formatted_data["departments"] =  {
        department[0]['department_name']: {
            "department_name": department[0]['department_name'],
            "department_email": department[0]['department_email'],
            "department_phone": department[0]['department_phone'],
            "people": {}
            }
        }
    for curr in people:
        formatted_data["departments"][department[0]['department_name']]['people'][curr['person_name']] = {
                    "person_email": curr['person_email'],
                    "person_phone": curr['person_phone'],
                    "bio": curr['bio'],
                    "expertise_1": curr['expertise_1'],
                    "expertise_2": curr['expertise_2'],
                    "expertise_3": curr['expertise_3'],
                    "main_field": curr['main_field'],
                    "projects": []
        }

    print(formatted_data)
    return formatted_data
    
    
def get_json_data(file_path: str):
    # util function that needs to read in all the json data and return it based on file path
    with open(file_path, "r") as f:
        return json.load(f)



if __name__ == "__main__":
    data = format_data()
    with open("../data/processed/post_formatting_roux_data.json", "w") as f:
        json.dump(data, f, indent=4)
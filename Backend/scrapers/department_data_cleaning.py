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


if __name__ == '__main__':

    path = Path("../data/pre_cleaning_usm_data.json")
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
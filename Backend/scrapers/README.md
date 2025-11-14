# Table of Contents

- [Aubin's Scraper](#aubin)
- [Abbas's Scraper](#abbas)
- [Wyatt's Scraper](#wyatt)
- [Lucas's Scraper](#lucas)

# Aubin

# NIH Scraper Documentation

## What it does

Scrapes research projects from [NIH Reporter](https://reporter.nih.gov/) and loads them into the database. Extracts:
- Projects and their details
- Principal investigators
- Institutions and departments
- WorkedOn relationships (who worked on which project)
- BelongsTo relationships (department-institution connections)

---

## How to run

### 1. Scrape NIH data (saves to JSON)

```bash
cd Backend/scrapers

# Get Maine research projects
python nih_scraper.py --keyword "research" --limit 50 --state ME

# Filter by different keywords
python nih_scraper.py --keyword "cancer" --limit 100 --state ME
```

**Output:** Creates `Backend/scrapers/data/nih_projects.json`

### 2. Load JSON into database

```bash
python json_loader.py --input data/nih_projects.json
```

### 3. Verify in MySQL

```sql
mysql -u root -p collab_connect_db

-- Check loaded data
SELECT COUNT(*) FROM Institution;
SELECT COUNT(*) FROM Project;
SELECT COUNT(*) FROM WorkedOn;

-- View projects with investigators
SELECT p.person_name, pr.project_title, w.project_role
FROM WorkedOn w
JOIN Person p ON w.person_id = p.person_id
JOIN Project pr ON w.project_id = pr.project_id
LIMIT 10;
```

---

## Command options

```bash
# Filter by state (Maine)
--state ME

# Search keyword
--keyword "cancer research"

# Number of results
--limit 100

# Output file path
--output data/my_projects.json
```

---

## Files

- `nih_scraper.py` - Scrapes NIH Reporter API
- `json_loader.py` - Loads JSON into database
- `data/nih_projects.json` - Scraped data
- `nih_workedon_loader.py` - Original scraper (backup)

---

## Dependencies

```bash
pip install requests mysql-connector-python
```

# Abbas

Scraper readme for **Abbas** goes here.

# Wyatt

Scraper readme for **Wyatt** goes here.

# Lucas

Any questions about my scraper or data cleaning processes can be directed to lucas.matheson@maine.edu 

My scraper was the usm-scraper. This scraper uses a array of hard coded departments linked to usm's
many departments and scrapes each person off of their departments page. When doing this, it also 
grabs that person's personal page link. This link is then used to scrape more information about the 
person and save it into a dictonary like such. 

```
{
    "institution": {
        "institution_name": "University of Southern Maine",
        "institution_type": "University",
        "street": "96 Falmouth St",
        "city": "Portland",
        "state": "Maine",
        "zipcode": "04038",
        "institution_phone": "800-800-4876"
    },
    "departments": {
        "Department of Computer Science": {
            "department_name": "Department of Computer Science",
            "department_email": null,
            "department_phone": null,
            "people": {
                "James Quinlan": {
                    "department": "Department of Computer Science",
                    "person_email": "james.quinlan@maine.edu",
                    "person_phone": "(207) 780-4723",
                    "profile_url": "https://usm.maine.edu/directories/?p=32161",
                    "bio": "Bio Here",
                    "expertise_1": null,
                    "expertise_2": null,
                    "expertise_3": null,
                    "main_field": null,
                    "projects": [
                        {
                            "project_title": "Lambers, J. V., Mooney, A. S., Montiforte, V. A., & Quinlan, J. (2025).Explorations in numerical analysis and machine learning with Julia.World Scientic.",
                            "project_description": "",
                            "start_date": null,
                            "end_date": "2025"
                        },
                    ]
                }
            }
        }
    }
}
```

This data structure allows easy inserts into the database through db_init and clear ownership for each dependancy. 

## Running usm-scraper

    Running usm-scraper is a straight forward process. First, cd into the backend and activate your
    python virtual enviornment. This should include all the dependancies to run the scraper if
    it was created while following the set up guide. If not refer to the README located in the root 
    directory of the backend folder to ensure all dependancies are downloaded and your python venv is
    set up properly. 

    Once the python virtual enviornment is active, cd into the scrapers file. While here, run
    `python usm-scraper.py` While it runs, it will print each department that it is actively scraping. 
    This process takes some time. Once it is finished, it will dump all the json into 
    `backend/data/unprocessed/pre_cleaning_usm_data.json`


## Cleaning the usm data

    When running through the data, you will see some things that need to be cleaned. There are unicode's present in
    some of the fields, phone numbers are often not formated consistently, and almost no one as expertise fields. Cleaning 
    the data will fix this among other small data tweaks. To clean the data, cd out of scrapers using ` cd .. ` and 
    cd into data, then cd into data-cleaning. This is where all the data cleaning scripts reside. Run 
    `python usm_data_cleaning.py` to begin the cleaning process, which only takes a second. The cleaned data will be
    saved into `backend/data/processed/post_cleaning_usm_data.json`

    Something to note about the cleaning algorithm. When looking at the data after running the script, you'll notice
    that the expertise and main field are still blank. This is because these are generated using the OpenAI API to take in a person's bio, department, and projects and generate these tags to best describe them from a set of tags it can use. This API is not free,
    so it is commented out and skipped after it was ran once to get the production data.
    
    If you wish to see the expertise and main field generation, create an account through OpenAI and get an API key to use. You will 
    need to pay OpenAI ~5-10 dollars to get enough credits to generate tags for everyone that was scraped. Once you have the key, you can define this key inside of your config.ini file. Then, uncomment the OpenAI generate methods in `usm_data_cleaning.py` and the file will generate all the tags. Please note this takes a significate amount of time to generate all the tags

    

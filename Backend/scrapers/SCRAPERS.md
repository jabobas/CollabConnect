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

````markdown
# SQL Queries Package

Self-contained MySQL scripts for the `WorkedOn` and `BelongsTo` deliverables.  
Run them independently from the rest of the team's schema to avoid merge conflicts.

## Folder structure

```
Backend/
├── Queries/
│   ├── tables/         # DDL for WorkedOn & BelongsTo
│   ├── indexes/        # supporting indexes
│   ├── procedures/     # CRUD stored procedures
│   └── demo/           # sample CALL statements
├── scrapers/
│   ├── nih_scraper.py      # Fetch NIH projects
│   ├── json_loader.py      # Load JSON into database
│   └── SCRAPERS.md         # Usage documentation
├── data/
│   └── nih_projects.json   # Scraped data
├── config.ini.example      # Database config template
└── app.py                  # Flask application
```

## Setup & Execution Order

### 1. Configure Database Connection
```bash
# Copy the config template
cp Backend/config.ini.example Backend/config.ini

# Edit config.ini and update your MySQL password
# db_password = YOUR_PASSWORD_HERE
```

### 2. Initialize Database Tables
Run these scripts in order (assumes Person, Project, Department, Institution tables already exist):

```bash
# Create tables
mysql -u root -p collab_connect_db < Backend/Queries/tables/workedon.sql
mysql -u root -p collab_connect_db < Backend/Queries/tables/belongsto.sql

# Add indexes
mysql -u root -p collab_connect_db < Backend/Queries/indexes/workedon_indexes.sql
mysql -u root -p collab_connect_db < Backend/Queries/indexes/belongsto_indexes.sql

# Register stored procedures
mysql -u root -p collab_connect_db < Backend/Queries/procedures/workedon_crud.sql
mysql -u root -p collab_connect_db < Backend/Queries/procedures/belongsto_crud.sql

# (Optional) Test the procedures
mysql -u root -p collab_connect_db < Backend/Queries/demo/sample_usage.sql
```

### 3. Scrape and Load Data
```bash
cd Backend/scrapers

# Scrape NIH projects (creates data/nih_projects.json)
python nih_scraper.py --keyword "research" --limit 50 --state ME

# Load scraped data into database
python json_loader.py --input ../data/nih_projects.json
```

### 4. Run the Flask Application
```bash
cd Backend
python app.py
```

## Notes

- Tables use `CHECK` constraints and cascading foreign keys, so run on MySQL 8.0+.
- The companion JSON loader script (`Backend/scrapers/json_loader.py`) loads NIH data through the stored procedures, pushing both WorkedOn rows (investigators) and BelongsTo relationships (department → institution).

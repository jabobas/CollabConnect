# CollabConnect - Course Project for COS457

CollabConnect is an application that facilitates collaboration and connection between academics and industry professionals. It addresses the gap between wanting or needing a collaborator for a project and finding a suitable collaborator. The app will provide users the opportunity to search a directory of potential collaborators and view attributes of professional peers that make them a good match for the proposed project. A user may also visualize graphs of connections between professionals for better decision-making and understanding.

# Team Contributions Phase 1
## Abbas Jabor (abbas.jabor@maine.edu) LEADER - jabobas
* MAIN TASK: Normal Form Discussion
* ER Diagram (draft 1)
* Interviewed Timothy Burke
* Normal Forms Discussion
* Worked on the presentation
## Aubin Mugisha (aubin.mugisha@maine.edu) - Aubin01
* MAIN TASK: Complete the ER Diagram and do the Data Dictionary
* ER Diagram (draft 3)
* Data dictionary
* Cardinalities
* Worked on the presentation
## Lucas Matheson (lucas.matheson@maine.edu) - lmatheson2026
* Collected survey results, summarized them
* Designed survey
* Interviewed David Levine
* Analyzed/organized survey results
* Also created a requirement document based on interviews
* Worked on the presentation
## Wyatt McCurdy (wyatt.mccurdy@maine.edu) - wyattmccurdy12
* MAIN TASK: Requirements Document
* ER Diagram (draft 2)
* Requirements document
* Helped interview Timothy Burke
* Worked on the presentation


# Team contributions Phase 2
Phase 2 Project Responsibilities
Websites scraped: 
- https://usm.maine.edu/department-computer-science/people/ 
- https://reporter.nih.gov/
- https://roux.northeastern.edu/our-people/

Abbas: 
- Create Table Project, Tag, ProjectTag (Nov 2)
- CRUD for Project, Tag, ProjectTag (Nov 5)
- Provide Index Commands for Project, Tag, ProjectTag (Nov 2)
- Function/Stored Procedure Project, Tag, ProjectTag (Nov 5)
- Try to scrape https://reporter.nih.gov/ for industry(Nov 10)
- Try to scrape or find a library of tags for the Tags table (Nov 10)


Lucas: 
- Created tables department and institution
- Stored procedures for department and institution
- Scrape USM’s departments
    - Starting with https://usm.maine.edu/department-computer-science/people/
- Created general db creation in python
- db_init.py creates database, all tables, indexes, and procedures
- Formatted all json to be inserted into the database
- app.py creates flask app to interact with MySQL Workbench
- General code review, updates to procedures, tables, and functions to better fit project requirements
- Created baseline unit tests for department, instituion, and person to ensure database is functional before data insertion


Wyatt: 
- Created Table Person, relation WorksIn (Nov 2) 
- Write CRUD for Person, WorksIn (Nov 5)
- Write Index commands for Person, WorksIn (Nov 2)
- Create Function/Stored Procedure Person (Nov 5)
- Query Optimization on 1 query
-> Scraping the https://roux.northeastern.edu/our-people/ for all tables


Aubin: 
- Create Tables WorkedOn, BelongsTo  (Nov 2)
- Write CRUD for WorkedOn, BelongsTo (Nov 5)
- Create Index commands for WorkedOn, BelongsTo (Nov 2)
- CreateFunction/Stored Procedure WorkedOn, BelongsTo (Nov 10)
- Scrape site https://reporter.nih.gov/ (Nov 10)
- Query Optimization on 1 query

# Team contributions Phase 3
Abbas: 
- Created routes for project, project_tag, and tag endpoints so you can use their procedures. The tag entity was removed from the database so the route for it is not necessary. 
- I created a backend logger that logs when a user preforms any action related to the routes we have. 
- Created a project search page and project page for the frontend.
- Created installation and API document

---

## Logging System & ACID Compliance

### Overview
CollabConnect implements a comprehensive logging system that tracks all user actions, errors, and system events. The logger is critical for audit trails, debugging, and maintaining ACID compliance through transaction documentation.

### Implementation

**Location:** `Backend/utils/logger.py` → logs to `Backend/logs/app.log`

**Core Functions:**
- `log_info(message)` - Log successful operations
- `log_error(message)` - Log errors with context
- `get_request_user()` - Extract user ID from JWT token, format as `[User: ID]` or `[anonymous]`

**Configuration:**
- RotatingFileHandler: 10 MB max per file, keeps 10 backups
- All logs include timestamp, user ID, operation type, and outcome
- Applied to all 8 route files (auth, user, project, person, department, institution, tag, project_tag)

### Example Log Format
```
2025-12-07 15:45:23 - CollabConnect - INFO - [User: 42] Fetching all projects (count=333)
2025-12-07 15:45:24 - CollabConnect - ERROR - [User: 42] Unauthorized: Cannot delete project owned by User: 50
```

### ACID Compliance Through Logging

| ACID Property | How Logging Ensures It |
|---|---|
| **Atomicity** | Logs all steps; missing completion log = transaction failed/rolled back |
| **Consistency** | Logs constraint violations (e.g., duplicate profile claims, invalid operations) |
| **Isolation** | User-prefixed logs track concurrent operations; database locks prevent conflicts |
| **Durability** | RotatingFileHandler persists logs to disk immediately; survives server crashes |

### Transaction Management

- **User Context:** Every operation logged with authenticated user ID for accountability
- **Error Context:** Failed operations logged with full details (user, operation, error message)
- **Audit Trail:** Complete record of who did what, when, and the outcome
- **Recovery:** On restart, logs show incomplete transactions that need rollback

### Benefits

1. **Accountability** - All actions traced to user
2. **Debugging** - Complete operation history
3. **Compliance** - Regulatory audit trail
4. **Security** - Detect unauthorized attempts
5. **Integrity** - Verify ACID properties hold across failures

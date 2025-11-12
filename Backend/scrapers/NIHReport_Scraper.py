'''Backend/scrapers/NIHReport_Scraper.py
Scraper for NIH RePORTER data focusing on Maine institutions.
Uses the official NIH RePORTER API to fetch project data.
Extracts institution, department, person, project, and tag information.
Saves data to MySQL database and CSV files for inspection.

Requires:
pip install requests pandas mysql-connector-python

Author: Abbas Jabor, Made completely by AI
Date: November 11, 2025'''

import requests
import pandas as pd
import time
import json
from datetime import datetime
import mysql.connector
from typing import Dict, List, Optional

class NIHRePORTERScraper:
    def __init__(self):
        self.base_url = "https://api.reporter.nih.gov/v2/projects/search"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Content-Type': 'application/json'
        })
    
    def search_maine_projects(self, max_results: int = 1000):
        """Search for projects with Maine institutions using the official API"""
        projects = []
        offset = 0
        limit = 500  # Maximum allowed per request
        
        while len(projects) < max_results:
            payload = {
                "criteria": {
                    "org_states": ["ME"]  # Maine state code
                },
                "include_fields": [
                    "ApplId", "SubprojectId", "FiscalYear", "ProjectNum", 
                    "ProjectSerialNum", "Organization", "OrganizationType",
                    "AwardType", "ActivityCode", "AwardAmount", "ProjectNumSplit",
                    "PrincipalInvestigators", "ProgramOfficers", "AgencyIcAdmin",
                    "AgencyIcFundings", "CongDist", "ProjectStartDate", 
                    "ProjectEndDate", "OpportunityNumber", "FullStudySection",
                    "AwardNoticeDate", "CoreProjectNum", "PrefTerms", 
                    "ProjectTitle", "PhrText", "SpendingCategoriesDesc", 
                    "ArraFunded", "BudgetStart", "BudgetEnd", "CfdaCode",
                    "FundingMechanism", "DirectCostAmt", "IndirectCostAmt"
                ],
                "offset": offset,
                "limit": limit,
                "sort_field": "project_start_date",
                "sort_order": "desc"
            }
            
            try:
                response = self.session.post(self.base_url, json=payload, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    new_projects = data.get('results', [])
                    
                    if not new_projects:
                        break  # No more results
                    
                    projects.extend(new_projects)
                    total_count = data.get('meta', {}).get('total', 0)
                    
                    print(f"Offset {offset}: Found {len(new_projects)} projects (Total: {total_count})")
                    
                    # Check if we've reached the end
                    if len(new_projects) < limit:
                        break
                    
                    offset += limit
                    time.sleep(0.5)  # Be respectful of rate limits
                    
                else:
                    print(f"Error: {response.status_code} - {response.text}")
                    break
                    
            except Exception as e:
                print(f"Error fetching data: {e}")
                break
        
        return projects[:max_results]

    def extract_institution_info(self, project_data: Dict) -> Dict:
        """Extract institution information from project data"""
        org = project_data.get('organization', {})
        
        institution = {
            "institution_name": org.get('org_name', ''),
            "institution_type": org.get('org_department', ''),
            "street": "",  # Not available in API
            "city": org.get('org_city', ''),
            "state": org.get('org_state', 'ME'),
            "zipcode": org.get('org_zipcode', ''),
            "institution_phone": ""  # Not available in API
        }
        return institution

    def extract_department_info(self, project_data: Dict, institution_id: int) -> Dict:
        """Extract department information"""
        org = project_data.get('organization', {})
        
        department = {
            "institution_id": institution_id,
            "department_name": org.get('dept_type', 'Unknown Department'),
            "department_email": "",  # Not available in API
            "department_phone": ""   # Not available in API
        }
        return department

    def extract_person_info(self, project_data: Dict, department_id: int) -> Dict:
        """Extract principal investigator information"""
        pis = project_data.get('principal_investigators', [])
        pi = pis[0] if pis else {}
        
        # Extract expertise from terms
        terms = project_data.get('pref_terms', [])
        expertise = [term.get('term', '') for term in terms[:3]]  # Get first 3 terms
        
        person = {
            "person_name": pi.get('full_name', ''),
            "person_email": pi.get('email', ''),
            "person_phone": "",  # Not available in API
            "bio": "",  # Not available in API
            "expertise_1": expertise[0] if len(expertise) > 0 else '',
            "expertise_2": expertise[1] if len(expertise) > 1 else '',
            "expertise_3": expertise[2] if len(expertise) > 2 else '',
            "main_field": project_data.get('activity_code', ''),
            "department_id": department_id
        }
        return person

    def extract_project_info(self, project_data: Dict, person_id: int, lead_person_id: int) -> Dict:
        """Extract project information"""
        project = {
            "project_title": project_data.get('project_title', ''),
            "project_description": project_data.get('phr_text', ''),
            "leadperson_id": lead_person_id,
            "start_date": self.parse_date(project_data.get('project_start_date')),
            "end_date": self.parse_date(project_data.get('project_end_date')),
            "person_id": person_id
        }
        return project

    def extract_tags(self, project_data: Dict) -> List[str]:
        """Extract tags/keywords from project data"""
        tags = []
        
        # Add activity code as tag
        if project_data.get('activity_code'):
            tags.append(project_data['activity_code'])
        
        # Add funding mechanism
        if project_data.get('funding_mechanism'):
            tags.append(project_data['funding_mechanism'])
        
        # Add terms/keywords
        terms = project_data.get('pref_terms', [])
        for term in terms[:2]:  # Limit to 2 additional tags
            tag = term.get('term', '')
            if tag and tag not in tags:
                tags.append(tag)
        
        return [tag[:50] for tag in tags if tag]  # Ensure tag length <= 50

    def determine_institution_type(self, org_type_data: Dict) -> str:
        """Determine institution type based on organization type data"""
        if not org_type_data:
            return 'Other'
        
        name = org_type_data.get('name', '').lower()
        code = org_type_data.get('code', '')
        
        if any(word in name for word in ['university', 'college']):
            return 'Academic'
        elif 'hospital' in name or 'medical' in name:
            return 'Medical'
        elif 'institute' in name or 'research' in name:
            return 'Research Institute'
        else:
            return 'Other'

    def parse_date(self, date_str: str) -> Optional[str]:
        """Parse date string into YYYY-MM-DD format"""
        if not date_str:
            return None
        try:
            # Remove timezone information if present
            date_str = date_str.split('T')[0]
            return datetime.strptime(date_str, '%Y-%m-%d').strftime('%Y-%m-%d')
        except:
            return None

    # def save_to_database(self, projects_data: List[Dict]):
    #     """Save extracted data to MySQL database using your schema"""
    #     try:
    #         # Database connection - update with your credentials
    #         conn = mysql.connector.connect(
    #             host='your_host',
    #             user='your_username',
    #             password='your_password',
    #             database='your_database'
    #         )
    #         cursor = conn.cursor()

    #         for project_data in projects_data:
    #             try:
    #                 # 1. Insert Institution
    #                 institution_info = self.extract_institution_info(project_data)
    #                 cursor.execute("""
    #                     INSERT IGNORE INTO Institution 
    #                     (institution_name, institution_type, street, city, state, zipcode, institution_phone)
    #                     VALUES (%s, %s, %s, %s, %s, %s, %s)
    #                 """, tuple(institution_info.values()))
    #                 institution_id = cursor.lastrowid

    #                 # If institution wasn't inserted (already exists), get its ID
    #                 if institution_id == 0:
    #                     cursor.execute("""
    #                         SELECT institution_id FROM Institution 
    #                         WHERE institution_name = %s
    #                     """, (institution_info['institution_name'],))
    #                     result = cursor.fetchone()
    #                     institution_id = result[0] if result else None

    #                 if not institution_id:
    #                     continue

    #                 # 2. Insert Department
    #                 department_info = self.extract_department_info(project_data, institution_id)
    #                 cursor.execute("""
    #                     INSERT IGNORE INTO Department 
    #                     (institution_id, department_name, department_email, department_phone)
    #                     VALUES (%s, %s, %s, %s)
    #                 """, tuple(department_info.values()))
    #                 department_id = cursor.lastrowid

    #                 if department_id == 0:
    #                     cursor.execute("""
    #                         SELECT department_id FROM Department 
    #                         WHERE institution_id = %s AND department_name = %s
    #                     """, (institution_id, department_info['department_name']))
    #                     result = cursor.fetchone()
    #                     department_id = result[0] if result else None

    #                 if not department_id:
    #                     continue

    #                 # 3. Insert Person
    #                 person_info = self.extract_person_info(project_data, department_id)
    #                 cursor.execute("""
    #                     INSERT IGNORE INTO Person 
    #                     (person_name, person_email, person_phone, bio, expertise_1, expertise_2, expertise_3, main_field, department_id)
    #                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    #                 """, tuple(person_info.values()))
    #                 person_id = cursor.lastrowid

    #                 if person_id == 0:
    #                     cursor.execute("""
    #                         SELECT person_id FROM Person 
    #                         WHERE person_email = %s
    #                     """, (person_info['person_email'],))
    #                     result = cursor.fetchone()
    #                     person_id = result[0] if result else None

    #                 if not person_id:
    #                     continue

    #                 # 4. Insert Project
    #                 project_info = self.extract_project_info(project_data, person_id, person_id)
    #                 cursor.execute("""
    #                     INSERT INTO Project 
    #                     (project_title, project_description, leadperson_id, start_date, end_date, person_id)
    #                     VALUES (%s, %s, %s, %s, %s, %s)
    #                 """, tuple(project_info.values()))
    #                 project_id = cursor.lastrowid

    #                 # 5. Insert Tags
    #                 tags = self.extract_tags(project_data)
    #                 for tag in tags:
    #                     if tag:  # Only insert non-empty tags
    #                         # Insert tag if not exists
    #                         cursor.execute("INSERT IGNORE INTO Tag (tag_name) VALUES (%s)", (tag,))
    #                         # Link tag to project
    #                         cursor.execute("""
    #                             INSERT IGNORE INTO Project_Tag (project_id, tag_name)
    #                             VALUES (%s, %s)
    #                         """, (project_id, tag))

    #             except Exception as e:
    #                 print(f"Error processing project: {e}")
    #                 continue

    #         conn.commit()
    #         print(f"Successfully processed {len(projects_data)} projects")

    #     except Exception as e:
    #         print(f"Database error: {e}")
    #     finally:
    #         if 'conn' in locals() and conn.is_connected():
    #             cursor.close()
    #             conn.close()

    def save_to_csv(self, projects_data: List[Dict], filename: str = 'nih_maine_projects.csv'):
        """Save data to CSV files for inspection"""
        # Save raw project data
        df_projects = pd.DataFrame(projects_data)
        df_projects.to_csv(filename, index=False)
        print(f"Raw data saved to {filename}")
        
        # Save extracted data in a more readable format
        extracted_data = []
        for project in projects_data:
            extracted_data.append({
                'project_title': project.get('project_title', ''),
                'organization': project.get('organization', {}).get('org_name', ''),
                'city': project.get('organization', {}).get('org_city', ''),
                'pi_name': project.get('principal_investigators', [{}])[0].get('full_name', ''),
                'start_date': project.get('project_start_date', ''),
                'end_date': project.get('project_end_date', ''),
                'award_amount': project.get('award_amount', ''),
                'activity_code': project.get('activity_code', '')
            })
        
        df_extracted = pd.DataFrame(extracted_data)
        df_extracted.to_csv('extracted_maine_projects.csv', index=False)
        print("Extracted data saved to extracted_maine_projects.csv")

    def run(self):
        """Main method to run the scraper"""
        print("Starting NIH RePORTER Maine projects scrape...")
        
        # Get projects data
        projects = self.search_maine_projects(max_results=100)
        print(f"Found {len(projects)} projects total")
        
        if projects:
            # Save to CSV for inspection
            self.save_to_csv(projects)
            
            # Save to database
            # self.save_to_database(projects)
        else:
            print("No projects found. Please check your search criteria.")

if __name__ == "__main__":
    scraper = NIHRePORTERScraper()
    scraper.run()
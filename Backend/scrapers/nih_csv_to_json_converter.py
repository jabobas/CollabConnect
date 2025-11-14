import csv
import json
from datetime import datetime

def convert_nih_csv_to_json(csv_file_path, output_file_path):
    """
    @abbasjabor
    @november 13 2025
    Genereated by Copilot
    
    Convert NIH Maine projects CSV to JSON format matching CollabConnect schema.
    
    The CSV contains research projects with institutions, departments, and principal investigators.
    This script transforms it into the nested JSON structure that matches the database tables:
    - Institution
    - Department
    - Person (Principal Investigators)
    - Project
    - Project_Tag (through project tags)
    - WorkedOn (person-project relationships)
    """
    
    institutions = {}
    departments = {}
    people = {}
    projects = []
    tags = set()
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                # Parse organization info
                org_info = eval(row.get('organization', '{}')) if row.get('organization') else {}
                org_name = org_info.get('org_name', 'Unknown')
                org_city = org_info.get('org_city', '')
                org_state = org_info.get('org_state', '')
                org_zipcode = org_info.get('org_zipcode', '')
                
                # Create or get institution
                if org_name not in institutions:
                    # Parse organization_type to extract just the name part and clean it
                    org_type = row.get('organization_type', 'Research Institute')
                    if org_type.startswith("{'name':"):
                        try:
                            org_type_dict = eval(org_type)
                            org_type = org_type_dict.get('name', 'Research Institute')
                        except:
                            org_type = 'Research Institute'
                    
                    # Clean up organization type
                    org_type = org_type.strip()
                    org_type_lower = org_type.lower()
                    
                    # Normalize common institution types
                    if 'research institute' in org_type_lower or 'research center' in org_type_lower:
                        org_type = 'Research Institute'
                    elif 'university' in org_type_lower:
                        org_type = 'University'
                    elif 'college' in org_type_lower:
                        org_type = 'College'
                    elif 'hospital' in org_type_lower:
                        org_type = 'Hospital'
                    elif 'non-profit' in org_type_lower or 'nonprofit' in org_type_lower:
                        org_type = 'Non-Profit Organization'
                    elif 'government' in org_type_lower or 'federal' in org_type_lower:
                        org_type = 'Government Agency'
                    else:
                        org_type = 'Research Institute'  # default
                    
                    institutions[org_name] = {
                        'institution_name': org_name,
                        'institution_type': org_type,
                        'street': None,
                        'city': org_city,
                        'state': org_state,
                        'zipcode': org_zipcode[:10] if org_zipcode else None,
                        'institution_phone': None,
                        'departments': {}
                    }
                
                # Department (using activity_code as department identifier for now)
                activity_code = row.get('activity_code', 'General')
                dept_name = f"NIH {activity_code}"
                
                if dept_name not in institutions[org_name]['departments']:
                    institutions[org_name]['departments'][dept_name] = {
                        'department_name': dept_name,
                        'department_email': None,
                        'department_phone': None,
                        'people': {}
                    }
                
                # Parse Principal Investigators
                pis = []
                try:
                    pi_list = eval(row.get('principal_investigators', '[]')) if row.get('principal_investigators') else []
                    pis = pi_list if isinstance(pi_list, list) else []
                except:
                    pis = []
                
                # Add each PI as a person
                for pi in pis:
                    pi_name = pi.get('full_name', '').strip()
                    if pi_name:
                        if pi_name not in institutions[org_name]['departments'][dept_name]['people']:
                            # Use PI title for project_role if available
                            pi_title = pi.get('title', '').strip()
                            
                            # Map NIH activity codes to research disciplines for main_field
                            discipline_mapping = {
                                'U01': 'Biomedical Research',
                                'R01': 'Biomedical Research',
                                'R21': 'Exploratory Research',
                                'R03': 'Biomedical Research',
                                'F31': 'Biology',
                                'F32': 'Biology',
                                'K01': 'Biomedical Research',
                                'P20': 'Health Sciences',
                                'P30': 'Health Sciences',
                                'UH4': 'Public Health',
                                'R13': 'Health Sciences',
                                'R15': 'Biomedical Research',
                                'R24': 'Biomedical Research',
                                'R25': 'Education',
                                'R35': 'Biomedical Research',
                                'R37': 'Biomedical Research',
                                'R44': 'Technology Development',
                                'R61': 'Biomedical Research',
                                'RF1': 'Biomedical Research',
                                'S10': 'Research Infrastructure',
                                'T03': 'Training',
                                'OT2': 'Technology Development',
                                'N01': 'Biomedical Research',
                                'I01': 'Veterans Research',
                                'U45': 'Public Health',
                                'U54': 'Cooperative Research',
                                'R16': 'Education',
                                'R03': 'Biomedical Research',
                            }
                            main_field = discipline_mapping.get(activity_code, 'Biomedical Research')
                            
                            institutions[org_name]['departments'][dept_name]['people'][pi_name] = {
                                'person_name': pi_name,
                                'person_email': None,
                                'person_phone': None,
                                'bio': None,
                                'expertise_1': None,
                                'expertise_2': None,
                                'expertise_3': None,
                                'main_field': main_field,
                                'project_role': pi_title if pi_title else 'Principal Investigator'  # Store title for WorkedOn table
                            }
                
                # Parse project info
                project_title = row.get('project_title', 'Untitled Project')
                project_description = row.get('phr_text', row.get('project_title', ''))
                
                # Parse dates
                try:
                    start_date = datetime.fromisoformat(row.get('project_start_date', '').split('T')[0]).strftime('%Y-%m-%d')
                except:
                    start_date = None
                
                try:
                    end_date = datetime.fromisoformat(row.get('project_end_date', '').split('T')[0]).strftime('%Y-%m-%d')
                except:
                    end_date = None
                
                # Parse tags from pref_terms
                project_tags = []
                try:
                    pref_terms = row.get('pref_terms', '')
                    if pref_terms:
                        project_tags = [tag.strip().lower().replace(' ', '-') for tag in pref_terms.split(';')]
                        tags.update(project_tags)
                except:
                    pass
                
                # Create project
                project = {
                    'project_title': project_title,
                    'project_description': project_description,
                    'lead_person': pis[0].get('full_name', '').strip() if pis else None,
                    'start_date': start_date,
                    'end_date': end_date,
                    'award_amount': float(row.get('award_amount', 0)) if row.get('award_amount') else 0,
                    'funding_mechanism': row.get('funding_mechanism', 'Non-SBIR/STTR'),
                    'tags': project_tags,  # Include all tags, not just first 3
                    'principal_investigators': [pi.get('full_name', '').strip() for pi in pis],
                    'institution': org_name,
                    'department': dept_name
                }
                
                projects.append(project)
        
        # Build final JSON structure matching the database schema
        output_data = {
            'institutions': []
        }
        
        for inst_name, inst_data in institutions.items():
            inst_obj = {
                'institution_name': inst_data['institution_name'],
                'institution_type': inst_data['institution_type'],
                'street': inst_data['street'],
                'city': inst_data['city'],
                'state': inst_data['state'],
                'zipcode': inst_data['zipcode'],
                'institution_phone': inst_data['institution_phone'],
                'departments': []
            }
            
            for dept_name, dept_data in inst_data['departments'].items():
                dept_obj = {
                    'department_name': dept_data['department_name'],
                    'department_email': dept_data['department_email'],
                    'department_phone': dept_data['department_phone'],
                    'people': []
                }
                
                for person_name, person_data in dept_data['people'].items():
                    person_obj = {
                        'person_name': person_data['person_name'],
                        'person_email': person_data['person_email'],
                        'person_phone': person_data['person_phone'],
                        'bio': person_data['bio'],
                        'expertise_1': person_data['expertise_1'],
                        'expertise_2': person_data['expertise_2'],
                        'expertise_3': person_data['expertise_3'],
                        'main_field': person_data['main_field'],
                        'project_role': person_data.get('project_role', 'Principal Investigator')  # Include role for WorkedOn
                    }
                    dept_obj['people'].append(person_obj)
                
                inst_obj['departments'].append(dept_obj)
            
            output_data['institutions'].append(inst_obj)
        
        # Add projects and tags
        output_data['projects'] = projects
        output_data['tags'] = sorted(list(tags))
        
        # Write to JSON file
        with open(output_file_path, 'w', encoding='utf-8') as jsonfile:
            json.dump(output_data, jsonfile, indent=2)
        
        print(f"✅ Successfully converted CSV to JSON")
        print(f"   - Institutions: {len(institutions)}")
        print(f"   - Departments: {sum(len(inst['departments']) for inst in institutions.values())}")
        print(f"   - People: {sum(sum(len(dept['people']) for dept in inst['departments'].values()) for inst in institutions.values())}")
        print(f"   - Projects: {len(projects)}")
        print(f"   - Tags: {len(tags)}")
        print(f"   - Output file: {output_file_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error converting CSV to JSON: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    csv_input = "./data/nih_maine_projects.csv"
    json_output = "./data/post_cleaning_nih_maine_data.json"
    
    convert_nih_csv_to_json(csv_input, json_output)

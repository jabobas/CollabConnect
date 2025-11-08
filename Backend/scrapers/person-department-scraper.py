import requests
from bs4 import BeautifulSoup

"""
Example Data
[
  {
    "institution": {
      "institution_name": "State University",
      "institution_type": "University",
      "street": "123 College Ave",
      "city": "Townsville",
      "state": "TS",
      "zipcode": "12345",
      "institution_phone": "555-1111"
    },
    "departments": [
      {
        "department_name": "Computer Science",
        "department_email": "cs@stateu.edu",
        "department_phone": "555-2222",
        "people": [
          {
            "person_name": "Alice",
            "person_email": "alice@stateu.edu",
            "person_phone": "555-3333",
            "bio": "Researcher in ML",
            "expertise_1": "ml",
            "expertise_2": "nlp",
            "expertise_3": null,
            "main_field": "Computer Science",
            "projects": [
              {
                "project_title": "Project A",
                "project_description": "A study of X",
                "start_date": "2025-01-01",
                "end_date": null,
                "leadperson_email": "alice@stateu.edu",
                "tags": ["AI", "ML"]
              }
            ]
          },
          {
            "person_name": "Bob",
            "person_email": "bob@stateu.edu",
            "main_field": "Computer Science",
            "projects": []
          }
        ]
      }
    ]
  }
]


"""
def scrape_usm_department(url):
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/117.0.0.0 Safari/537.36'
        )
    }

    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'html.parser')

    people_data = []

    person_blocks = soup.select('.grid_item.people_item.kt_item_fade_in.kad_people_fade_in.postclass')
    links_array = []

    for block in person_blocks:
        person = {
            "name": None,
            "profile_url": None,
            "phone": None
        }
        department_elems = soup.select('.entry-site-title')

        name_tag = block.find('h3')
        if name_tag:
            person['name'] = name_tag.get_text(strip=True)
        link_tag = block.find('a')
        if link_tag.find('h3'):  
            link = link_tag.get('href')
            person['profile_url'] = link
            links_array.append(link)

        tel_tag = block.find('a', href=lambda x: x and x.startswith('tel:'))
        if tel_tag:
            person['phone'] = tel_tag.get_text(strip=True)

        email = block.find('a', href=lambda x: x and '@maine.edu' in x)
        if email:
            person['email'] = email.get_text(strip=True)
    
        if person['name']:
            people_data.append(person)
            
        bio = block.find('p')
        if bio:
            person['bio'] = bio.get_text(strip=True)

    return people_data, links_array, department_elems


if __name__ == '__main__':
    
    usm_data = {
    "institution": {
      "institution_name": "University of Southern Maine",
      "institution_type": "University",
      "street": "96 Falmouth St",
      "city": "Portland",
      "state": "Maine",
      "zipcode": "04038",
      "institution_phone": "800-800-4876"
    },
    "departments": [
      {
          "department_name": "Computer Science",
        "department_email": None,
        "department_phone": None,
        "people": [
          {
           
            "projects": [
              {
                "tags": ["AI", "ML"]
              }
            ]
          },
          {
            "projects": []
          }
        ]
      }
    ]
  }
    print(usm_data)

    print(usm_data['departments'])
    print(usm_data['departments'][0]['people'])
    # gets the first departmnets first persons projects
    print(usm_data['departments'][0]['people'][0]['projects'])

    try:
        usm_scraped_data, links, dept = scrape_usm_department('https://usm.maine.edu/department-computer-science/people/')
    except Exception as e:
        print('Error during scrape:', e)

    
    usm_data['departments'].append(    {"departments": [
      {
        "department_name": dept[0].get_text(strip=True) if dept else '',
        "department_email": None,
        "department_phone": None,
        "people": usm_scraped_data
      }
    ]    }
    )
    print(usm_data)

    for person in people:
        name = person.get_text(strip=True)
        if name:
            output['departments'][0]['people'].append({
            "person_name": name,
            "person_email": "",
            "person_phone": "",
            "bio": "",
            "expertise_1": "",
            "expertise_2": "",
            "expertise_3": "",
            "main_field": "Computer Science",
            "projects": [
        
            ]

                })
            print(name)
    print(output)

    print('Department title: ', department_elems[0].get_text(strip=True) if department_elems else '')

    person_output = {}
    # Process people
    # My task is not to get people info, but department info. There is more info to grab for each person
    # However, I can grab person info if needed, I've got a good idea on how and it would not take long
    for person in people:
        name = person.get_text(strip=True)
        if name:
            person_output[name] = {
                'department': department_elems[0].get_text(strip=True) if department_elems else '',
                'link': [link['url'] for link in links_array if link['text'] == name] # Not efficient, but works for now
            }
        
    for name, details in person_output.items():
        print(f"Name: {name}")
        print(f"  Department: {details['department']}")
        print(f"  Link(s): {details['link']}")
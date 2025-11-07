import requests
from bs4 import BeautifulSoup


def scrape_usm_department(url):

    # Allegedly, this will provide a browser-like user agent to avoid bot blocks
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                      'AppleWebKit/537.36 (KHTML, like Gecko) '
                      'Chrome/117.0.0.0 Safari/537.36'
    }

    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, 'html.parser')

    people = soup.find_all('h3')
    department_elems = soup.select('.entry-site-title')

    links_array = []
    for link in soup.find_all('a'):
        #  There are many links on the page, but we only want those that wrap an h3 tag, since h3 indicates a person
        if link.find('h3'):  
            links_array.append({
                'url': link.get('href'),
                'text': link.get_text()
            })

    return people, department_elems, links_array

if __name__ == '__main__':
    try:
        people, department_elems, links_array = scrape_usm_department('https://usm.maine.edu/department-computer-science/people/')
    except Exception as e:
        print('Error during scrape:', e)


    print("Links Array: ", links_array)
    for person in people:
        name = person.get_text(strip=True)
        if name:
            print(name)

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
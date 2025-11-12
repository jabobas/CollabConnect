# example-scraper.py
# To run this script, paste `python example-scraper.py` in the terminal
# https://www.w3schools.com/cssref/css_selectors.php for reference on CSS selectors, a great cheatsheet
import requests
from bs4 import BeautifulSoup


def scrape():
    # url to scrape
    url = 'https://www.example.com'
    # This sends a get request to the website as defined from the url. The response is the html content of the page
    response = requests.get(url)
    # Parse the html content using BeautifulSoup
    soup = BeautifulSoup(response.text, 'html.parser')
    print(soup)

    title = soup.select_one('h1').text
    text = soup.select_one('p').text
    link = soup.select_one('a').get('href')

    print(title)
    print(text)
    print(link)

if __name__ == '__main__':
    scrape()
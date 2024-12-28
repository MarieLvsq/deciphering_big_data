import requests
from bs4 import BeautifulSoup
import json

# URL to scrape
url = "https://www.theverge.com/search?q=data+scientist"

# Headers to mimic a browser request
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
}

# Fetch the webpage
response = requests.get(url, headers=headers)

if response.status_code == 200:
    print("Successfully fetched the webpage!")
else:
    print(f"Failed to fetch the webpage. Status code: {response.status_code}")
    exit()

# Parse the webpage content
soup = BeautifulSoup(response.text, 'html.parser')

# Extract articles
articles = []
for article in soup.find_all('div', class_='w-full max-w-content-block-standard'):
    # Extract the title
    title_tag = article.find('h2', class_='mb-10 font-polysans text-20 font-bold leading-100 tracking-1 md:text-24')
    link_tag = title_tag.find('a') if title_tag else None
    paragraph_tag = article.find('p')  # Extract summary/description
    
    title = title_tag.text.strip() if title_tag else "N/A"
    link = link_tag['href'] if link_tag else "N/A"
    description = paragraph_tag.text.strip() if paragraph_tag else "N/A"
    
    # Append article details
    articles.append({
        'title': title,
        'link': f"https://www.theverge.com{link}" if link.startswith('/') else link,
        'description': description
    })

# Save to JSON
output_file = "verge_data_scientist_articles.json"
with open(output_file, 'w', encoding='utf-8') as file:
    json.dump(articles, file, indent=4, ensure_ascii=False)

print(f"Scraped data saved to {output_file}")

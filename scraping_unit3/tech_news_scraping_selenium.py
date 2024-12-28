from selenium import webdriver
from selenium.webdriver.common.by import By
import json
import time

# Set up WebDriver
driver = webdriver.Chrome()
url = "https://www.theverge.com/search?q=data+scientist"

# Open the webpage
driver.get(url)

# Wait for JavaScript content to load
time.sleep(5)

# Extract articles
articles = []
article_elements = driver.find_elements(By.CLASS_NAME, "max-w-content-block-standard")
for article in article_elements:
    try:
        # Extract title
        title_element = article.find_element(By.CSS_SELECTOR, "h2.mb-10")
        title = title_element.text.strip()
        
        # Extract link
        link_element = title_element.find_element(By.TAG_NAME, "a")
        link = link_element.get_attribute("href")
        
        # Extract description
        description_element = article.find_element(By.TAG_NAME, "p")
        description = description_element.text.strip()
        
        articles.append({
            'title': title,
            'link': link,
            'description': description
        })
    except Exception as e:
        print(f"Error extracting article: {e}")

# Close the browser
driver.quit()

# Save to JSON
output_file = "verge_data_scientist_articles.json"
with open(output_file, 'w', encoding='utf-8') as file:
    json.dump(articles, file, indent=4, ensure_ascii=False)

print(f"Scraped data saved to {output_file}")

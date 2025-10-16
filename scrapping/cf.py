import time
import os
import traceback
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
from webdriver_manager.chrome import ChromeDriverManager
questionUrlList=[]

cnt=800
siteUrl='https://codeforces.com/problemset'
questionUrl='https://codeforces.com'
DATA_FOLDER="cdata"
# Set up Chrome options
def openBrowser(url):
    print("    --------- Opening Browser")
    try:
        options = webdriver.ChromeOptions()
        options.add_argument('--ignore-certificate-errors')
        options.add_argument('--incognito')
        # options.add_argument('--headless')  # Headless mode for no GUI
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        # Initialize WebDriver
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        driver.get(url)
        driver.maximize_window()
        return driver
    except Exception as e:
        print(f"Error while opening the browser: {e}")
        return None
#close browser
def closeBrowser(driver):
    print("     --------> closing Browser")
    driver.close()
# get the q description
def getDescription(quesUrl):
    try:
        global cnt
        print("Opening URL:", quesUrl)
        browser = openBrowser(quesUrl)
        if not browser:
            print("Browser initialization failed for", quesUrl)
            return False  # Indicate failure
        WebDriverWait(browser, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div.problem-statement"))
        )
        # WebDriverWait(browser, 20).until(
        #     EC.presence_of_element_located((By.CSS_SELECTOR, "div#sidebar"))
        # )
        pageSource = browser.page_source
        soup = BeautifulSoup(pageSource, 'html.parser')
        # sidebar = soup.find('div', id='sidebar')
        problemBox = soup.find('div', class_='problem-statement')
        tags=soup.find_all('span',class_='tag-box')
        print(len(tags))
        # for tag in tags:
        #     print
        if not tags:
            print("tagbox not found!")
        if not problemBox:
            print("Problem box not found!")
        if problemBox and tags:
            
            child_divs = problemBox.find_all('div')
            if len(child_divs) > 1:
                header_child=child_divs[1]
                second_div = child_divs[10]
                print("Getting the description")
                file_path = os.path.join(DATA_FOLDER, f"cf_prob{cnt}.txt")
                with open(file_path, "w", encoding="utf-8") as file:
                    for ele in header_child:
                        file.write(f"{ele.text.strip()}\n")
                    for element in second_div.children:
                        if element.name == 'p':
                            file.write(f"{element.text.strip()}\n")
                        elif element.name == 'ul':
                            for li in element.find_all('li'):
                                file.write(f"  - {li.text.strip()}\n")
                        elif element.name is None:
                            text = element.strip()
                            if text:
                                file.write(f"{text}\n")
                    for tag in tags:
                        file.write(f"Tags -{tag.text.strip()}\n")
                print("Content saved to output.txt")
                cnt += 1
                closeBrowser(browser)
                return True  # Indicate success
            else:
                print("Less than two divs found inside problemBox.")
        else:
            print("problemBox not found.")
        closeBrowser(browser)
        return False  # Indicate failure if description is not found
    except Exception as e:
        print("Some error occurred in generateText. Error:", e)
        print(traceback.format_exc())
        return False  # Indicate failure


#fetch from the current page
def fetchPageData(pageUrl):
    print(pageUrl)
    browser = openBrowser(pageUrl)
    if not browser:
        print("Browser initialization failed for", pageUrl)
        return
    try:
        # Wait for the questions to load
        # WebDriverWait(browser, 20).until(
        #     EC.presence_of_element_located((By.CSS_SELECTOR, "div[class_='datatable']"))
        # )
        time.sleep(5)
        
        # Fetch the page source after ensuring the content is loaded
        pageSource = browser.page_source
        
        soup = BeautifulSoup(pageSource, 'html.parser')
        print("\n\n------------------- Parsing data -------------------\n\n")
        questionBlock = soup.find('table', class_='problems')
        if questionBlock:
            print("------------------- Inside Question Block -------------------")
            # print(len(questionBlock))
            qlist=questionBlock.find_all('tr')[1:]
            # print(qlist)
            if qlist:
                for q in qlist:
                    link_tag = q.find('td', class_='id').find('a')
                    if link_tag:
                      problem_url = questionUrl+link_tag['href']
                      questionUrlList.append(problem_url)
                    # print(problem_url)
                    # if getDescription(problem_url):
                            # questionUrlList.append(problem_url)
        else:
            print("Question block is empty. The page structure might have changed.")
    except Exception as e:
        print(f"Error while fetching data: {e}")
    finally:
        closeBrowser(browser)
#get the problems pages and links from problemset page
def getData():
    try:
        browser=openBrowser(siteUrl)
        if browser is None:
            raise Exception("Browser initialization failed.")
        time.sleep(2)
        pageSource=browser.page_source
        WebDriverWait(browser,20).until(EC.title_contains("Problemset - Codeforces"))
        print(f"Page title: {browser.title}")
        soup=BeautifulSoup(pageSource,'html.parser')
        if(browser.title=="Problemset - Codeforces"):
            #fetch the problems from pages
            totalPage=8
            for page in range(8,totalPage+1):
                print(
                    f"\n\n------------------- Fetching Page {page} -------------------\n\n"
                )
                pageUrl=siteUrl+'/page/'+str(page)
                fetchPageData(pageUrl)
            print("     -----------> Done all pages ")
            # print(f"Total {questionNameList.__len__()} questions fetched")
            closeBrowser(browser)
        else:
            print("Connection Failed")
            return
    except Exception as e:
        print("Some error occured, error: ", e)
        print(traceback.format_exc())
        return
#generate the txt file of questin url and question name
def getText():
    print("     --------> generating the url txt file")
    with open("codeforces_prob_url.txt","w+") as f:
        f.write('\n'.join(questionUrlList))
#     with open("codeforces_prob_titles.txt","w+") as f:
#         f.write('\n'.join(questionNameList))
    
if __name__=="__main__":
    getData()
    getText()
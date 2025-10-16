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
questionNameList=[]
DATA_FOLDER="data"
cnt=1
siteUrl='https://leetcode.com/problemset/'
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

def generateText(quesUrl):
    try:
        global cnt
        print("Opening URL:", quesUrl)
        browser = openBrowser(quesUrl)  # Ensure `openBrowser` is correctly defined elsewhere
        if not browser:
            print("Browser initialization failed for", quesUrl)
            return
        
        # Wait for the page to load
        time.sleep(20)
        # WebDriverWait(browser, 20).until(
        #     EC.presence_of_element_located((By.CSS_SELECTOR, "div.qd-content"))
        # )
        
        # Fetch the page source
        pageSource = browser.page_source
        soup = BeautifulSoup(pageSource, 'html.parser')
        
        # Extract the question description
        descriptionRow = soup.find('div', id='qd-content')
        if not descriptionRow:
            print("Description row not found")
            return
        print("HTML content saved to 'page_source.html'")
        layoutRow = descriptionRow.find('div', class_='elfjS')
        # print(layoutRow)
        if not layoutRow:
            print("Layout row not found")
            return
        problem=layoutRow.text
        # problem_description=problem.split("\n")[0]
        file_path=os.path.join(DATA_FOLDER,f"leet_prob{cnt}.txt")
        with open(file_path,"w+",encoding="utf-8") as f:
            f.write(problem)
        cnt+=1
    except Exception as e:
        print("Some error occurred in generateText. Error:", e)
        print(traceback.format_exc())


#fetch from the current page
def fetchPageData(pageUrl):
    print(pageUrl)
    browser = openBrowser(pageUrl)
    if not browser:
        print("Browser initialization failed for", pageUrl)
        return

    try:
        # Wait for the questions to load
        WebDriverWait(browser, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "div[role='rowgroup'] div[role='row']"))
        )
        
        # Fetch the page source after ensuring the content is loaded
        pageSource = browser.page_source
        
        soup = BeautifulSoup(pageSource, 'html.parser')

        print("\n\n------------------- Parsing data -------------------\n\n")
        mainBlock = soup.find_all('div', role='rowgroup')
        questionBlock = mainBlock[2]
        if questionBlock:
            print("------------------- Inside Question Block -------------------")
            questionList = questionBlock.find_all('div', role='row')
            print(f"Number of questions found: {len(questionList)}")

            for question in questionList:
                time.sleep(10)
                row = question.find_all('div', role='cell')
                # print(row)
                if len(row) > 1:  
                    print(row[1])
                    questionName = row[1].find('a').text
                    questionUrl = row[1].find('a')['href']
                    questionUrl = 'https://leetcode.com' + questionUrl

                    # Debug print
                    print(f"Extracted Question: {questionName}, URL: {questionUrl}")

                    questionNameList.append(questionName)
                    questionUrlList.append(questionUrl)
                    generateText(questionUrl)
        else:
            print("Question block is empty. The page structure might have changed.")

    except Exception as e:
        print(f"Error while fetching data: {e}")

#get the problems pages and links from problemset page
def getData():
    try:
        browser=openBrowser(siteUrl)
        if browser is None:
            raise Exception("Browser initialization failed.")
        time.sleep(2)
        pageSource=browser.page_source

        WebDriverWait(browser,20).until(EC.title_contains("Problems - LeetCode"))
        print(f"Page title: {browser.title}")
        soup=BeautifulSoup(pageSource,'html.parser')
        if(browser.title=="Problems - LeetCode"):
            #fetch the problems from pages
            totalPage=40
            for page in range(1,totalPage+1):
                print(
                    f"\n\n------------------- Fetching Page {page} -------------------\n\n"
                )
                pageUrl=siteUrl+'?page='+str(page)
                fetchPageData(pageUrl)
            print("     -----------> Done all pages ")
            # print(f"Total {questionNameList.__len__()} questions fetched")

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
    with open("leetcode_prob_url.txt","w+") as f:
        f.write('\n'.join(questionUrlList))
    with open("leetcode-_prob_titles.txt","w+") as f:
        f.write('\n'.join(questionNameList))


if __name__=="__main__":
    getData()
    getText()
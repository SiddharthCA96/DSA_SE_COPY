import nltk
import ssl
import os
import re
from numpy import log10

# Ensure SSL for NLTK
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

nltk.download('punkt')
nltk.download('stopwords')
from nltk.corpus import stopwords

# Stopwords from NLTK
stop_words = set(stopwords.words('english'))

# Global variables
prob_des = [] 
all_key_words = []  # Store all unique keywords
total_doc = 2500  # Total number of documents
nt = {}  # Dictionary to store the count of documents containing a given keyword
tf_matrix = []  # List of lists to store term frequency values of each document
folder_path='corpuscopy'

# Function to clean and tokenize text
def clean_and_tokenize(text):
    # Tokenize the text and remove non-alphabetic characters (punctuation, numbers)
    words = re.findall(r'\b\w+\b', text.lower())  # Tokenize and convert to lowercase
    # Remove stopwords
    filtered_words = [word for word in words if word not in stop_words]
    return filtered_words

# Step 1: Process all documents and extract keywords
for i in range(1, total_doc + 1):
    file_path = f"corpuscopy/prob{i}.txt"  # Path to each document
    
    # Open and read the document
    with open(file_path, 'r', encoding='utf-8') as f:
        doc = f.read().lower()  # Read and convert the text to lowercase
        print(doc)
        prob_des.append(doc)  # Store the document text
        
        # Clean and tokenize the document
        total_words = clean_and_tokenize(doc)
        
        # Add keywords to the list (only unique ones)
        for each_word in total_words:
            if each_word not in all_key_words:
                all_key_words.append(each_word)

# Sort the keywords
all_key_words.sort()

# Step 2: Calculate `nt` (number of documents containing each keyword)
nt = {word: 0 for word in all_key_words}
for doc in prob_des:
    key_words_in_doc = set(clean_and_tokenize(doc))  # Unique words in the document
    for word in key_words_in_doc:
        nt[word] += 1

# Step 3: Calculate IDF scores
idf_score = [
    log10(total_doc / nt[word]) if nt[word] > 0 else 0
    for word in all_key_words
]

# Step 4: Calculate TF and build the TF-IDF matrix
for doc in prob_des:
    total_words = clean_and_tokenize(doc)
    total_kword_doc = len(total_words)

    # Initialize TF score dictionary
    tf_score = {word: 0 for word in all_key_words}
    for word in total_words:
        tf_score[word] += 1

    # Normalize TF scores
    for word in tf_score:
        tf_score[word] /= total_kword_doc

    # Calculate TF-IDF for the document
    tf_idf_row = [round(tf_score[word] * idf_score[idx], 2) for idx, word in enumerate(all_key_words)]
    tf_matrix.append(tf_idf_row)

# Step 5: Save the TF-IDF matrix to a file
with open("tf_idf_Matrix.txt", "w", encoding="utf-8") as f:
    for row in tf_matrix:
        f.write(",".join(map(str, row)) + "\n")

# Step 6: Save IDF scores to a file
with open("idf_score.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(map(str, idf_score)))

# Step 7: Save all unique keywords to a file
with open("all_keywords.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(all_key_words))

print("TF-IDF matrix, IDF scores, and keywords saved successfully!")

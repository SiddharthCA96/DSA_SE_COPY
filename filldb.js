import mongoose from "mongoose";
import {
  idf,
  tf_idf,
  Db_Keyword,
  Db_mag,
  all_problem,
} from "./backend/db/index.js";
import fs from "fs/promises";
import zlib from "zlib";
import path from "path";
import { MONGO_URI } from "./backend/utils/constants.js";
import dotenv from "dotenv";
dotenv.config();

export const MONGO_URI = process.env.MONGO_URI;


mongoose
  .connect(
    MONGO_URI
  )
  .then(() => console.log("DB connected"))
  .catch((err) => console.error("DB connection error:", err));

async function saveCompressedTfIdf(tf_idf_matrix) {

  let matrixArray;

  // If tf_idf_matrix is a string, convert it to a 2D array
  if (typeof tf_idf_matrix === "string") {
   
    matrixArray = tf_idf_matrix
      .split("\n")
      .map((row) => row.split(",").map(Number));
  } else {

    matrixArray = tf_idf_matrix;
  }
  // Sanitize the matrix to replace invalid values
  matrixArray = matrixArray.map((row) =>
    row.map((value) => (isNaN(value) || value == null ? 0 : value))
  );
  // Convert the 2D array back to a string

  const matrixString = matrixArray.map((row) => row.join(",")).join("\n");
  
  const compressed = zlib.gzipSync(matrixString);

  await tf_idf.create({ tf_idf_values: compressed.toString("base64") });
}

// Function to put data into MongoDB
async function processData() {
  try {
    // Reading files
    const all_keywds = (
      await fs.readFile("all_keywords.txt", "utf-8")
    ).toString();
    const idf_str = (await fs.readFile("idf_score.txt", "utf-8")).toString();
    const tf_idf_matrix = (
      await fs.readFile("tf_idf_Matrix.txt", "utf-8")
    ).toString();
    const problem_titles = (
      await fs.readFile("leetcode_prob_titles.txt", "utf-8")
    )
      .toString()
      .split("\n");
    const problem_urls = (await fs.readFile("leetcode_prob_url.txt", "utf-8"))
      .toString()
      .split("\n");
    const problem_desc = await Promise.all(
      Array.from({ length: 2500 }, async (_, i) => {
        try {
          return await fs.readFile(`corpuscopy/prob${i + 1}.txt`, "utf-8");
        } catch (err) {
          console.error(
            `Error reading problem description for leet_prob${i + 1}:`,
            err
          );
          return "";
        }
      })
    );


    //Save all keywords to the database
    await Db_Keyword.create({ keyword_values: all_keywds });


    // Save IDF values to the database
    await idf.create({ idf_values: idf_str });


    // Save TF-IDF matrix to the database
    await saveCompressedTfIdf(tf_idf_matrix);


    // Initialize variables for problems and magnitudes
    const tot_keywds = all_keywds.length;
    const mag_docs = [];
    const problems = [];


    // Calculate magnitudes and prepare problem data
    for (let i = 0; i < 2500; i++) {
      let value = 0;
      for (let j = 0; j < tot_keywds; j++) {
        const index = i * tot_keywds + j;
        if (!isNaN(tf_idf_matrix[index])) {
          const tfidf = parseFloat(tf_idf_matrix[index]) || 0;
          value += tfidf ** 2;
        }
      }
      const magnitude = Math.sqrt(value);
      mag_docs.push(magnitude);

      problems.push({
        problem_desc: problem_desc[i] || "Description not available",
        problem_title: problem_titles[i] || "Description not available",
        problem_url: problem_urls[i] || "URL not available",
        problem_mag: magnitude,
        problem_id: i + 1,
      });
    }

    // Save all problems to the database
    await all_problem.insertMany(problems);

    // Save magnitudes to the database
    await Db_mag.create({ mag_values: mag_docs.join(",") });


  } catch (err) {
    console.error("Error in processing data:", err);
  }
}

// Execute the function
processData()
  .then(() => console.log("Data processing completed successfully!"))
  .catch((err) => console.error("Error in processing data:", err));

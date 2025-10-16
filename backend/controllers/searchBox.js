import mongoose from "mongoose";
import zlib from "zlib";
import { tf_idf, idf, Db_Keyword, Db_mag, all_problem } from "../db/index.js";
import { removeStopwords } from "stopword";
import dotenv from "dotenv";

dotenv.config();
const Mongo = process.env.MONGO_URI;

mongoose.connect(Mongo, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('Connection error:', err));

// Variables
let all_keyword = [];
let mag_docs = [];
let idf_values = [];
let tf_idf_matrix = [];
let all_problems_data = [];
let cached_magDoc = null;
let cached_idfDoc = null;
let cached_keywordDoc = null;
let cached_compressed = null;
var tot_doc = 2500;
let isDataLoaded = false;

const loadData = async () => {
  try {
    cached_magDoc = cached_magDoc || await Db_mag.findOne();
    if (!cached_magDoc || !cached_magDoc.mag_values) throw new Error("Missing or invalid mag_docs data");
    mag_docs = cached_magDoc.mag_values.split(",").map((v) => parseFloat(v.trim()));

    cached_idfDoc = cached_idfDoc || await idf.findOne();
    if (!cached_idfDoc || !cached_idfDoc.idf_values) throw new Error("Missing or invalid idf_values data");
    idf_values = cached_idfDoc.idf_values.split("\n").map((v) => parseFloat(v.trim()));

    cached_keywordDoc = cached_keywordDoc || await Db_Keyword.findOne();
    if (!cached_keywordDoc || !cached_keywordDoc.keyword_values) throw new Error("Missing or invalid keyword data");
    all_keyword = cached_keywordDoc.keyword_values.split("\n").map((w) => w.trim());

    cached_compressed = cached_compressed || await tf_idf.findOne();
    if (!cached_compressed || !cached_compressed.tf_idf_values) throw new Error("No TF-IDF data found in MongoDB.");
    const decompressedBuffer = zlib.gunzipSync(Buffer.from(cached_compressed.tf_idf_values, "base64"));
    tf_idf_matrix = decompressedBuffer.toString("utf-8").split("\n").map((row) =>
      row.split(",").map((value) => parseFloat(value.trim()) || 0)
    );

    all_problems_data = all_problems_data.length ? all_problems_data : await all_problem.find();

    isDataLoaded = true;
    console.log("All data loaded and cached successfully.");
  } catch (error) {
    console.error("Error loading data:", error);
  }
};

(async () => {
  try {
    await loadData();
  } catch (error) {
    console.error("Initialization error:", error);
  }
})();

export const checkDataStatus = (req, res) => {
  res.json({ isDataLoaded });
};

export const fetchData = (req, res) => {
  if (!isDataLoaded) {
    return res.status(503).json({ message: "Data is still loading. Please try again later." });
  }

  res.json({
    all_keyword,
    mag_docs,
    idf_values,
    tf_idf_matrix,
    all_problems_data
  });
};

// export const topResults = async (req, res) => {
//   const { query_keywords } = req.body;

//   const mp_query = new Map();
//   query_keywords.forEach((ele) => mp_query.set(ele, (mp_query.get(ele) || 0) + 1));

//   const sz_query_keywords = query_keywords.length;
//   const tf_query = all_keyword.map((ele) => (mp_query.get(ele) || 0) / sz_query_keywords);

//   const tf_idf_query = tf_query.map((tf, i) => tf * idf_values[i]);

//   const mag_query = Math.sqrt(tf_idf_query.reduce((sum, val) => sum + val * val, 0));

//   const selectivity_values = new Map();
//   for (let i = 0; i < tot_doc; i++) {
//     let val = tf_idf_query.reduce((sum, q, j) => sum + (tf_idf_matrix[i][j] || 0) * q, 0);
//     if (mag_docs[i] !== 0 && mag_query !== 0) {
//       val /= (mag_docs[i] * mag_query);
//       if (!isNaN(val) && val !== 0) selectivity_values.set(val, i + 1);
//     }
//   }

//   const sortedDocs = [...selectivity_values.entries()].sort((a, b) => b[0] - a[0]).slice(0, 5);

//   const data = sortedDocs.map(([_, docId]) => all_problems_data.find(p => p.problem_id === docId)).filter(Boolean);

//   res.json({ data });
// };

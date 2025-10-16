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

// ...existing code...
export const topResults = async (req, res) => {
  try {
    if (!isDataLoaded) {
      return res.status(503).json({ message: "Data is still loading. Please try again later." });
    }

    const { query, topK = 5 } = req.body || {};
    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ message: "Query text is required." });
    }

    // Tokenize and remove stopwords
    const tokens = query
      .toLowerCase()
      .split(/\W+/)
      .filter(Boolean);
    const filtered = removeStopwords(tokens);
    if (!filtered.length) {
      return res.status(400).json({ message: "Query contains no valid tokens after stopword removal." });
    }

    // Build term frequency for query over the known vocabulary
    const mp_query = new Map();
    filtered.forEach((t) => mp_query.set(t, (mp_query.get(t) || 0) + 1));
    const sz_query_keywords = filtered.length;

    // TF vector aligned to all_keyword
    const tf_query = all_keyword.map((kw) => (mp_query.get(kw) || 0) / sz_query_keywords);

    // TF-IDF for query (handle idf_values length mismatch)
    const len = Math.min(tf_query.length, idf_values.length);
    const tf_idf_query = Array.from({ length: tf_query.length }, (_, i) =>
      i < len ? tf_query[i] * idf_values[i] : 0
    );

    const mag_query = Math.sqrt(tf_idf_query.reduce((sum, val) => sum + val * val, 0));
    if (mag_query === 0) {
      return res.status(200).json({ data: [] });
    }

    // Prepare a map of problems by id for fast lookup
    const problemsById = new Map();
    for (const p of all_problems_data) {
      if (p && p.problem_id != null) problemsById.set(Number(p.problem_id), p);
    }

    // Compute cosine similarity with each document
    const scores = [];
    for (let i = 0; i < tot_doc; i++) {
      const docVec = tf_idf_matrix[i] || [];
      // dot product
      let dot = 0;
      const maxJ = Math.min(docVec.length, tf_idf_query.length);
      for (let j = 0; j < maxJ; j++) {
        dot += (docVec[j] || 0) * (tf_idf_query[j] || 0);
      }
      const magDoc = (mag_docs[i] || 0);
      if (magDoc === 0) continue;
      const score = dot / (magDoc * mag_query);
      if (!isNaN(score) && score > 0) scores.push({ docIndex: i, score });
    }

    scores.sort((a, b) => b.score - a.score);
    const top = scores.slice(0, topK);

    const data = top.map(({ docIndex, score }) => {
      // original code used doc id as i+1
      const docId = docIndex + 1;
      const problem = problemsById.get(Number(docId)) || null;
      return { score, docId, problem };
    }).filter((x) => x.problem);

    res.json({ data });
  } catch (err) {
    console.error("topResults error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
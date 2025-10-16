import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FETCH_DATA } from "../../utils/constants"; // Assuming this is your fetchData route
import { removeStopwords } from "stopword";


const Header = ({ setSearchResults, setQueryFlag }) => {
  const navigate = useNavigate();
  const [cachedData, setCachedData] = useState(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await axios.get(FETCH_DATA);
        setCachedData(response.data);
        console.log("Data loaded and cached.");
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    loadData();
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  // Search handler with TF-IDF calculation on frontend
  const handleSearchClick = () => {
    const searchInput = document.getElementById("search-input").value.toLowerCase().replace(/(\r\n|\n|\r)/gm, "");
    if (!cachedData) {
      alert("Data is still loading. Please try again.");
      return;
    }

    const { all_keyword, mag_docs, idf_values, tf_idf_matrix, all_problems_data } = cachedData;
    const query_keywords = removeStopwords(searchInput.split(" ")).sort();

    console.log(cachedData);
    
    // Create query term frequency (TF)
    const mp_query = new Map();
    query_keywords.forEach((word) => mp_query.set(word, (mp_query.get(word) || 0) + 1));

    const sz_query_keywords = query_keywords.length;
    const tf_query = all_keyword.map((word) => (mp_query.get(word) || 0) / sz_query_keywords);

    // Create query TF-IDF
    const tf_idf_query = tf_query.map((tf, i) => tf * idf_values[i]);

    // Magnitude of query vector
    const mag_query = Math.sqrt(tf_idf_query.reduce((sum, val) => sum + val * val, 0));

    // Calculate cosine similarity
    const selectivity_values = [];
    for (let i = 0; i < mag_docs.length; i++) {
      let dot_product = tf_idf_query.reduce((sum, q, j) => sum + (tf_idf_matrix[i][j] || 0) * q, 0);
      const similarity = (mag_docs[i] && mag_query) ? dot_product / (mag_docs[i] * mag_query) : 0;
      if (similarity > 0) selectivity_values.push({ similarity, docId: i + 1 });
    }

    // Sort by similarity and get top 5
    const sortedResults = selectivity_values.sort((a, b) => b.similarity - a.similarity).slice(0, 5);

    // Map doc IDs to problem data
    const topResults = sortedResults.map(({ docId }) =>
      all_problems_data.find((p) => p.problem_id === docId)
    ).filter(Boolean);

    setSearchResults(topResults);
    setQueryFlag(true);
  };

  return (
    <header className="bg-teal-700 text-white py-4 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-2 w-1/2">
        <input
          id="search-input"
          type="text"
          placeholder="Search..."
          className="w-full p-2 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={handleSearchClick}
          className="bg-purple-400 hover:bg-purple-800 text-white py-2 px-4 rounded-lg"
        >
          Search
        </button>
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
      >
        Logout
      </button>
    </header>
  );
};

export default Header;

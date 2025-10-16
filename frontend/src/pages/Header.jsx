import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { TOP_RESULTS } from "../../utils/constants";

const Header = ({ setSearchResults, setQueryFlag }) => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };

  // Search handler: ask backend for top results
  const handleSearchClick = async () => {
    const searchInput = (input || "").trim();
    if (!searchInput) return alert("Please enter a search query.");

    try {
      setLoading(true);
      // POST to backend endpoint. Adjust path if your server prefixes API routes (e.g. /api/topResults)
      const res = await axios.post(TOP_RESULTS, { query: searchInput, topK: 5 });
      const data = res.data && res.data.data ? res.data.data : [];
      setSearchResults(data.map((d) => d.problem).filter(Boolean));
      setQueryFlag(true);
    } catch (err) {
      console.error("Search error:", err);
      alert("Search failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="bg-teal-700 text-white py-4 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-2 w-1/2">
        <input
          id="search-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          placeholder="Search..."
          className="w-full p-2 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={handleSearchClick}
          disabled={loading}
          className="bg-purple-400 hover:bg-purple-800 text-white py-2 px-4 rounded-lg disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
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
import React from "react";

const QuestionCard = ({ title, url, description }) => {
  console.log("Inside QuestionCard");
  console.log({ title, url, description });  // Log the props

  // // Extract the first line from the description
  // const firstLine = description.split("\n")[0];

  // Find the first occurrence of "Tags -" and slice till the end of the description
  const tagsIndex = description.indexOf("Tags -");
  
  // If "Tags -" is found, extract the portion after it
  const tagsSection = tagsIndex !== -1 ? description.slice(tagsIndex + 6) : '';
  
  // Split the tags section by line breaks or spaces to get all tags
  const tagsArray = tagsSection ? tagsSection.split("\n").map(tag => tag.trim()).filter(tag => tag) : [];
  
  // Combine multi-word tags like "data structures" into a single tag
  const combinedTags = [];
  let currentTag = '';

  tagsArray.forEach(tag => {
    if (tag.includes(' ')) {
      // If the tag contains a space, it is a multi-word tag (like "data structures")
      if (currentTag) {
        combinedTags.push(currentTag);
      }
      currentTag = tag;  // Set the multi-word tag
    } else {
      if (currentTag) {
        currentTag += ' ' + tag;  // Append to the multi-word tag
      } else {
        combinedTags.push(tag);  // Add the single-word tag
      }
    }
  });

  if (currentTag) {
    combinedTags.push(currentTag);  // Push the last tag if any
  }

  // Extract tags from the first to second last tag
  const tags = combinedTags.slice(0, -1);  // All tags except the last one
  let rating = combinedTags[combinedTags.length - 1];  // Last tag is the rating

  // Remove any '-*' from the rating and also remove "Tags"
  const cleanRating = rating ? rating.replace(/-\*/g, "").replace(/Tags/g, "").trim() : "";

  // Slice the description to get everything before the first "Tags -"
  const problemDescription = description.slice(0, tagsIndex).trim();

  return (
    <div className="w-full bg-gray-800 text-white p-6 rounded-lg shadow-md mb-4">
      <h1 className="text-lg font-semibold mb-2">{title}</h1>
      <h2 className="text-sm mb-2">
        <a 
          href={url} 
          className="text-blue-400 hover:underline" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          {url}
        </a>
      </h2>
      <p className="text-sm text-gray-300 mb-2">{problemDescription}</p>
      
      {/* Display tags */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-400">Tags:</h3>
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.length > 0 ? (
            tags.map((tag, index) => (
              <span key={index} className="bg-gray-600 text-white py-1 px-3 rounded-full text-xs">
                {tag.replace('Tags', '').trim()}  {/* Remove "Tags" if present */}
              </span>
            ))
          ) : (
            <span className="bg-gray-600 text-white py-1 px-3 rounded-full text-xs">Not Available</span>
          )}
        </div>
      </div>

      {/* Display rating */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-400">Rating:</h3>
        <span className={`text-xs bg-gray-600 text-white py-0.5 px-2 rounded-full ${!cleanRating ? "Not Available" : ""}`}>
          {cleanRating || "Not Available"}
        </span>
      </div>
    </div>
  );
};

export default QuestionCard;

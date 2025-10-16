import React from 'react';
import QuestionCard from './QuestionCard';

const QuesionList = ({ problems }) => {
  // Convert the problems object into an array of values
  const problemsArray = Object.values(problems);
  // console.log(problemsArray[0]);
  console.log(problemsArray);
  

  return (
    <div className="px-6 py-2 bg-white w-full">
      {/* Stack the QuestionCards vertically */}
      <div className="flex flex-col space-y-4">
        {problemsArray.map((problem) => {
          // Destructure object
          const { problem_title, problem_url, problem_desc, problem_id } = problem;
          return (
            <QuestionCard
              key={problem_id}
              title={problem_title}
              url={problem_url}
              description={problem_desc}
            />
          );
        })}
      </div>
    </div>
  );
};

export default QuesionList;

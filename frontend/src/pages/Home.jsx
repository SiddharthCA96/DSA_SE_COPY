import React, { useState } from "react";
import Header from "./Header";
import QuesionList from "../components/QuesionList";

export const Home = () => {

  const [searchResults,setSearchResults]=useState();

  const [queryFlag,setQueryFlag]=useState(false)
  return (
    <div className="absolute w-full">
      <>
        <Header setSearchResults={setSearchResults} setQueryFlag={setQueryFlag}/>
        {/* <QuesionList problems={searchResults}/> */}
        {queryFlag && <QuesionList problems={searchResults} />}
      </>
    </div>
  );
};

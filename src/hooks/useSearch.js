import { useState } from "react";

export function useSearch() {
  const [query, setQuery] = useState("");

  const handleSearch = (value) => {
    setQuery(value);
    console.log("Searching for:", value);
  };

  return {
    query,
    setQuery,
    handleSearch,
  };
}

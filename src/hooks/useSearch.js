import { useState } from "react";

export function useSearch() {
  const [query, setQuery] = useState("");

  const handleSearch = (value) => {
    setQuery(value);
  };

  const clearSearch = () => {
    setQuery("");
  };

  return {
    query,
    setQuery,
    handleSearch,
    clearSearch,
  };
}
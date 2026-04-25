import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();

    if (!query.trim()) return;

    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      {/* Left Search Icon */}

      {/* Input */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tools..."
        className="input pl-11 pr-16"
      />

      {/* Right Search Button */}
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] flex items-center justify-center"
        aria-label="Search"
      >
        <Search size={18} strokeWidth={2.5} />
      </button>
    </form>
  );
}
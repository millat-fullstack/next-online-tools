import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { searchAll } from "../../lib/searchUtils";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const suggestions = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return searchAll(trimmed, 5);
  }, [query]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    navigate(`/search/?q=${encodeURIComponent(trimmedQuery)}`);
    setQuery("");
    setShowSuggestions(false);
  }

  function handleSuggestionClick(result) {
    // ensure search and tool/blog URLs use trailing-slash pattern when possible
    if (result.url && result.url.startsWith('/search?q=')) {
      const q = result.url.split('?q=')[1] || '';
      navigate(`/search/?q=${q}`);
    } else {
      navigate(result.url);
    }
    setQuery("");
    setShowSuggestions(false);
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full" autoComplete="off">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder="Search tools, blogs, and guides..."
        className="input pl-11 pr-16"
        aria-label="Search tools"
      />

      {showSuggestions && query.trim() && (
        <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg pointer-events-none">
          {suggestions.length > 0 ? (
            suggestions.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(result);
                  }}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 pointer-events-auto"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-sm text-slate-900">{result.title}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-600">
                    {result.type}
                  </span>
                </div>
                <p className="text-[13px] text-slate-500 mt-1">{result.subtitle}</p>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-slate-500 pointer-events-auto">No suggestions found.</div>
          )}

          <button
            type="button"
              onMouseDown={(e) => {
              e.preventDefault();
              navigate(`/search/?q=${encodeURIComponent(query.trim())}`);
              setShowSuggestions(false);
            }}
            className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--primary)] hover:bg-slate-50 pointer-events-auto"
          >
            Search all results for “{query.trim()}”
          </button>
        </div>
      )}

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

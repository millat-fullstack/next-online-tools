import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { searchAll } from "../../lib/searchUtils";

function normalizeInternalUrl(url) {
  if (!url) return "/";

  const [beforeHash, hash] = url.split("#");
  const [pathname, search] = beforeHash.split("?");

  const cleanPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");

  return `${cleanPath}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`;
}

function goToUrl(url) {
  const cleanUrl = normalizeInternalUrl(url);

  // Hard navigation fallback. This avoids the first-click issue completely.
  window.location.href = cleanUrl;
}

export default function SearchBar() {
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmedQuery = query.trim();

  const suggestions = useMemo(() => {
    if (!trimmedQuery) return [];
    return searchAll(trimmedQuery, 8);
  }, [trimmedQuery]);

  const totalOptions = suggestions.length + 1; // suggestions + search all option

  useEffect(() => {
    function handleClickOutside(event) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function openSearchPage(value) {
    const cleanQuery = String(value || "").trim();

    if (!cleanQuery) {
      inputRef.current?.focus();
      return;
    }

    goToUrl(`/search?q=${encodeURIComponent(cleanQuery)}`);
  }

  function openSuggestion(result) {
    if (!result?.url) return;
    goToUrl(result.url);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (activeIndex >= 0 && activeIndex < suggestions.length) {
      openSuggestion(suggestions[activeIndex]);
      return;
    }

    openSearchPage(query);
  }

  function handleKeyDown(event) {
    if (!showSuggestions && trimmedQuery) {
      setShowSuggestions(true);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((currentIndex) => {
        if (totalOptions <= 0) return -1;
        return currentIndex < totalOptions - 1 ? currentIndex + 1 : 0;
      });

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((currentIndex) => {
        if (totalOptions <= 0) return -1;
        return currentIndex > 0 ? currentIndex - 1 : totalOptions - 1;
      });

      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        openSuggestion(suggestions[activeIndex]);
        return;
      }

      openSearchPage(query);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  }

  return (
    <form
      ref={wrapperRef}
      onSubmit={handleSubmit}
      className="relative w-full"
      autoComplete="off"
      role="search"
    >
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setShowSuggestions(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (trimmedQuery) {
            setShowSuggestions(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search tools, blogs, and guides..."
        className="input pl-11 pr-16"
        aria-label="Search tools, blogs, and guides"
      />

      {showSuggestions && trimmedQuery && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          {suggestions.length > 0 ? (
            suggestions.map((result, index) => {
              const isActive = activeIndex === index;

              return (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    openSuggestion(result);
                  }}
                  className={`w-full text-left px-4 py-3 ${
                    isActive ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-sm text-slate-900">
                      {result.title}
                    </span>

                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-slate-600">
                      {result.type}
                    </span>
                  </div>

                  <p className="text-[13px] text-slate-500 mt-1">
                    {result.subtitle}
                  </p>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-slate-500">
              No suggestions found.
            </div>
          )}

          <button
            type="button"
            onMouseEnter={() => setActiveIndex(suggestions.length)}
            onMouseDown={(event) => {
              event.preventDefault();
              openSearchPage(query);
            }}
            className={`w-full px-4 py-3 text-left text-sm font-medium text-[var(--primary)] ${
              activeIndex === suggestions.length
                ? "bg-slate-100"
                : "hover:bg-slate-50"
            }`}
          >
            Search all results for “{trimmedQuery}”
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
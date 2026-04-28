import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";
import Button from "../ui/Button";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--border)]">
      <div className="px-4 sm:px-6 lg:px-10 py-4">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4">
          {/* Mobile Logo */}
          <Link
            to="/"
            className="lg:hidden text-xl font-bold text-[var(--primary)]"
          >
            Next Online Tools
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:block flex-1 max-w-xl">
            <SearchBar />
          </div>

          {/* Header Buttons */}
          <div className="flex items-center gap-3">
            <Button to="/tools" variant="secondary" className="hidden sm:inline-flex">
              All Tools
            </Button>

            <Button to="/contact">
              Contact
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
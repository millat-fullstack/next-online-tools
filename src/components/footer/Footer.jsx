import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-[var(--border)] bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h2 className="text-xl font-bold text-[var(--primary)]">ToolNest</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-3">
              Free, simple, and user-friendly online tools for everyday tasks.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Tools</h3>
            <div className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
              <Link to="/tools" className="hover:text-[var(--primary)]">All Tools</Link>
              <Link to="/tools?category=Text%20Tools" className="hover:text-[var(--primary)]">Text Tools</Link>
              <Link to="/tools?category=Image%20Tools" className="hover:text-[var(--primary)]">Image Tools</Link>
              <Link to="/tools?category=Design%20Tools" className="hover:text-[var(--primary)]">Design Tools</Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Company</h3>
            <div className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
              <Link to="/about" className="hover:text-[var(--primary)]">About</Link>
              <Link to="/blog" className="hover:text-[var(--primary)]">Blog</Link>
              <Link to="/contact" className="hover:text-[var(--primary)]">Contact</Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <div className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
              <Link to="/privacy-policy" className="hover:text-[var(--primary)]">Privacy Policy</Link>
              <Link to="/terms-of-service" className="hover:text-[var(--primary)]">Terms of Service</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between gap-3 text-sm text-[var(--text-secondary)]">
          <p>© {new Date().getFullYear()} ToolNest. All rights reserved.</p>
          <p>100% Free • No Paid API • User Friendly</p>
        </div>
      </div>
    </footer>
  );
}
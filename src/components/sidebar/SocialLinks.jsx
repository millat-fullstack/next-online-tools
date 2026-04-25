import { Link } from "react-router-dom";

export default function SocialLinks() {
  return (
    <div className="border-t border-[var(--border)] pt-4">
      <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
        <Link to="/privacy-policy" className="hover:text-[var(--primary)]">
          Privacy
        </Link>

        <Link to="/terms-of-service" className="hover:text-[var(--primary)]">
          Terms
        </Link>

        <Link to="/contact" className="hover:text-[var(--primary)]">
          Contact
        </Link>
      </div>

      <p className="text-xs text-[var(--text-secondary)] mt-3">
        © {new Date().getFullYear()} ToolNest
      </p>
    </div>
  );
}
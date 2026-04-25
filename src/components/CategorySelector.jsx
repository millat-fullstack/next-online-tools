import { Link, useLocation } from "react-router-dom";

export default function CategorySelector({ categories = [] }) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedCategory = queryParams.get("category");

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      <Link
        to="/tools"
        className={!selectedCategory ? "btn-primary whitespace-nowrap" : "btn-secondary whitespace-nowrap"}
      >
        All Tools
      </Link>

      {categories.map((category) => (
        <Link
          key={category}
          to={`/tools?category=${encodeURIComponent(category)}`}
          className={
            selectedCategory === category
              ? "btn-primary whitespace-nowrap"
              : "btn-secondary whitespace-nowrap"
          }
        >
          {category}
        </Link>
      ))}
    </div>
  );
}
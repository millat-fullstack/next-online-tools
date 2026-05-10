import { Link, useLocation } from "react-router-dom";

export default function CategorySelector({ categories = [] }) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedCategory = queryParams.get("category");

  return (
    <div className="category-selector">
      <Link
        to="/tools"
        className={!selectedCategory ? "category-chip active" : "category-chip"}
      >
        All Tools
      </Link>

      {categories.map((category) => (
        <Link
          key={category}
          to={`/tools?category=${encodeURIComponent(category)}`}
          className={
            selectedCategory === category
              ? "category-chip active"
              : "category-chip"
          }
        >
          {category}
        </Link>
      ))}
    </div>
  );
}
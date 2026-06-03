import { useLocation } from "react-router-dom";
import SmartLink from "./ui/SmartLink";

export default function CategorySelector({ categories = [] }) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedCategory = queryParams.get("category");

  return (
    <div className="category-selector">
      <SmartLink
        to="/tools"
        className={!selectedCategory ? "category-chip active" : "category-chip"}
      >
        All Tools
      </SmartLink>

      {categories.map((category) => (
        <SmartLink
          key={category}
          to={`/tools?category=${encodeURIComponent(category)}`}
          className={
            selectedCategory === category
              ? "category-chip active"
              : "category-chip"
          }
        >
          {category}
        </SmartLink>
      ))}
    </div>
  );
}
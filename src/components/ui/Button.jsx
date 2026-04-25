import { Link } from "react-router-dom";

export default function Button({
  children,
  to,
  type = "button",
  variant = "primary",
  className = "",
  onClick,
}) {
  const baseClass =
    variant === "secondary" ? "btn-secondary" : "btn-primary";

  if (to) {
    return (
      <Link to={to} className={`${baseClass} ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseClass} ${className}`}
    >
      {children}
    </button>
  );
}
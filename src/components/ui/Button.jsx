import { Link, useNavigate } from "react-router-dom";

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

  const navigate = useNavigate();

  if (to) {
    return (
      <a
        href={to}
        onPointerDown={(e) => { e.preventDefault(); navigate(to); }}
        onClick={(e) => e.preventDefault()}
        className={`${baseClass} ${className}`}
      >
        {children}
      </a>
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
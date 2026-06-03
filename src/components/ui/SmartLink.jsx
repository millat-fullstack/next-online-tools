import { Link, useNavigate } from "react-router-dom";

function isInternalUrl(to) {
  if (typeof to !== "string") return false;

  return (
    to.startsWith("/") &&
    !to.startsWith("//") &&
    !to.startsWith("http") &&
    !to.startsWith("mailto:") &&
    !to.startsWith("tel:")
  );
}

function isPlainLeftClick(e) {
  return (
    e.button === 0 &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.shiftKey &&
    !e.altKey
  );
}

export default function SmartLink({
  to,
  children,
  className = "",
  onClick,
  ...props
}) {
  const navigate = useNavigate();

  function handleMouseDown(e) {
    if (!isInternalUrl(to)) return;
    if (!isPlainLeftClick(e)) return;

    e.preventDefault();
    navigate(to);
  }

  function handleClick(e) {
    if (onClick) {
      onClick(e);
    }
  }

  return (
    <Link
      to={to}
      className={className}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
}
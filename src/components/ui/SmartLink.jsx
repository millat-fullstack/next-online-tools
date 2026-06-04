import { Link, useNavigate } from "react-router-dom";

function isInternalUrl(to) {
  return (
    typeof to === "string" &&
    to.startsWith("/") &&
    !to.startsWith("//") &&
    !to.startsWith("http") &&
    !to.startsWith("mailto:") &&
    !to.startsWith("tel:")
  );
}

function isPlainLeftClick(event) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
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

  function handleMouseDown(event) {
    if (!isInternalUrl(to)) return;
    if (!isPlainLeftClick(event)) return;

    event.preventDefault();
    navigate(to);
  }

  function handleClick(event) {
    if (onClick) {
      onClick(event);
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
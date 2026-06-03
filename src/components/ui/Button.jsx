import SmartLink from "./SmartLink";

function normalizePath(path) {
  if (!path) return path;

  if (
    path.startsWith("http") ||
    path.startsWith("#") ||
    path.startsWith("mailto:") ||
    path.startsWith("tel:")
  ) {
    return path;
  }

  const [beforeHash, hash] = path.split("#");
  const [pathname, search] = beforeHash.split("?");

  const cleanPath = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");

  return `${cleanPath}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`;
}

export default function Button({
  children,
  to,
  type = "button",
  variant = "primary",
  className = "",
  onClick,
  disabled = false,
  ...props
}) {
  const baseClass = variant === "secondary" ? "btn-secondary" : "btn-primary";

  const finalClassName = `${baseClass} ${className} ${
    disabled ? "opacity-60 pointer-events-none cursor-not-allowed" : ""
  }`;

  if (to) {
    return (
      <SmartLink
        to={normalizePath(to)}
        onClick={disabled ? undefined : onClick}
        className={finalClassName}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </SmartLink>
    );
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={finalClassName}
      {...props}
    >
      {children}
    </button>
  );
}
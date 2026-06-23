const variants = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
  ghost: "btn-ghost",
};

export function Button({
  variant = "primary",
  size,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`${variants[variant]}${size === "sm" ? " btn-sm" : ""} ${className}`}
      {...props}
    />
  );
}

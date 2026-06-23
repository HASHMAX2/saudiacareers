export function Alert({ children, tone = "error" }) {
  const cls = tone === "success" ? "alert-success" : "alert-error";
  return <div className={cls} role="alert">{children}</div>;
}

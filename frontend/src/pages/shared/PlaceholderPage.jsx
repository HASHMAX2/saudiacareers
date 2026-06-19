export function PlaceholderPage({ title, description }) {
  return (
    <div className="surface-card mx-auto max-w-2xl p-8 text-center sm:p-12">
      <h1 className="page-heading">{title}</h1>
      <p className="page-subheading mx-auto">{description}</p>
    </div>
  );
}

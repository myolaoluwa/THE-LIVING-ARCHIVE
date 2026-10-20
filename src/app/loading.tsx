export default function Loading() {
  return (
    <main id="main" className="container empty-page" aria-busy="true">
      <p className="eyebrow" role="status">
        Opening the archive…
      </p>
      <div className="loading-line" />
    </main>
  );
}

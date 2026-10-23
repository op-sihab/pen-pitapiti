export default function NotFound() {
  return (
    <main style={{ padding: "48px 24px", textAlign: "center" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, marginBottom: 8 }}>
        Page not found
      </h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        That page does not exist.
      </p>
      <a href="/games/pen-fight/" style={{ textDecoration: "underline" }}>
        Back to Pen Fight
      </a>
    </main>
  );
}

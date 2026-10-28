export function PurchaseSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav className="purchase-steps" aria-label="Purchase progress">
      <ol>
        {["Your selection", "Secure checkout", "Your downloads"].map((label, i) => (
          <li key={label} aria-current={current === i + 1 ? "step" : undefined} data-complete={current > i + 1}>
            <span className="purchase-step-number" aria-hidden="true">{current > i + 1 ? "✓" : `0${i + 1}`}</span>
            <span>{label}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

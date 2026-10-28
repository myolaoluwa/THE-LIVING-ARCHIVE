export function PaymentSecurityNotice() {
  return (
    <aside className="payment-security" aria-label="Secure card payment">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </svg>
      <div>
        <strong>Card details are entered on Stripe’s secure page.</strong>
        <p>You’ll continue to Stripe to pay. This website does not collect your card details.</p>
      </div>
    </aside>
  );
}

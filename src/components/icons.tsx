export function Arrow({
  diagonal = false,
  className = "",
}: {
  diagonal?: boolean;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function ArchiveMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width="35"
      height="42"
      viewBox="0 0 35 42"
      fill="none"
    >
      <path
        d="M4 35V17C4 9.5 10 3 17.5 3S31 9.5 31 17v18M10 35V18c0-4.5 3.2-8.8 7.5-8.8S25 13.5 25 18v17M17.5 13v22M2 35h31M6 39h23"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path d="m11 23 6.5-4 6.5 4" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

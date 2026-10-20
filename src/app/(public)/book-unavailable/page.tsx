import { notFound } from "next/navigation";
// Resolve to the shared editorial boundary during prerendering, before streaming.
export default function UnavailableBook() {
  notFound();
}

import { ButtonLink, Eyebrow } from "@/components/ui";
export default function NotFound() {
  return (
    <main id="main" className="container empty-page">
      <Eyebrow>404 / A page out of place</Eyebrow>
      <h1>
        This chapter
        <br />
        <em>isn’t here.</em>
      </h1>
      <p>Return to the collection to find a story worth discovering.</p>
      <ButtonLink href="/books">Explore the books</ButtonLink>
    </main>
  );
}

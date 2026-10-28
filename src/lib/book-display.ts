import type { Book } from "./content";

/** Approved public titles, including records that retain the original series title. */
export function bookDisplayTitle(book: Pick<Book, "slug" | "title">) {
  if (book.slug === "4daniel-book-one")
    return "A Precolonial History and My Life History in Rhodesia and Zimbabwe";
  if (book.slug === "4daniel-book-two")
    return "An African Colonial History and Memoir";
  return book.title;
}

export type Book = {
  id?: string;
  coverRatio?: string;
  amazonHardcover?: string;
  amazonPaperback?: string;
  ebookPrice?: { amountMinor: number; currency: "USD" };
  kindleUnlimited?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  series?: string;
  number: string;
  cover: string;
  tone: string;
  description: string;
  paragraphs: string[];
  themes: string[];
  formats: string[];
  source: string;
  amazonEbook: string;
};

export const books: Book[] = [
  {
    slug: "4daniel-book-one",
    title: "4Daniel",
    number: "01",
    series: "4Daniel · Book One",
    subtitle:
      "A Precolonial History and My Life History in Rhodesia and Zimbabwe",
    category: "History & memoir",
    cover: "/images/4daniel-book-one.jpg",
    tone: "sage",
    description:
      "An exploration of precolonial Central and Southern Africa, where historical research meets personal memory.",
    paragraphs: [
      "The first book in the 4Daniel series brings archaeological evidence and indigenous oral traditions into conversation with Edmund’s own experiences.",
      "It explores the Great Zimbabwe cultural heritage, Swahili trade and Portuguese involvement in the region, tracing a history that reaches beyond colonial accounts. The series began as a legacy for his son Daniel, who grew up in Germany.",
    ],
    themes: ["Precolonial Africa", "Cultural heritage", "Personal memory"],
    formats: ["Ebook", "Paperback"],
    source: "https://www.goodreads.com/book/show/210820405-4daniel",
    amazonEbook: "https://www.amazon.com/dp/B0CZTYLFSG",
    amazonPaperback: "https://www.amazon.com/dp/B0CYVNQJ4M",
    ebookPrice: { amountMinor: 777, currency: "USD" },
    kindleUnlimited: true,
  },
  {
    slug: "4daniel-book-two",
    title: "4Daniel",
    number: "02",
    series: "4Daniel · Book Two",
    subtitle: "An African Colonial History and Memoir",
    category: "History & memoir",
    cover: "/images/4daniel-book-two.jpg",
    tone: "walnut",
    description:
      "The colonial experience of Southern Rhodesia, explored through historical scholarship and lived experience.",
    paragraphs: [
      "The second 4Daniel book examines African colonial history, with particular attention to Southern Rhodesia between 1880 and 1980.",
      "Historical analysis is interwoven with memories of growing up in a segregated society and the experiences of early Black students at Peterhouse. Together, these perspectives consider the ways colonial systems shaped education, identity and everyday life.",
    ],
    themes: ["Colonial history", "Education & identity", "Lived experience"],
    formats: ["Ebook", "Paperback"],
    source: "https://www.goodreads.com/book/show/240713691-book-two-4daniel",
    amazonEbook: "https://www.amazon.com/dp/B0FNX7L165",
    amazonPaperback: "https://www.amazon.com/dp/B0FQP4FZ58",
    ebookPrice: { amountMinor: 999, currency: "USD" },
    kindleUnlimited: true,
  },
  {
    slug: "the-bile-of-the-river",
    title: "The Bile of the River",
    number: "03",
    subtitle: "An African Saga",
    category: "Historical fiction",
    cover: "/images/the-bile-of-the-river.jpg",
    tone: "navy",
    description:
      "A different way into the past. Edmund’s historical fiction explores African history through the art of storytelling.",
    paragraphs: [
      "The Bile of the River brings another literary perspective to Edmund Spencer Katso’s work: historical fiction.",
      "Alongside the research and personal memory of the 4Daniel books, this standalone African saga explores history through fiction.",
    ],
    themes: ["Historical fiction", "African narratives", "Storytelling"],
    formats: ["Ebook", "Paperback", "Hardcover"],
    source: "https://www.goodreads.com/book/show/253569061-an-african-saga",
    amazonEbook: "https://www.amazon.com/dp/B0H4BTT1QH",
    amazonPaperback: "https://www.amazon.com/dp/B0H4CRDM47",
    ebookPrice: { amountMinor: 693, currency: "USD" },
    kindleUnlimited: true,
  },
  {
    slug: "4daniel-book-three",
    title: "The Shadow of the Beast",
    number: "04",
    series: "4Daniel · Book Three",
    subtitle: "An African Neocolonial History",
    category: "African history",
    cover: "/images/4daniel-book-three.jpg",
    coverRatio: "943 / 1500",
    tone: "walnut",
    description:
      "The concluding volume of the 4Daniel trilogy examines Zimbabwe’s postcolonial history and the continuing influence of colonial structures.",
    paragraphs: [
      "In The Shadow of the Beast, Edmund Katso turns to neocolonial history, completing the 4Daniel trilogy’s passage from precolonial roots through colonial rule to independent Zimbabwe.",
      "The book considers the transition from Rhodesia to Zimbabwe, tracing the author’s argument about enduring connections between political power, security institutions and resource extraction.",
    ],
    themes: ["Neocolonial history", "Independent Zimbabwe", "Power & resources"],
    formats: ["Ebook"],
    source: "https://www.amazon.co.uk/dp/B0GX2ZY8MF",
    amazonEbook: "https://www.amazon.com/dp/B0GX2ZY8MF",
    // Owner-requested holding price, not a free website download offer.
    ebookPrice: { amountMinor: 0, currency: "USD" },
    kindleUnlimited: true,
  },
];

export const author = {
  name: "Edmund Spencer Katso",
  introduction:
    "Zimbabwean-born author, educator and historian. Exploring the histories, cultures and lived experiences of Central and Southern Africa.",
};

export const biography = [
  {
    label: "01 / Origins",
    title: "A life rooted in Zimbabwe.",
    text: "Born in Umtali, now Mutare, Edmund’s early life and education at St Augustine’s Mission and Peterhouse form part of the personal history behind his writing.",
  },
  {
    label: "02 / Education",
    title: "Learning. Teaching. Opening doors.",
    text: "A scholarship took Edmund to the University of Bristol. His career in Zimbabwe included a pioneering teaching role at Peterhouse, connecting a lifetime in education with the experiences that would later inform his books.",
  },
  {
    label: "03 / A wider world",
    title: "New surroundings. Enduring connections.",
    text: "After his professional career in Zimbabwe, Edmund relocated to Germany and worked as an English communication trainer. His writing maintains a connection with the country of his birth.",
  },
  {
    label: "04 / The written word",
    title: "Experience becomes a living archive.",
    text: "In retirement, Edmund’s literary pursuits bring together history, cultural memory and personal experience. His historical nonfiction and fiction offer different ways to encounter the stories of Central and Southern Africa.",
  },
];

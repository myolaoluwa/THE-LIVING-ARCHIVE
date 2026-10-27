import type { Metadata } from "next";
import { getPublicPage } from "@/lib/database/catalog";
import { ButtonLink, Eyebrow, Portrait } from "@/components/ui";
export const metadata: Metadata = {
  title: "The Author",
  description:
    "Meet Edmund Spencer Katso: Zimbabwean-born author, educator and historian, from a life in education to a life in literature.",
};
export const revalidate = 60;
export default async function AboutPage() {
  const about = await getPublicPage("about");
  return (
    <main id="main">
      <section className="about-intro">
        <div className="container about-opening">
          <div>
            <Eyebrow>The author / A life in words</Eyebrow>
            <h1>
              {about.headline_first}
              <br />
              <em>{about.headline_second}</em>
            </h1>
            <p className="standfirst">Edmund Spencer Katso</p>
            <p>{about.introduction}</p>
          </div>
          <figure>
            <Portrait priority />
            <figcaption>EDMUND SPENCER KATSO / AT THE TYPEWRITER</figcaption>
          </figure>
        </div>
      </section>
      <section className="container biography-section">
        <div className="biography-sidebar">
          <Eyebrow>A personal history</Eyebrow>
          <h2>
            From lived <br />
            experience <br />
            <em>to the page.</em>
          </h2>
          <p>
            Central and Southern Africa are more than a setting for Edmund’s
            writing. They are the ground from which it grows.
          </p>
        </div>
        <div className="biography-chapters">
          {about.chapters.map((chapter) => (
            <article key={chapter.label} data-reveal>
              <Eyebrow>{chapter.label}</Eyebrow>
              <h3>{chapter.title}</h3>
              <p>{chapter.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="milestones">
        <div className="container">
          <Eyebrow>A life in chapters</Eyebrow>
          <h2>
            A life in <em>perspective.</em>
          </h2>
          <div className="timeline">
            {about.milestones.map((milestone) => (
              <article key={milestone.label} data-reveal>
                <span>{milestone.label}</span>
                <h3>{milestone.title}</h3>
                <p>{milestone.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="closing container">
        <Eyebrow>Life, distilled into literature</Eyebrow>
        <h2>
          Meet the stories
          <br />
          <em>behind the life.</em>
        </h2>
        <ButtonLink href="/books">Discover the books</ButtonLink>
      </section>
    </main>
  );
}

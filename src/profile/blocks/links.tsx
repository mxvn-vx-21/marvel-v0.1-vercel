import { z } from "zod";
import type { BlockDefinition } from "./types";

// http(s) only — blocks javascript:, data:, etc.
const httpUrl = z.string().url().max(500).refine((u) => /^https?:\/\//i.test(u), "http(s) only");

const schema = z.object({
  title: z.string().max(80).optional(),
  links: z.array(z.object({ label: z.string().min(1).max(60), url: httpUrl })).max(20),
});
type Data = z.infer<typeof schema>;

export const linksBlock: BlockDefinition<Data> = {
  type: "links",
  label: "Links",
  schema,
  Component: ({ data }) => (
    <section className="p-card">
      {data.title && <h2 className="p-card-title">{data.title}</h2>}
      <ul className="p-links">
        {data.links.map((l, i) => (
          <li key={`${l.url}-${i}`}>
            <a href={l.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="p-link">
              <span>{l.label}</span>
              <span aria-hidden>↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  ),
};

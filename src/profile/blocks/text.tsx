import { z } from "zod";
import type { BlockDefinition } from "./types";

const schema = z.object({
  title: z.string().max(80).optional(),
  body: z.string().max(2000),
});
type Data = z.infer<typeof schema>;

export const textBlock: BlockDefinition<Data> = {
  type: "text",
  label: "Text",
  schema,
  // Plain text only — React escapes it; no HTML is ever injected.
  Component: ({ data }) => (
    <section className="p-card">
      {data.title && <h2 className="p-card-title">{data.title}</h2>}
      <p className="p-prose">{data.body}</p>
    </section>
  ),
};

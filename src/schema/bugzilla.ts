import { z } from 'zod';

export const externalLinkSchema = z.array(
  z.object({
    ext_description: z.string(),
    ext_bz_bug_id: z.string(),
    type: z.object({ url: z.string(), type: z.string() }),
  })
);

export type ExternalLink = z.infer<typeof externalLinkSchema>;

export const linkTransform = (link: ExternalLink[number]) => {
  return {
    description: link.ext_description,
    url: `${link.type.url}${link.ext_bz_bug_id}`,
  };
};

export const bugsSchema = z.object({
  bugs: z.array(
    z.object({
      id: z.number(),
      summary: z.string(),
      comments: z.array(z.object({ text: z.string(), count: z.number() })),
      external_bugs: externalLinkSchema.transform(links => {
        return Array.from(
          links.filter(link => link.type.type === 'GitHub'),
          linkTransform
        );
      }),
    })
  ),
});

export type Bugs = z.infer<typeof bugsSchema>;

import { z } from 'zod';

export const linkObjectSchema = z.object({
  url: z.string(),
  description: z.string().optional(),
  type: z.enum(['pull', 'issues', 'commit']),
  id: z.string(),
});

export type LinkObject = z.infer<typeof linkObjectSchema>;

export type IssueLinks = { key: string; bz?: string; links: LinkObject[] }[];

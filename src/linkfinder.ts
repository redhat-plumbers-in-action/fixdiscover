import { Endpoints } from '@octokit/types';
import { z } from 'zod';

import { CustomOctokit } from './octokit';
import { escapeRegex } from './util';

import { LinkObject, linkObjectSchema } from './schema/link';

export class LinkFinder {
  readonly upstream: { org: string; repo: string };
  regex: RegExp;
  constructor(upstreamStr: string) {
    const [org, repo] = upstreamStr.split('/');
    this.upstream = { org, repo };

    const upstreamEscaped = escapeRegex(`${org}/${repo}`);

    // Match any GitHub link to issue, PR or commit to the upstream project
    // Groups:
    // 0 - full link
    // 1 - Group 2 + 3
    // 2 - type of link (pull, issues, commit)
    // 3 - id or sha
    this.regex = new RegExp(
      `https:\/\/github\\.com\/${upstreamEscaped}\/((pull|issues|commit)\/([a-z\\d]+))`,
      'g'
    );
  }

  getLinks(message: string, description?: string): LinkObject[] {
    const links = z.array(linkObjectSchema).parse(
      [...message.matchAll(this.regex)].map(match => {
        return {
          url: match[0],
          description,
          type: match[2],
          id: match[3],
        };
      })
    );

    return links.filter(
      (link, index, self) => index === self.findIndex(el => el.url === link.url)
    );
  }

  async checkUpstream(links: LinkObject[], octokit: CustomOctokit) {
    const results = [];

    for (const link of links) {
      switch (link.type) {
        case 'pull':
          const pr = await this.isPRResolved(link, octokit);
          if (pr.resolved && pr.merged) {
            results.push(link);
          }
          break;

        case 'issues':
          const issue = await this.isIssueResolved(link, octokit);
          if (issue.resolved) {
            results.push(link);
          }
          break;

        case 'commit':
          const commit = await this.isCommitMerged(link, octokit);
          if (commit.resolved) {
            results.push(link);
          }
          break;
      }
    }

    return results;
  }

  async isPRResolved(link: LinkObject, octokit: CustomOctokit) {
    const pr = (
      await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
        owner: this.upstream.org,
        repo: this.upstream.repo,
        pull_number: parseInt(link.id),
      })
    ).data;

    return {
      resolved: pr.state === 'closed',
      merged: pr.merged === true,
    };
  }

  async isIssueResolved(link: LinkObject, octokit: CustomOctokit) {
    const issue = (
      await octokit.request('GET /repos/{owner}/{repo}/issues/{issue_number}', {
        owner: this.upstream.org,
        repo: this.upstream.repo,
        issue_number: parseInt(link.id),
      })
    ).data;

    return {
      resolved: issue.state === 'closed',
    };
  }

  async isCommitMerged(link: LinkObject, octokit: CustomOctokit) {
    const pr: Endpoints['GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls']['response']['data'] =
      (
        await octokit.request(
          '/repos/{owner}/{repo}/commits/{commit_sha}/pulls',
          {
            owner: this.upstream.org,
            repo: this.upstream.repo,
            commit_sha: link.id,
          }
        )
      ).data;

    const isMerged = pr.some((pr: any) => pr.merged_at !== null);

    return {
      resolved: isMerged,
      resolvedBy: pr.map(pr =>
        pr.merged_at !== null ? pr.html_url : undefined
      ),
    };
  }
}

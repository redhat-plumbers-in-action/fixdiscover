import { Command } from 'commander';
import { Comment } from 'jira.js/out/version2/models';

import { Jira } from './jira';
import { Logger } from './logger';
import { getOctokit } from './octokit';
import { getDefaultValue, getOptions, tokenUnavailable } from './util';
import { LinkFinder, LinkObject } from './linkfinder';

export type Data = { key: string; links: LinkObject[] }[];

export function cli(): Command {
  const program = new Command();

  program
    .name('fixdiscover')
    .description(
      '🔍 A small CLI tool is used to search for Jira issues with linked PRs and issues that are fixed in upstream projects'
    )
    .version('1.0.0');

  program
    .requiredOption(
      '-c, --component [component]',
      'issue component',
      getDefaultValue('COMPONENT')
    )
    .option(
      '-u, --upstream [upstream]',
      'upstream project',
      getDefaultValue('UPSTREAM')
    )
    .option('-n, --nocolor', 'disable color output', getDefaultValue('NOCOLOR'))
    .option('-x, --dry', 'dry run', getDefaultValue('DRY'));

  return program;
}

const runProgram = async () => {
  const program = cli();
  program.parse();

  const options = getOptions(program.opts());
  const logger = new Logger(!!options.nocolor);

  const jiraToken = process.env.JIRA_API_TOKEN ?? tokenUnavailable('jira');
  const jira = new Jira('https://issues.redhat.com', jiraToken, options.dry);

  const githubToken =
    process.env.GITHUB_API_TOKEN ?? tokenUnavailable('github');
  const octokit = getOctokit(githubToken);

  const upstream =
    options.upstream ?? `${options.component}/${options.component}`;
  const linkFinder = new LinkFinder(upstream);

  const issues = await jira.getIssues(options.component);

  let data: Data = [];

  for (const issue of issues) {
    let links: LinkObject[] = [];
    const externalLinks = await jira.getLinks(issue.id);

    for (const comment of issue.fields.comment.comments as (Comment & {
      body?: string;
    })[]) {
      if (!comment?.body) {
        continue;
      }

      const commentLinks = linkFinder.getLinks(comment.body);

      if (commentLinks) {
        links.push(...(await linkFinder.checkUpstream(commentLinks, octokit)));
      }
    }

    for (const externalLink of externalLinks) {
      const upstreamLink = linkFinder.getLinks(externalLink.object?.url ?? '');

      if (upstreamLink) {
        links.push(...(await linkFinder.checkUpstream(upstreamLink, octokit)));
      }
    }

    if (links.length > 0) {
      await jira.setLabels(issue.key, ['backport']);
      data.push({ key: jira.getIssueURL(issue.key), links });
    }
  }

  logger.logResult(data);
};

export default runProgram;

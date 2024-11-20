import { Version2Client } from 'jira.js';

import { raise } from './util';

export class Jira {
  readonly api: Version2Client;
  readonly baseJQL = 'Project = RHEL AND statusCategory = "To Do"';
  JQL = '';

  constructor(
    readonly instance: string,
    apiToken: string,
    readonly dry: boolean
  ) {
    this.api = new Version2Client({
      host: instance,
      authentication: {
        personalAccessToken: apiToken,
      },
    });
  }

  async getVersion(): Promise<string> {
    const response = await this.api.serverInfo.getServerInfo();
    return response.version ?? raise('Jira.getVersion(): missing version.');
  }

  async getIssues(component: string) {
    this.JQL = this.baseJQL;
    this.JQL += component ? ` AND component = ${component}` : '';
    this.JQL += ' ORDER BY id DESC';

    const response = await this.api.issueSearch.searchForIssuesUsingJqlPost({
      jql: this.JQL,
      fields: ['id', 'issuetype', 'summary', 'assignee', 'comment'],
      // We should paginate this, let's set 300 for now.
      maxResults: 300,
    });

    return response.issues ?? raise('Jira.getIssues(): missing issues.');
  }

  async getLinks(issue: string) {
    const response = await this.api.issueRemoteLinks.getRemoteIssueLinks({
      issueIdOrKey: issue,
    });

    return response ?? [];
  }

  async setLabels(key: string, labels: string[]) {
    if (this.dry) {
      console.debug(`DRY: setLabels(${key}, ${labels})`);
      return;
    }

    await this.api.issues.editIssue({
      issueIdOrKey: key,
      update: {
        labels: labels.map(label => ({ add: label })),
      },
    });
  }

  getIssueURL(issue: string) {
    return `${this.instance}/browse/${issue}`;
  }
}

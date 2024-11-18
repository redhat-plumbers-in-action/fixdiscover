import { Version2Client } from 'jira.js';

import { raise } from './util';

export class Jira {
  readonly api: Version2Client;
  readonly fields = {
    storyPoints: 'customfield_12310243',
    priority: 'priority',
    severity: 'customfield_12316142',
  };
  readonly baseJQL = 'Project = RHEL AND statusCategory = "To Do"';
  JQL = '';

  constructor(
    readonly instance: string,
    apiToken: string
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
    });

    return response.issues ?? raise('Jira.getIssues(): missing issues.');
  }

  async getLinks(issue: string) {
    const response = await this.api.issueRemoteLinks.getRemoteIssueLinks({
      issueIdOrKey: issue,
    });

    return response ?? [];
  }

  async setLabels(issue: string, labels: string[]) {
    await this.api.issues.editIssue({
      issueIdOrKey: issue,
      update: {
        labels: labels.map(label => ({ add: label })),
      },
    });
  }

  getIssueURL(issue: string) {
    return `${this.instance}/browse/${issue}`;
  }
}

import { Version2Client } from 'jira.js';

import { raise } from './util';

export class Jira {
  readonly api: Version2Client;
  readonly fields = {
    bugzillaBug: 'customfield_12316840',
  };

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
      fields: [
        'id',
        'issuetype',
        'summary',
        'assignee',
        'comment',
        this.fields.bugzillaBug,
      ],
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
      //console.debug(`DRY: setLabels(${key}, ${labels})`);
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

  async addLink(issue: string, url: string, title: string) {
    const links = await this.api.issueRemoteLinks.getRemoteIssueLinks({
      issueIdOrKey: issue,
    });

    for (const link of links) {
      if (link.object === undefined) {
        continue;
      }

      if (link.object.url === url) {
        console.debug(
          `Link ${url} is already linked with Jira issue ${issue}.`
        );
        return;
      }
    }

    if (this.dry) {
      console.debug(`DRY: addLink(${issue}, ${url}, ${title})`);
      return;
    }

    await this.api.issueRemoteLinks.createOrUpdateRemoteIssueLink({
      issueIdOrKey: issue,
      object: {
        title,
        url,
        icon: {
          title: 'GitHub',
          url16x16: 'https://github.githubassets.com/favicon.ico',
        },
      },
    });
  }
}

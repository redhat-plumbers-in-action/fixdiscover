import BugzillaAPI from 'bugzilla';
import { execSync } from 'node:child_process';

import { Bugs, bugsSchema } from './schema/bugzilla';

export class Bugzilla {
  readonly api: BugzillaAPI;

  readonly tips = {
    approval: 'Bugzilla is approved if it has `release` flag set to `+`',
  };

  constructor(
    readonly instance: string,
    private readonly apiToken: string
  ) {
    this.api = new BugzillaAPI(instance, apiToken);
  }

  async getVersion(): Promise<string> {
    return this.api.version();
  }

  async getBugs(bugId: number): Promise<Bugs['bugs']> {
    const command = `bugzilla --bugzilla ${this.instance}/xmlrpc.cgi query --json --bug_id ${bugId}`;

    let stdout = '';
    try {
      stdout = execSync(command).toString();
    } catch (error) {
      console.error(error);
      return [];
    }

    const raw = bugsSchema.safeParse(JSON.parse(stdout));
    return raw.success ? raw.data.bugs : [];
  }

  getIssueURL(bug: number): string {
    return `${this.instance}/show_bug.cgi?id=${bug}`;
  }
}

import chalk from 'chalk';

import { IssueLinks } from './schema/link';

export class Logger {
  static readonly colorRegex = /\[\d+m/gm;

  constructor(readonly noColor: boolean = false) {}

  log(message: string): void {
    if (!this.noColor) {
      console.log(message);
      return;
    }

    console.log(message.replace(Logger.colorRegex, ''));
  }

  logResult(data: IssueLinks): void {
    if (data.length === 0) {
      this.log(chalk.greenBright('No links found'));
      return;
    }

    let issueData = '';
    const result: string[] = [];

    for (const { key, bz, links } of data) {
      issueData = `${chalk.green(key)}\n${bz ? `${chalk.red(bz)}\n` : ''}`;

      for (const link of links) {
        issueData = issueData.concat(`  - ${link.type}: ${link.url}\n`);
      }

      result.push(issueData);
    }

    this.log(result.join('\n'));
  }
}

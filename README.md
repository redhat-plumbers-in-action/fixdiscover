# JIRA FixDiscover

[![npm version][npm-status]][npm] [![Tests][test-status]][test] [![Linters][lint-status]][lint] [![CodeQL][codeql-status]][codeql] [![codecov][codecov-status]][codecov]

[npm]: https://www.npmjs.com/package/fixdiscover
[npm-status]: https://img.shields.io/npm/v/fixdiscover

[test]: https://github.com/redhat-plumbers-in-action/fixdiscover/actions/workflows/tests.yml
[test-status]: https://github.com/redhat-plumbers-in-action/fixdiscover/actions/workflows/tests.yml/badge.svg

[lint]: https://github.com/redhat-plumbers-in-action/fixdiscover/actions/workflows/lint.yml
[lint-status]: https://github.com/redhat-plumbers-in-action/fixdiscover/actions/workflows/lint.yml/badge.svg

[codeql]: https://github.com/redhat-plumbers-in-action/fixdiscover/actions/workflows/codeql-analysis.yml
[codeql-status]: https://github.com/redhat-plumbers-in-action/fixdiscover/actions/workflows/codeql-analysis.yml/badge.svg

[codecov]: https://codecov.io/gh/redhat-plumbers-in-action/fixdiscover
[codecov-status]: https://codecov.io/gh/redhat-plumbers-in-action/fixdiscover/graph/badge.svg

<!-- -->

## Description

Small CLI tool to search for Jira issues with linked PRs and Issues that are fixed in an upstream projects.

## Usage

Make sure to store your JIRA Personal Access Token (PAT) and GitHub PAT in the `~/.config/fixdiscover/.env` or `~/.env.fixdiscover` file:

```bash
# ~/.config/fixdiscover/.env
JIRA_API_TOKEN="exaple-token"
GITHUB_API_TOKEN="exaple-token"
```

> [!TIP]
>
> You can also set default values for the `component` and `upstream` in the `~/.config/fixdiscover/.env` or `~/.env.fixdiscover` file:
>
> ```bash
> # ~/.config/storypointer/.env
> COMPONENT="your-component"
> UPSTREAM="upstream-project"
> ```

### Using Node.js

```bash
# run it using npx
npx fixdiscover

# or install it globally using npm
npm install -g fixdiscover
fixdiscover
```

## How to use

> [!IMPORTANT]
>
> This tool is intended to be used by Red Hat employees on the Red Hat JIRA instance. It may be adapted to work with other JIRA instances in the future.

```md
$ fixdiscover --help
Usage: fixdiscover [options]

🔍 A small CLI tool is used to search for Jira issues with linked PRs and issues that are fixed in upstream projects

Options:
  -V, --version                output the version number
  -c, --component [component]  issue component
  -u, --upstream [upstream]    upstream project
  -n, --nocolor                disable color output (default: false)
  -x, --dry                    dry run (default: false)
  -h, --help                   display help for command
```

> [!TIP]
>
> You can disable color output by setting the `NOCOLOR` environment variable to `true`.
>
> ```bash
> NOCOLOR=true npx fixdiscover
> ```
>
> Similarly, you can enable dry run by setting the `DRY` environment variable to `true`.

### Examples

Size all issues of the `curl` component:

```md
fixdiscover -c systemd -u systemd/systemd

https://issues.redhat.com/browse/RHEL-66198
  - commit: https://github.com/systemd/systemd/commit/7102dc52e6b03248da1f01b3a8a4b83c6d7a1316
  - commit: https://github.com/systemd/systemd/commit/d25a9bfa8f8bd42b769dbf2f9786348864cf5e08
  - commit: https://github.com/systemd/systemd/commit/67f90b0d85bc425ec2c11106e8270c981c36585a
  - commit: https://github.com/systemd/systemd/commit/3d689b675b565c29a51c7127ae30839987aaa18b

https://issues.redhat.com/browse/RHEL-50103
  - issues: https://github.com/systemd/systemd/issues/34082
  - pull: https://github.com/systemd/systemd/pull/34099
  - pull: https://github.com/systemd/systemd/pull/33682
```

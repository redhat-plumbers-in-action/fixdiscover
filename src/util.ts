import { OptionValues } from 'commander';

export function raise(error: string): never {
  throw new Error(error);
}

export function tokenUnavailable(type: 'jira' | 'bugzilla' | 'github'): never {
  let tokenType: string;
  switch (type) {
    case 'jira':
      tokenType = 'JIRA_API_TOKEN';
      break;
    case 'bugzilla':
      tokenType = 'BUGZILLA_API_TOKEN';
      break;
    case 'github':
      tokenType = 'GITHUB_API_TOKEN';
      break;
  }

  return raise(
    `${tokenType} not set.\nPlease set the ${tokenType} environment variable in '~/.config/fixdiscover/.env' or '~/.env.fixdiscover' or '~/.env.'`
  );
}

export function isDefaultValuesDisabled(): boolean {
  return process.env['NODEFAULTS'] ? true : false;
}

export function getDefaultValue(
  envName: 'COMPONENT' | 'UPSTREAM' | 'NOCOLOR' | 'DRY'
) {
  if (isDefaultValuesDisabled()) {
    return undefined;
  }

  const value = process.env[envName];

  if ((envName === 'NOCOLOR' || envName === 'DRY') && !value) {
    return false;
  }

  return value;
}

export function getOptions(inputs: OptionValues): OptionValues {
  return {
    ...inputs,
    component: inputs.component || getDefaultValue('COMPONENT'),
    upstream: inputs.upstream || getDefaultValue('UPSTREAM'),
  };
}

export function escapeRegex(regex: string): string {
  return regex.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

import inquirer from 'inquirer';
import { prompt } from './prompt';

const AutocompletePrompt = require('inquirer-autocomplete-prompt');

class FilteredAutocompletePrompt extends AutocompletePrompt {
  _run(callback) {
    // `default` in the plugin selects a choice, it does not fill the input.
    const filter = this.opt.initialFilter || '';
    this.rl.line = filter;
    this.rl.cursor = filter.length;
    return super._run(callback);
  }
}

inquirer.registerPrompt('autocomplete', FilteredAutocompletePrompt as any);

export const ask = async (message: string, choices: string[], initialFilter = '') => {
  return prompt<{ branch: string }>({
    type: 'autocomplete',
    name: 'branch',
    message,
    initialFilter,
    source(_answers, input = initialFilter) {
      return Promise.resolve(choices
        .filter(choice => checkItem(choice, input))
        .sort((a, b) => sortOrder(input, a, b)));
    },
  } as any);
};

export async function askBranches(message: string, choices: string[], filter = ''): Promise<string[]> {
  const filtered = choices.filter(choice => checkItem(choice, filter));
  if (!filtered.length) throw new Error('No branches match the filter.');
  const { branches } = await prompt<{ branches: string[] }>({
    type: 'checkbox',
    name: 'branches',
    message,
    choices: filtered,
    validate: (selected: string[]) => selected.length > 0 || 'Select at least one branch.',
  });
  return branches;
}

export function checkItem(item: string, filterString: string): boolean {
  // Literal, case-insensitive subsequence matching; no user-supplied regex.
  const needle = filterString.replace(/\s/g, '').toLowerCase();
  const haystack = item.toLowerCase();
  let position = 0;
  for (const character of needle) {
    position = haystack.indexOf(character, position);
    if (position === -1) return false;
    position++;
  }
  return true;
}

export function sortOrder(searchString: string, name1: string, name2: string): number {
  const search = searchString.toLowerCase();
  const first = name1.toLowerCase().indexOf(search);
  const second = name2.toLowerCase().indexOf(search);
  if (first === second) return 0;
  if (first === -1) return 1;
  if (second === -1) return -1;
  return first - second;
}

import { prompt } from '../prompt';
import { exec } from './exec';
import { print } from '../terminal';

export async function deleteBranches(branchNames: string[], confirm = true, force = true) {
  const branches = [...new Set(branchNames)];
  if (!branches.length || branches.some(branch => !branch)) {
    throw new Error('No branches selected.');
  }

  if (confirm) {
    const { answer } = await prompt({
      type: 'confirm',
      name: 'answer',
      message: 'Delete these branches: ' + branches.join(', ') + '?',
      default: false,
    });
    if (!answer) {
      print('Branches were not deleted.');
      return;
    }
  }

  // Attempt every selected branch and report partial failures as well.
  const errors: string[] = [];
  for (const branch of branches) {
    try {
      print(await exec(['branch', force ? '-D' : '-d', '--', branch]));
    } catch (error) {
      errors.push(branch + ': ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
}

export async function deleteBranch(branchName: string) {
  return deleteBranches([branchName]);
}

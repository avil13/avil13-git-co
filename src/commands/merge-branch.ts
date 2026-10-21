import { exec } from './exec';
import { getCurrentBranchName } from './get-current-branch-name';
import { deleteBranches } from './delete-barnch';
import { print } from '../terminal';
import { prompt } from '../prompt';

export async function mergeBranch(branchName: string) {
  if (!branchName) throw new Error('No branch selected.');
  const currentBranch = await getCurrentBranchName();
  if (branchName === currentBranch) throw new Error('Cannot merge the current branch into itself.');

  const { answer } = await prompt({
    type: 'confirm',
    name: 'answer',
    message: 'Merge branch ' + branchName + ' into ' + currentBranch + '?',
    default: false,
  });
  if (!answer) {
    print('Branch was not merged.');
    return;
  }

  print('git merge ' + branchName);
  print(await exec(['merge', '--', branchName]));

  // Only local branches can be deleted; never remove remote refs.
  const locals = (await exec(['for-each-ref', '--format=%(refname)', 'refs/heads/'])).split('\n');
  if (!locals.includes('refs/heads/' + branchName)) return;

  const { remove } = await prompt({
    type: 'confirm',
    name: 'remove',
    message: 'Delete merged branch ' + branchName + '?',
    default: true,
  });
  if (remove) await deleteBranches([branchName], false, false);
}

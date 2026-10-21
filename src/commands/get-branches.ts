import { exec } from './exec';

export enum BranchesType {
  All,
  Merged,
  NotMerged,
}

/** Remote origin refs are also offered for checkout/merge; deletion is local only. */
export async function getBranches(type: BranchesType, localOnly = false): Promise<string[]> {
  const args = ['branch', '--format=%(refname)'];
  if (!localOnly) args.push('--all');
  if (type === BranchesType.Merged) args.push('--merged');
  if (type === BranchesType.NotMerged) args.push('--no-merged');

  const stdout = await exec(args);
  const branches = [...new Set(stdout.split('\n')
    .map(name => name.trim())
    .filter(name => name && !/^refs\/remotes\/.+\/HEAD$/.test(name))
    .map(name => name.replace(/^refs\/heads\//, '')
      .replace(/^refs\/remotes\/(?:origin\/)?/, '')))];
  if (!branches.length) throw new Error('No branches found.');
  return branches;
}

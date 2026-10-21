import { ask, askBranches } from './ask';
import { Commands, getHelp, getVersion, parseArgs } from './cli-commands';
import { BranchesType, checkoutBranch, getBranches, getCurrentBranchName } from './commands';
import { deleteBranches } from './commands/delete-barnch';
import { getBranchLabels } from './commands/get-branch-labels';
import { mergeBranch } from './commands/merge-branch';
import { syncBranches } from './commands/sync-branches';
import { manageStashes } from './commands/stash';
import { finishTerminal, installInterruptHandler, print, startTerminal } from './terminal';

export const run = async () => {
  const { command, filter } = parseArgs();
  if (command === Commands.Version) {
    console.log(getVersion());
    return;
  }
  if (command === Commands.Help) {
    console.log(getHelp());
    return;
  }

  if (command === Commands.Stash) {
    startTerminal();
    await manageStashes(filter);
    return;
  }

  if (command === Commands.Sync) {
    startTerminal();
    await syncBranches();
    return;
  }

  const branchType = command === Commands.ShowMerged ? BranchesType.Merged
    : command === Commands.ShowUnMerged ? BranchesType.NotMerged : BranchesType.All;
  const deleting = command === Commands.DeleteBranch;
  let branches = await getBranches(branchType, deleting);
  if (deleting) {
    const currentBranch = await getCurrentBranchName();
    branches = branches.filter(branch => branch !== currentBranch);
    if (!branches.length) throw new Error('No local branches available for deletion.');
  }

  const labels = await getBranchLabels(branches);
  startTerminal();
  if (deleting) {
    const selected = await askBranches('Select branches to delete (Space to select)', branches, filter, labels);
    await deleteBranches(selected);
  } else {
    const { branch } = await ask('Select branch', branches, filter, labels);
    if (command === Commands.MergeBranch) await mergeBranch(branch);
    else {
      await checkoutBranch(branch);
      print(await getCurrentBranchName());
    }
  }
};

const removeInterruptHandler = installInterruptHandler();
run().catch(error => {
  finishTerminal();
  console.error('Error: ' + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
}).finally(() => {
  finishTerminal();
  removeInterruptHandler();
});

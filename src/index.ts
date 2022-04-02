import { ask } from './ask';
import { Commands, getHelp, getWishOfUser } from './cli-commands';
import { BranchesType, checkoutBranch, getBranches, getCurrentBranchName } from './commands';
import { deleteBranch } from './commands/delete-barnch';

const run = async () => {
  const userWish = getWishOfUser();

  if (Commands.Help === userWish) {
    console.log(getHelp());
    return;
  }

  let branchType: BranchesType = BranchesType.All;

  if (Commands.ShowMerged === userWish) {
    branchType = BranchesType.Merged;
  } else if (Commands.ShowUnMerged === userWish) {
    branchType = BranchesType.NotMerged;
  }

  const branches = await getBranches(branchType);

  const { branch } = await ask('Select branch', branches);

  if (Commands.DeleteBranch === userWish) {
    deleteBranch(branch);
    return;
  }

  await checkoutBranch(branch);

  await getCurrentBranchName()
};

run();

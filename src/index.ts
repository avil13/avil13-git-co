import { ask } from './ask';
import { Commands, getHelp, getWishOfUser } from './cli-commands';
import { checkoutBranch, getBranches, getCurrentBranchName } from './commands';
import { deleteBranch } from './commands/delete-barnch';

const run = async () => {
  const userWish = getWishOfUser();

  if (Commands.Help === userWish) {
    console.log(getHelp());
    return;
  }

  const branches = await getBranches();

  const { branch } = await ask('Select branch', branches);

  if (Commands.DeleteBranch === userWish) {
    deleteBranch(branch);
    return;
  }

  await checkoutBranch(branch);

  await getCurrentBranchName()
};

run();

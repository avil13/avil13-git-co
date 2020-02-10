import { getBranches, checkoutBranch, getCurrentBranchName } from './commands';
import { ask } from './ask';

const run = async () => {
  const branches = await getBranches();

  const { branch } = await ask('Select branch', branches);

  let stdout = '';

  stdout = await checkoutBranch(branch);
  console.log(stdout);

  stdout = await getCurrentBranchName()
  console.log(stdout);
};

try {
  run();
} catch (err) {
  console.log(err);
}

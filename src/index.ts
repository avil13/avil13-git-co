import { getBranches, checkoutBranch } from './commands';
import { ask } from './ask';

const run = async () => {
  const branches = await getBranches();

  const { branch } = await ask('Select branch', branches);

  const stdout = await checkoutBranch(branch);
  console.log(stdout);
};

try {
  run();
} catch (err) {
  console.log(err);
}

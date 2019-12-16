import { getBranches, checkoutBranch } from './commands';
import { ask } from './ask';

const run = async () => {
  const branches = await getBranches();

  const branch = await ask('Select branch', branches);

  await checkoutBranch(branch)
};

try {
  run();
} catch (err) {
  console.log(err);
}

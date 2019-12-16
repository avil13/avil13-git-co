import { getBranches } from './commands';
import { ask } from './ask';

const run = async () => {
  const branches = await getBranches();

  const answer = ask('Select branch', branches);

  console.log('=>', answer);
};

try {
  run();
} catch (err) {
  console.log(err);
}

import { exec } from './exec';
import { clc } from '../color';
import inquirer from 'inquirer';

//
export async function mergeBranch(branchName: string) {
  if (!branchName) {
    throw new Error('No branch...');
  }

  const currentBranch = await exec('git rev-parse --abbrev-ref HEAD');

  const message = [
    clc._blue,
    'Do you want to merge branch ',
    clc._green,
    branchName, // branch
    clc._blue,
    ' into ',
    clc._green,
    currentBranch, // branch
    clc._blue,
    '?',
    clc._off,
  ].join('');

  const res = await inquirer.prompt({
    type: 'confirm',
    name: 'answer',
    message,
    default: false,
  });

  if (res.answer === true) {
    const checkoutCommand = `git merge ${branchName}`;

    console.log(' ' + clc.green('git merge', branchName) + '\n');

    const checkoutCommandResult = await exec(checkoutCommand);
    console.log(checkoutCommandResult);

    return;
  }

  console.log(clc.yellow('The branch was not merged'));
}

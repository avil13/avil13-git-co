import inquirer from 'inquirer';
import { exec } from './exec';
import { clc } from '../color';

export async function deleteBranch(branchName: string) {
  if (!branchName) {
    throw new Error('No branch...');
  }

  const res = await inquirer.prompt({
    type: 'confirm',
    name: 'answer',
    message: clc.yellow('Are you sure you want to delete the branch "') + clc.red(branchName) + clc.yellow('"?'),
    default: false,
  });

  if (res.answer === true) {
    const command = `git branch -D ${branchName}`;

    console.log(' ' + clc.redBg(`git branch -D ${branchName}`, '') + '\n');

    const checkoutCommandResult = await exec(command);

    console.log(checkoutCommandResult);
    console.log(clc.yellow('Branch'), clc.red(branchName), clc.yellow('has been deleted'));

    return;
  }

  console.log(clc.yellow('The branch was not deleted'));
}

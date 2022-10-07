import { exec } from './exec';
import { clc } from '../color';

//
export async function mergeBranch(branchName: string) {
  if (!branchName) {
    throw new Error('No branch...');
  }

  const checkoutCommand = `git merge ${branchName}`;

  console.log(' ' + clc.green('git merge', branchName) + '\n');

  const checkoutCommandResult = await exec(checkoutCommand);
  console.log(checkoutCommandResult);
}

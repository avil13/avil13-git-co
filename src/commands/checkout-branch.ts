import { exec } from './exec';
import { clc } from '../color';

//
export async function checkoutBranch(branchName: string) {
  if (!branchName) {
    throw new Error('No branch...');
  }

  const checkoutCommand = `git checkout ${branchName}`;

  console.log(' ' + clc.green('git checkout', branchName) + '\n');

  const checkoutCommandResult = await exec(checkoutCommand);
  console.log(checkoutCommandResult);
}

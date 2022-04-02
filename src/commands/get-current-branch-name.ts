import { exec } from './exec';

export async function getCurrentBranchName(){
  const currentBranchName = `git rev-parse --abbrev-ref HEAD`;

  const stdout = await exec(currentBranchName);
  console.log(stdout);
}


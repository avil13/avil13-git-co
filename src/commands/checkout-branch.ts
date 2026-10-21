import { exec } from './exec';
import { print } from '../terminal';

export async function checkoutBranch(branchName: string) {
  if (!branchName) throw new Error('No branch selected.');
  print('git checkout ' + branchName);
  print(await exec(['checkout', branchName, '--']));
}

import { exec } from './exec';

export async function getCurrentBranchName(): Promise<string> {
  return (await exec(['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
}

import { exec } from './exec';
import { clc } from '../color';

const branchName = (ref: string) => ref.replace(/^refs\/(?:heads|remotes)\//, '');

/** Dates describe tip commits; merged means reachable from the current HEAD. */
export async function getBranchLabels(branches: string[]): Promise<Map<string, string>> {
  const [refs, mergedRefs] = await Promise.all([
    exec(['for-each-ref', '--format=%(refname)\t%(committerdate:short)', 'refs/heads/', 'refs/remotes/']),
    exec(['for-each-ref', '--merged=HEAD', '--format=%(refname)', 'refs/heads/', 'refs/remotes/']),
  ]);
  const dates = new Map(refs.split('\n').filter(Boolean).map(line => {
    const [ref, date] = line.split('\t');
    return [branchName(ref), date] as const;
  }));
  const merged = new Set(mergedRefs.split('\n').filter(Boolean).map(branchName));
  const width = branches.reduce((max, branch) => Math.max(max, branch.length), 0);
  return new Map(branches.map(branch => {
    const details = `${dates.get(branch) || 'unknown date'}  ${merged.has(branch) ? 'merged' : 'not merged'}`;
    const label = `${branch.padEnd(width)}  ${process.stdout.isTTY ? clc.gray(details) : details}`;
    return [branch, label];
  }));
}

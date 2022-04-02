import { exec } from './exec';

/**
 * get branch list
 */
export function getBranches(): Promise<string[]> {
  return exec('git branch --all')
    .then(parseBranches)
    .then(branches => {
      if (branches.length) {
        return branches;
      }
      throw new Error('No branches found...');
    });
}

function parseBranches(stdout) {
  return stdout
    .split('\n')
    .filter(s => !/\s->\s/.test(s))
    .map(cleanBranchName)
    .filter(Boolean)
    .filter(onlyUnique);
}

function cleanBranchName(name) {
  return name
    .replace(/^\*/, '')
    .replace(/remotes\/origin\//, '')
    .trim();
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

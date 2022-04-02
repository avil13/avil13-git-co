import { exec } from './exec';


export enum BranchesType {
  All,
  Merged,
  NotMerged,
}

const commandsForGetBranches = {
  [BranchesType.All]: 'git branch --all',
  [BranchesType.Merged]: 'git branch --all --merged',
  [BranchesType.NotMerged]: 'git branch --all --no-merged',
} as const;

/**
 * get branch list
 */
export function getBranches(type: BranchesType): Promise<string[]> {
  const command = commandsForGetBranches[type];

  return exec(command)
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

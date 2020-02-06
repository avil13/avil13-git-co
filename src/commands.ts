const child_process = require('child_process');
const clc = require('./color');

function exec(command) {
  return new Promise((resolve, reject) =>
    child_process.exec(command, (err, stdout) =>
      err ? reject(err) : resolve(stdout)
    )
  );
}

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

/**
 * checkout branch
 */
export function checkoutBranch(branchName: string) {
  if (!branchName) {
    throw new Error('No branch...');
  }

  console.log(' ', clc.green('git checkout', branchName));
  const command = `git checkout ${branchName}`;

  return exec(command);
}

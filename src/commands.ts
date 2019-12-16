const child_process = require('child_process');

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
  return exec('git branch')
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
    .map(cleanBranchName)
    .filter(Boolean);
}

function cleanBranchName(name) {
  return name.replace(/^\*/, '').trim();
}

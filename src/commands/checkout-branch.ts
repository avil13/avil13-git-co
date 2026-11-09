import { exec } from './exec';
import { print } from '../terminal';

export async function checkoutBranch(branchName: string) {
  if (!branchName) throw new Error('No branch selected.');
  const locals = (await exec(['for-each-ref', '--format=%(refname)', 'refs/heads/'])).split('\n');
  const args = ['switch'];
  if (!locals.includes('refs/heads/' + branchName)) {
    const remotes = (await exec(['remote'])).split('\n').filter(Boolean);
    const remote = remotes.sort((a, b) => b.length - a.length)
      .find(name => branchName.startsWith(name + '/'));
    if (remote) {
      const localName = branchName.slice(remote.length + 1);
      if (!locals.includes('refs/heads/' + localName)) {
        args.push('--track', '-c', localName);
        branchName = 'refs/remotes/' + branchName;
      } else {
        branchName = localName;
      }
    }
  }
  args.push('--', branchName);
  print('git ' + args.join(' '));
  print(await exec(args));
}

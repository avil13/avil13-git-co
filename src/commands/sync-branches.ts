import { exec } from './exec';
import { getCurrentBranchName } from './get-current-branch-name';
import { print } from '../terminal';

/** Synchronize local branches without switching branches or rewriting commits. */
export async function syncBranches() {
  const remotes = (await exec(['remote'])).split('\n').filter(Boolean);
  if (!remotes.length) throw new Error('No remotes configured. Add a Git remote before running co -p.');

  print('Fetching all remotes...');
  print(await exec(['fetch', '--all', '--prune']));

  const refs = new Map((await exec(['for-each-ref', '--format=%(refname)%09%(objectname)']))
    .split('\n').filter(Boolean).map(line => {
      const [ref, oid] = line.split('\t');
      return [ref, oid] as [string, string];
    }));
  const branches = (await exec([
    'for-each-ref', '--format=%(refname)%09%(objectname)%09%(upstream)', 'refs/heads/',
  ])).split('\n').filter(Boolean).map(line => {
    const [ref, oid, upstream = ''] = line.split('\t');
    return { ref, oid, upstream, name: ref.slice('refs/heads/'.length) };
  });
  const current = 'refs/heads/' + await getCurrentBranchName();
  const checkedOut = new Set((await exec(['worktree', 'list', '--porcelain', '-z']))
    .split('\0').filter(field => field.startsWith('branch ')).map(field => field.slice(7)));
  const dirty = Boolean(await exec(['status', '--porcelain']));
  const stale: typeof branches = [];
  const errors: string[] = [];

  for (const branch of branches) {
    try {
      let upstream = branch.upstream;
      if (!upstream) {
        const candidates = remotes.map(remote => 'refs/remotes/' + remote + '/' + branch.name)
          .filter(ref => refs.has(ref));
        const origin = 'refs/remotes/origin/' + branch.name;
        if (candidates.includes(origin)) upstream = origin;
        else if (candidates.length === 1) upstream = candidates[0];
        else {
          print(branch.name + ': skipped (' + (candidates.length ? 'ambiguous upstream' : 'no upstream') + ').');
          continue;
        }
      }

      const target = refs.get(upstream);
      if (!target) {
        if (upstream.startsWith('refs/remotes/')) stale.push(branch);
        else print(branch.name + ': skipped (upstream is missing).');
        continue;
      }

      const [ahead, behind] = (await exec(['rev-list', '--left-right', '--count', branch.oid + '...' + target]))
        .split(/\s+/).map(Number);
      if (ahead) {
        print(branch.name + ': warning: ' + ahead + ' unpushed commit(s)' +
          (behind ? ', diverged from upstream by ' + behind + ' commit(s)' : '') + '; kept unchanged.');
      } else if (!behind) {
        print(branch.name + ': up to date.');
      } else if (checkedOut.has(branch.ref) && branch.ref !== current) {
        print(branch.name + ': skipped (checked out in another worktree).');
      } else if (branch.ref === current && dirty) {
        print(branch.name + ': skipped (working tree has uncommitted changes).');
      } else {
        if (branch.ref === current) {
          print(await exec(['merge', '--ff-only', '--no-edit', '--', target]));
        } else {
          // Compare-and-swap protects against concurrent changes to the local ref.
          await exec(['update-ref', '-m', 'co sync: fast-forward', branch.ref, target, branch.oid]);
        }
        print(branch.name + ': fast-forwarded.');
      }
    } catch (error) {
      errors.push(branch.name + ': ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  // Check merged status after fast-forwards so newly integrated branches can
  // be removed too. Never force-delete or delete a checked-out branch.
  for (const branch of stale) {
    try {
      if (checkedOut.has(branch.ref)) {
        print(branch.name + ': kept (upstream deleted, branch is checked out).');
      } else if (await exec(['rev-list', '--count', branch.oid, '--not', 'HEAD']) !== '0') {
        print(branch.name + ': warning: upstream deleted, unmerged commits kept.');
      } else {
        print(await exec(['branch', '-d', '--', branch.name]));
      }
    } catch (error) {
      errors.push(branch.name + ': ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
}

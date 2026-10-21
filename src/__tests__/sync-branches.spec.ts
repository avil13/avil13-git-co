import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { syncBranches } from '../commands/sync-branches';

const context = vi.hoisted(() => ({ cwd: '' }));
vi.mock('child_process', async importOriginal => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    execFile: (file, args, callback) => actual.execFile(file, args, { cwd: context.cwd }, callback),
  };
});

let root: string;
let remote: string;
let peer: string;
function gitAt(cwd: string, ...args: string[]) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function git(...args: string[]) { return gitAt(context.cwd, ...args); }
function other(...args: string[]) { return gitAt(peer, ...args); }
function commit(cwd: string, text: string) {
  writeFileSync(join(cwd, 'file.txt'), text);
  gitAt(cwd, 'add', 'file.txt');
  gitAt(cwd, 'commit', '-qm', text);
}
function publishFeature() {
  other('checkout', '-qb', 'feature');
  commit(peer, 'feature initial');
  other('push', '-qu', 'origin', 'feature');
  git('fetch', '-q');
  git('branch', '--track', 'feature', 'origin/feature');
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'co-sync-'));
  context.cwd = join(root, 'work');
  remote = join(root, 'remote.git');
  peer = join(root, 'peer');
  gitAt(root, 'init', '--bare', '-q', '-b', 'main', remote);
  gitAt(root, 'init', '-q', '-b', 'main', context.cwd);
  git('config', 'user.name', 'Test');
  git('config', 'user.email', 'test@example.test');
  commit(context.cwd, 'initial');
  git('remote', 'add', 'origin', remote);
  git('push', '-qu', 'origin', 'main');
  gitAt(root, 'clone', '-q', remote, peer);
  other('config', 'user.name', 'Test');
  other('config', 'user.email', 'test@example.test');
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(root, { recursive: true, force: true });
});

it('fetches and fast-forwards both current and inactive branches without switching', async () => {
  publishFeature();
  commit(peer, 'feature update');
  other('push', '-q');
  other('checkout', '-q', 'main');
  commit(peer, 'main update');
  other('push', '-q');

  await syncBranches();

  expect(git('rev-parse', 'main')).toBe(other('rev-parse', 'main'));
  expect(git('rev-parse', 'feature')).toBe(other('rev-parse', 'feature'));
  expect(git('branch', '--show-current')).toBe('main');
  expect(readFileSync(join(context.cwd, 'file.txt'), 'utf8')).toBe('main update');
});

it('keeps unpushed commits', async () => {
  commit(context.cwd, 'local work');
  const before = git('rev-parse', 'HEAD');
  await syncBranches();
  expect(git('rev-parse', 'HEAD')).toBe(before);
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('unpushed'));
});

it('does not merge or rebase diverged branches', async () => {
  commit(context.cwd, 'local work');
  commit(peer, 'remote work');
  other('push', '-q');
  const before = git('rev-parse', 'HEAD');
  await syncBranches();
  expect(git('rev-parse', 'HEAD')).toBe(before);
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('diverged'));
});

it('preserves a dirty current working tree', async () => {
  commit(peer, 'remote work');
  other('push', '-q');
  writeFileSync(join(context.cwd, 'file.txt'), 'uncommitted');
  const before = git('rev-parse', 'HEAD');
  await syncBranches();
  expect(git('rev-parse', 'HEAD')).toBe(before);
  expect(readFileSync(join(context.cwd, 'file.txt'), 'utf8')).toBe('uncommitted');
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('uncommitted changes'));
});

it('uses a same-named remote branch without changing tracking configuration', async () => {
  git('branch', '--unset-upstream', 'main');
  commit(peer, 'remote update');
  other('push', '-q');
  await syncBranches();
  expect(git('rev-parse', 'HEAD')).toBe(other('rev-parse', 'HEAD'));
  expect(git('for-each-ref', '--format=%(upstream)', 'refs/heads/main')).toBe('');
});

it('deletes merged branches after fetching a deleted upstream', async () => {
  git('branch', 'obsolete');
  git('push', '-qu', 'origin', 'obsolete');
  other('push', '-q', 'origin', '--delete', 'obsolete');
  await syncBranches();
  expect(git('branch', '--list', 'obsolete')).toBe('');
  expect(git('branch', '--list', 'main')).toContain('main');
});

it('checks stale branches after fast-forwarding the current branch', async () => {
  publishFeature();
  other('checkout', '-q', 'main');
  other('merge', '--ff-only', 'feature');
  other('push', '-q');
  other('push', '-q', 'origin', '--delete', 'feature');
  await syncBranches();
  expect(git('branch', '--list', 'feature')).toBe('');
  expect(git('rev-parse', 'main')).toBe(other('rev-parse', 'main'));
});

it('keeps unmerged branches when their upstream is deleted', async () => {
  publishFeature();
  other('push', '-q', 'origin', '--delete', 'feature');
  const before = git('rev-parse', 'feature');
  await syncBranches();
  expect(git('rev-parse', 'feature')).toBe(before);
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('unmerged commits kept'));
});

it('never deletes the checked-out branch even if its upstream disappeared', async () => {
  gitAt(remote, 'config', 'receive.denyDeleteCurrent', 'ignore');
  other('push', '-q', 'origin', '--delete', 'main');
  await syncBranches();
  expect(git('branch', '--show-current')).toBe('main');
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('branch is checked out'));
});

it('does not update branches checked out in another worktree', async () => {
  publishFeature();
  const worktree = join(root, 'linked');
  git('worktree', 'add', '-q', worktree, 'feature');
  const before = git('rev-parse', 'feature');
  commit(peer, 'remote feature update');
  other('push', '-q');
  await syncBranches();
  expect(git('rev-parse', 'feature')).toBe(before);
  expect(readFileSync(join(worktree, 'file.txt'), 'utf8')).toBe('feature initial');
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('another worktree'));
});

it('skips local-only branches', async () => {
  git('branch', '--no-track', 'local-only');
  await syncBranches();
  expect(git('branch', '--list', 'local-only')).toContain('local-only');
  expect(console.log).toHaveBeenCalledWith('local-only: skipped (no upstream).');
});

it('uses a unique same-named branch on a non-origin remote', async () => {
  git('remote', 'rename', 'origin', 'upstream');
  git('branch', '--unset-upstream', 'main');
  commit(peer, 'remote update');
  other('push', '-q');
  await syncBranches();
  expect(git('rev-parse', 'HEAD')).toBe(other('rev-parse', 'HEAD'));
});

it('does not guess between multiple matching remotes without origin', async () => {
  git('remote', 'rename', 'origin', 'one');
  git('remote', 'add', 'two', remote);
  git('branch', '--unset-upstream', 'main');
  commit(peer, 'remote update');
  other('push', '-q');
  const before = git('rev-parse', 'HEAD');
  await syncBranches();
  expect(git('rev-parse', 'HEAD')).toBe(before);
  expect(console.log).toHaveBeenCalledWith('main: skipped (ambiguous upstream).');
});

it('can update local branches while HEAD is detached without touching the worktree', async () => {
  git('checkout', '--detach', '-q');
  const before = git('rev-parse', 'HEAD');
  commit(peer, 'remote update');
  other('push', '-q');
  await syncBranches();
  expect(git('rev-parse', 'main')).toBe(other('rev-parse', 'main'));
  expect(git('rev-parse', 'HEAD')).toBe(before);
  expect(readFileSync(join(context.cwd, 'file.txt'), 'utf8')).toBe('initial');
});

it('keeps merged stale branches checked out in other worktrees', async () => {
  git('branch', 'obsolete');
  git('push', '-qu', 'origin', 'obsolete');
  git('worktree', 'add', '-q', join(root, 'linked'), 'obsolete');
  other('push', '-q', 'origin', '--delete', 'obsolete');
  await syncBranches();
  expect(git('branch', '--list', 'obsolete')).toContain('obsolete');
});

it('fails clearly when there are no remotes', async () => {
  git('remote', 'remove', 'origin');
  await expect(syncBranches()).rejects.toThrow('No remotes configured');
});

it('does not change branches if fetching fails', async () => {
  git('remote', 'set-url', 'origin', join(root, 'missing.git'));
  const before = git('show-ref');
  await expect(syncBranches()).rejects.toThrow();
  expect(git('show-ref')).toBe(before);
});

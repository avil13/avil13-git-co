import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import inquirer from 'inquirer';
import { exec } from '../commands/exec';
import { BranchesType, getBranches } from '../commands/get-branches';
import { checkoutBranch } from '../commands/checkout-branch';
import { deleteBranches } from '../commands/delete-barnch';
import { mergeBranch } from '../commands/merge-branch';

const context = vi.hoisted(() => ({ cwd: '' }));
vi.mock('child_process', async importOriginal => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    execFile: (file, args, callback) => actual.execFile(file, args, { cwd: context.cwd }, callback),
  };
});

function git(...args: string[]) {
  return execFileSync('git', args, { cwd: context.cwd, encoding: 'utf8' }).trim();
}

beforeEach(() => {
  context.cwd = mkdtempSync(join(tmpdir(), 'co-test-'));
  git('init', '-q', '-b', 'main');
  git('config', 'user.name', 'Test');
  git('config', 'user.email', 'test@example.test');
  git('commit', '-q', '--allow-empty', '-m', 'initial');
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(context.cwd, { recursive: true, force: true });
});

describe('Git commands', () => {
  it('reports Git diagnostics on failure', async () => {
    await expect(exec(['checkout', 'missing', '--'])).rejects.toThrow('missing');
  });

  it('checks out branch names containing shell metacharacters literally', async () => {
    const branch = 'task/1234;echo-pwned';
    git('branch', branch);
    await checkoutBranch(branch);
    expect(git('branch', '--show-current')).toBe(branch);
  });

  it('preserves local origin-prefixed branches and deduplicates origin remote refs', async () => {
    git('branch', 'origin/local');
    git('update-ref', 'refs/remotes/origin/main', 'HEAD');
    git('symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main');
    expect(await getBranches(BranchesType.All)).toEqual(['main', 'origin/local']);
  });

  it('excludes remote refs from deletion candidates', async () => {
    git('update-ref', 'refs/remotes/origin/remote-only', 'HEAD');
    expect(await getBranches(BranchesType.All, true)).toEqual(['main']);
  });

  it('deletes multiple selected branches after one confirmation', async () => {
    git('branch', 'one');
    git('branch', 'two');
    const prompt = vi.spyOn(inquirer, 'prompt').mockResolvedValue({ answer: true });
    await deleteBranches(['one', 'two']);
    expect(git('branch', '--format=%(refname:short)')).toBe('main');
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('does not delete when confirmation is declined', async () => {
    git('branch', 'one');
    vi.spyOn(inquirer, 'prompt').mockResolvedValue({ answer: false });
    await deleteBranches(['one']);
    expect(git('branch', '--list', 'one')).toContain('one');
  });

  it('continues deleting and reports partial failures', async () => {
    git('branch', 'one');
    await expect(deleteBranches(['missing', 'one'], false)).rejects.toThrow('missing');
    expect(git('branch', '--list', 'one')).toBe('');
  });

  it('offers safe deletion after successful merge, defaulting to yes', async () => {
    git('branch', 'feature');
    const prompt = vi.spyOn(inquirer, 'prompt')
      .mockResolvedValueOnce({ answer: true })
      .mockResolvedValueOnce({ remove: true });
    await mergeBranch('feature');
    expect(prompt.mock.calls[1][0]).toMatchObject({ default: true });
    expect(git('branch', '--list', 'feature')).toBe('');
  });

  it('keeps the merged branch if deletion is declined', async () => {
    git('branch', 'feature');
    vi.spyOn(inquirer, 'prompt')
      .mockResolvedValueOnce({ answer: true })
      .mockResolvedValueOnce({ remove: false });
    await mergeBranch('feature');
    expect(git('branch', '--list', 'feature')).toContain('feature');
  });

  it('never offers deletion after a failed merge', async () => {
    const prompt = vi.spyOn(inquirer, 'prompt').mockResolvedValue({ answer: true });
    await expect(mergeBranch('missing')).rejects.toThrow('missing');
    expect(prompt).toHaveBeenCalledTimes(1);
  });
});

import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import inquirer from 'inquirer';
import { applyStash, dropStash, getStashes, manageStashes, showStash } from '../commands/stash';

const context = vi.hoisted(() => ({ cwd: '' }));
vi.mock('child_process', async importOriginal => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    execFile: (file, args, callback) => actual.execFile(file, args, { cwd: context.cwd }, callback),
  };
});

function git(...args: string[]) {
  return execFileSync('git', args, { cwd: context.cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function stash(message = 'saved work') {
  writeFileSync(join(context.cwd, 'file.txt'), message);
  git('stash', 'push', '-qm', message);
}

beforeEach(() => {
  context.cwd = mkdtempSync(join(tmpdir(), 'co-stash-'));
  git('init', '-q', '-b', 'main');
  git('config', 'user.name', 'Test');
  git('config', 'user.email', 'test@example.test');
  writeFileSync(join(context.cwd, 'file.txt'), 'initial');
  git('add', '.');
  git('commit', '-qm', 'initial');
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  rmSync(context.cwd, { recursive: true, force: true });
});

it('handles an empty stash list without prompting', async () => {
  const prompt = vi.spyOn(inquirer, 'prompt');
  expect(await getStashes()).toEqual([]);
  await manageStashes();
  expect(prompt).not.toHaveBeenCalled();
  expect(console.log).toHaveBeenCalledWith('No stash entries.');
});

it('lists newest first with references, dates, author and literal messages', async () => {
  stash('older');
  stash('new; $(echo nope) | message');
  const entries = await getStashes();
  expect(entries).toHaveLength(2);
  expect(entries[0]).toMatchObject({ ref: 'stash@{0}', author: 'Test', message: 'On main: new; $(echo nope) | message' });
  expect(entries[0].hash).toBe(git('rev-parse', 'stash@{0}'));
  expect(Number.isNaN(Date.parse(entries[0].date))).toBe(false);
  expect(entries[1].ref).toBe('stash@{1}');
});

it('shows metadata and tracked and untracked file statistics', async () => {
  writeFileSync(join(context.cwd, 'file.txt'), 'changed');
  writeFileSync(join(context.cwd, 'extra.txt'), 'untracked');
  git('stash', 'push', '-qu', '-m', 'details');
  const [entry] = await getStashes();
  await showStash(entry);
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining(`Commit: ${entry.hash}`));
  expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/extra.txt[\s\S]*file.txt/));
});

it('renders stash details and statistics in gray in a terminal', async () => {
  stash();
  const descriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
  Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
  try {
    await showStash((await getStashes())[0]);
    expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/^\x1b\[0;90m[\s\S]*file.txt[\s\S]*\x1b\[0m$/));
  } finally {
    if (descriptor) Object.defineProperty(process.stdout, 'isTTY', descriptor);
    else delete (process.stdout as any).isTTY;
  }
});

it.each([false, true])('applies changes with pop=%s and keeps/removes the stash', async pop => {
  stash();
  await applyStash((await getStashes())[0], pop);
  expect(readFileSync(join(context.cwd, 'file.txt'), 'utf8')).toBe('saved work');
  expect(await getStashes()).toHaveLength(pop ? 0 : 1);
});

it('keeps the stash when pop has conflicts', async () => {
  stash();
  writeFileSync(join(context.cwd, 'file.txt'), 'conflicting commit');
  git('add', '.');
  git('commit', '-qm', 'conflict');
  await expect(applyStash((await getStashes())[0], true)).rejects.toThrow();
  expect(await getStashes()).toHaveLength(1);
  expect(git('status', '--porcelain')).toContain('UU file.txt');
});

it('does not drop a stash if confirmation is declined', async () => {
  stash();
  const prompt = vi.spyOn(inquirer, 'prompt').mockResolvedValue({ answer: 'n' });
  expect(await dropStash((await getStashes())[0])).toBe(false);
  expect(await getStashes()).toHaveLength(1);
  expect(prompt).toHaveBeenCalledWith(expect.objectContaining({ default: 'Y', message: expect.stringContaining('[n/Y]') }));
});

it('drops only the selected stash after confirmation', async () => {
  stash('older');
  stash('newer');
  vi.spyOn(inquirer, 'prompt').mockResolvedValue({ answer: 'Y' });
  expect(await dropStash((await getStashes())[1])).toBe(true);
  expect((await getStashes()).map(entry => entry.message)).toEqual(['On main: newer']);
});

it('refuses to act on an entry whose index has changed', async () => {
  stash('older');
  const [entry] = await getStashes();
  stash('newer');
  vi.spyOn(inquirer, 'prompt').mockResolvedValue({ answer: 'y' });
  await expect(dropStash(entry)).rejects.toThrow('Stash list changed');
  await expect(applyStash(entry)).rejects.toThrow('Stash list changed');
  expect(await getStashes()).toHaveLength(2);
});

it('refreshes the list after deletion and permits exiting', async () => {
  stash('older');
  stash('newer');
  const [entry] = await getStashes();
  const prompt = vi.spyOn(inquirer, 'prompt')
    .mockResolvedValueOnce({ entry })
    .mockResolvedValueOnce({ action: 'drop' })
    .mockResolvedValueOnce({ answer: 'y' })
    .mockResolvedValueOnce({ entry: null });
  await manageStashes();
  const choices = (prompt.mock.calls[3][0] as any).choices;
  expect(choices).toHaveLength(2);
  expect(choices[0].value).toMatchObject({ ref: 'stash@{0}', message: 'On main: older' });
});

it('filters the selection and allows backing out without changes', async () => {
  stash('older');
  stash('newer');
  const entry = (await getStashes())[1];
  const prompt = vi.spyOn(inquirer, 'prompt')
    .mockResolvedValueOnce({ entry })
    .mockResolvedValueOnce({ action: 'back' })
    .mockResolvedValueOnce({ entry: null });
  await manageStashes('older');
  expect((prompt.mock.calls[0][0] as any).choices).toHaveLength(2);
  expect(await getStashes()).toHaveLength(2);
});

it('reports a filter with no matches without prompting', async () => {
  stash();
  const prompt = vi.spyOn(inquirer, 'prompt');
  await manageStashes('missing');
  expect(prompt).not.toHaveBeenCalled();
  expect(console.log).toHaveBeenCalledWith('No stash entries match the filter.');
});

it.each(['apply', 'pop'])('runs the selected %s action', async action => {
  stash();
  const [entry] = await getStashes();
  vi.spyOn(inquirer, 'prompt')
    .mockResolvedValueOnce({ entry })
    .mockResolvedValueOnce({ action });
  await manageStashes();
  expect(readFileSync(join(context.cwd, 'file.txt'), 'utf8')).toBe('saved work');
  expect(await getStashes()).toHaveLength(action === 'pop' ? 0 : 1);
});

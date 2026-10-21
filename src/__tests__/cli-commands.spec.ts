import { describe, expect, it } from 'vitest';
import { Commands, parseArgs } from '../cli-commands';

describe('arguments', () => {
  it('defaults to checkout', () => {
    expect(parseArgs([])).toEqual({ command: Commands.Unknown, filter: '' });
  });
  it('preloads a checkout filter', () => {
    expect(parseArgs(['-', '1234'])).toEqual({ command: Commands.Unknown, filter: '1234' });
  });
  it('accepts filters with commands', () => {
    expect(parseArgs(['-D', '-', 'task', '1234'])).toEqual({
      command: Commands.DeleteBranch, filter: 'task 1234',
    });
  });
  it.each(['m', '-sm', '--show-merged'])('accepts merged alias %s', alias => {
    expect(parseArgs([alias]).command).toBe(Commands.ShowMerged);
  });
  it.each(['un', '-un', '--no-merged'])('accepts unmerged alias %s', alias => {
    expect(parseArgs([alias]).command).toBe(Commands.ShowUnMerged);
  });
  it.each(['-s', '--stash'])('accepts stash alias %s and optional filter', alias => {
    expect(parseArgs([alias])).toEqual({ command: Commands.Stash, filter: '' });
    expect(parseArgs([alias, '-', 'work'])).toEqual({ command: Commands.Stash, filter: 'work' });
  });
  it('accepts sync without a filter', () => {
    expect(parseArgs(['-p'])).toEqual({ command: Commands.Sync, filter: '' });
  });
  it('rejects a filter for sync instead of silently ignoring it', () => {
    expect(() => parseArgs(['-p', '-', '1234'])).toThrow('does not accept a filter');
  });
  it('reports unknown options', () => {
    expect(() => parseArgs(['--typo'])).toThrow('Unknown option');
  });
});

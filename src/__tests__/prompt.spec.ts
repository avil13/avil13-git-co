import { afterEach, expect, it, vi } from 'vitest';
import inquirer from 'inquirer';
import { prompt } from '../prompt';

const descriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');

afterEach(() => {
  vi.restoreAllMocks();
  if (descriptor) Object.defineProperty(process.stdout, 'isTTY', descriptor);
  else delete (process.stdout as any).isTTY;
});

it.each([true, false])('styles prompt headings only in a terminal (TTY=%s)', async isTTY => {
  Object.defineProperty(process.stdout, 'isTTY', { value: isTTY, configurable: true });
  const spy = vi.spyOn(inquirer, 'prompt').mockResolvedValue({ branch: 'main' });
  const question = { name: 'branch', message: 'Select branch' };
  const expected = {
    ...question,
    message: isTTY ? '\x1b[93mSelect branch\x1b[39m' : 'Select branch',
  };

  await prompt(question);
  expect(spy).toHaveBeenLastCalledWith(expected);
  await prompt([question]);
  expect(spy).toHaveBeenLastCalledWith([expected]);
  expect(question.message).toBe('Select branch');
});

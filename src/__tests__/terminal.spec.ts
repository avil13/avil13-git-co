import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { finishTerminal, print, startTerminal } from '../terminal';

const descriptors = [process.stdin, process.stdout].map(stream =>
  Object.getOwnPropertyDescriptor(stream, 'isTTY'));

function setTTY(value: boolean) {
  for (const stream of [process.stdin, process.stdout]) {
    Object.defineProperty(stream, 'isTTY', { value, configurable: true });
  }
}

beforeEach(() => {
  vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  finishTerminal(true);
  [process.stdin, process.stdout].forEach((stream, index) => {
    const descriptor = descriptors[index];
    if (descriptor) Object.defineProperty(stream, 'isTTY', descriptor);
    else delete (stream as any).isTTY;
  });
  vi.restoreAllMocks();
});

it('does not emit screen controls outside a TTY', () => {
  setTTY(false);
  startTerminal();
  print('result');
  finishTerminal();
  expect(process.stdout.write).not.toHaveBeenCalled();
  expect(console.log).toHaveBeenCalledExactlyOnceWith('result');
});

it('restores the screen and replays results on success only once', () => {
  setTTY(true);
  startTerminal();
  print('result');
  finishTerminal();
  finishTerminal();
  expect(process.stdout.write).toHaveBeenNthCalledWith(1, '\x1b[?1049h');
  expect(process.stdout.write).toHaveBeenNthCalledWith(2, '\x1b[?1049l\x1b[?25h');
  expect(process.stdout.write).toHaveBeenCalledTimes(2);
  expect(console.log).toHaveBeenCalledTimes(2);
});

it('restores the screen without replaying output on cancellation', () => {
  setTTY(true);
  startTerminal();
  print('discard this');
  finishTerminal(true);
  expect(process.stdout.write).toHaveBeenLastCalledWith('\x1b[?1049l\x1b[?25h');
  expect(console.log).toHaveBeenCalledTimes(1);
});

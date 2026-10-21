import { checkItem } from '../ask';
import { clc } from '../color';
import { prompt } from '../prompt';
import { print } from '../terminal';
import { exec } from './exec';

export interface StashEntry {
  ref: string;
  hash: string;
  date: string;
  author: string;
  message: string;
}

export async function getStashes(): Promise<StashEntry[]> {
  const output = await exec(['stash', 'list', '--format=%gd%x00%H%x00%cI%x00%an%x00%gs']);
  if (!output) return [];
  return output.split('\n').map(line => {
    const [ref, hash, date, author, message] = line.split('\0');
    return { ref, hash, date, author, message };
  });
}

async function assertStash(entry: StashEntry) {
  // Reflog indices can shift if another process changes the stash list.
  const hash = await exec(['rev-parse', '--verify', entry.ref]);
  if (hash !== entry.hash) throw new Error('Stash list changed. Run co --stash again.');
}

export async function showStash(entry: StashEntry) {
  await assertStash(entry);
  const details = `${entry.ref}: ${entry.message}\nDate: ${entry.date}\nAuthor: ${entry.author}\nCommit: ${entry.hash}`;
  const stats = await exec(['stash', 'show', '--stat', '--include-untracked', '--no-color', entry.hash]);
  const output = [details, stats].filter(Boolean).join('\n');
  print(process.stdout.isTTY ? clc.gray(output) : output);
}

export async function applyStash(entry: StashEntry, pop = false) {
  await assertStash(entry);
  // Let Git perform pop: on conflicts it preserves the stash automatically.
  print(await exec(['stash', pop ? 'pop' : 'apply', entry.ref]));
  print(`${entry.ref}: ${pop ? 'popped' : 'applied (stash kept)'}.`);
}

export async function dropStash(entry: StashEntry): Promise<boolean> {
  const { answer } = await prompt<{ answer: string }>({
    type: 'input',
    name: 'answer',
    message: `Delete ${entry.ref}: ${entry.message}? [n/Y]`,
    default: 'Y',
    filter: (value: string) => value.trim().toLowerCase(),
    validate: (value: string) => ['n', 'y'].includes(value) || 'Enter n or Y.',
  });
  if (answer.toLowerCase() !== 'y') {
    print('Stash was not deleted.');
    return false;
  }
  await assertStash(entry);
  print(await exec(['stash', 'drop', entry.ref]));
  return true;
}

export async function manageStashes(filter = '') {
  while (true) {
    const entries = await getStashes();
    if (!entries.length) {
      print('No stash entries.');
      return;
    }
    const filtered = entries.filter(entry => checkItem(`${entry.ref} ${entry.date} ${entry.message}`, filter));
    if (!filtered.length) {
      print('No stash entries match the filter.');
      return;
    }
    const { entry } = await prompt<{ entry: StashEntry | null }>({
      type: 'list',
      name: 'entry',
      message: 'Select stash',
      choices: [
        ...filtered.map(value => ({ name: `📦 ${value.ref} | ${value.date} | ${value.message}`, value })),
        { name: '🚪 Exit', value: null },
      ],
    });
    if (!entry) return;
    await showStash(entry);
    const { action } = await prompt<{ action: string }>({
      type: 'list',
      name: 'action',
      message: `Action for ${entry.ref}`,
      choices: [
        { name: '⬅️ Back to stash list', value: 'back' },
        { name: '📥 Apply (keep stash)', value: 'apply' },
        { name: '📤 Pop (apply and remove on success)', value: 'pop' },
        { name: '🗑️ Delete stash', value: 'drop' },
        { name: '🚪 Exit', value: 'exit' },
      ],
    });
    if (action === 'exit') return;
    if (action === 'apply' || action === 'pop') {
      await applyStash(entry, action === 'pop');
      return;
    }
    if (action === 'drop') await dropStash(entry);
  }
}

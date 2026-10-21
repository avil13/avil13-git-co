import { afterEach, expect, it, vi } from 'vitest';
import { prompt } from '../prompt';
import { ask, askBranches } from '../ask';

vi.mock('../prompt', () => ({ prompt: vi.fn() }));
afterEach(() => vi.clearAllMocks());

const labels = new Map([
  ['main', 'main     2026-01-01  merged'],
  ['feature', 'feature  2026-02-01  not merged'],
]);

it('shows metadata in autocomplete while filtering only names and returning branch values', async () => {
  vi.mocked(prompt).mockResolvedValue({ branch: 'feature' });
  expect(await ask('Select branch', ['main', 'feature'], '', labels)).toEqual({ branch: 'feature' });
  const question = vi.mocked(prompt).mock.calls[0][0] as any;
  expect(await question.source({}, 'feat')).toEqual([
    { name: labels.get('feature'), value: 'feature', short: 'feature' },
  ]);
  expect(await question.source({}, '2026')).toEqual([]);
  expect(await question.source({}, 'merged')).toEqual([]);
});

it('shows metadata in deletion choices without changing selected branch names', async () => {
  vi.mocked(prompt).mockResolvedValue({ branches: ['feature'] });
  expect(await askBranches('Delete branches', ['main', 'feature'], 'feat', labels)).toEqual(['feature']);
  const question = vi.mocked(prompt).mock.calls[0][0] as any;
  expect(question.choices).toEqual([
    { name: labels.get('feature'), value: 'feature', short: 'feature' },
  ]);
});

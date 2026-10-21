import { expect, it } from 'vitest';
import { checkItem, sortOrder } from '../ask';

it.each(['[', '(', '*', '+', '?', '.', '\\', '$', '^'])('treats %s literally', symbol => {
  expect(checkItem('task/' + symbol + '1234', symbol)).toBe(true);
  expect(checkItem('task/1234', symbol)).toBe(false);
});

it('matches case-insensitive subsequences and ignores spaces', () => {
  expect(checkItem('feature/TASK-1234', 't 14')).toBe(true);
  expect(checkItem('feature/TASK-1234', '4321')).toBe(false);
});

it('returns zero for equivalent ranks', () => {
  expect(sortOrder('task', 'first', 'second')).toBe(0);
  expect(sortOrder('', 'first', 'second')).toBe(0);
});

it('ranks contiguous matches by position and keeps other choices stable', () => {
  const list = [
    'chore/EDODEV-10449-act-master',
    'chore/release-to-master',
    'master',
    'feature/EDODEV-8692-migration-to-edox-vue-components',
    'feature/EDODEV-9416-sms-paste',
    'hotfix/EDO-14065-logout-in-main-site',
    'chore/EDODEV-remove-e-card-style',
  ];
  const etalon = [
    'master',
    'chore/release-to-master',
    'chore/EDODEV-10449-act-master',
    'feature/EDODEV-8692-migration-to-edox-vue-components',
    'feature/EDODEV-9416-sms-paste',
    'hotfix/EDO-14065-logout-in-main-site',
    'chore/EDODEV-remove-e-card-style',
  ];

  const sortString = 'maste';

  const sortedList = list.sort((a, b) => sortOrder(sortString, a, b));

  expect(sortedList).toEqual(etalon);
});


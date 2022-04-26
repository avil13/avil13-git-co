import { expect, it } from 'vitest';
import { sortOrder } from '../ask';

it('should ', () => {
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


import inquirer from 'inquirer';

inquirer.registerPrompt(
  'autocomplete',
  require('inquirer-autocomplete-prompt')
);

const specSymbols = {
  _saveCursor: '\x1b7',
  _restoreCursor: '\x1b8',
  _clear: '\x1b[H\x1b[2J',
};

export const ask = async (message: string, choices: string[]) => {
  const prompt = inquirer.prompt({
    //@ts-ignore
    type: 'autocomplete',
    name: 'branch',
    message,
    source(answersSoFar, input = '') {
      const list = choices.filter(choiceItem => checkItem(choiceItem, input));

      return Promise.resolve(list);
    }
  });

  return prompt;
};

//

export function checkItem(item: string, filterString: string): boolean {
  const reg = new RegExp(
    filterString.split('').map(s => s.trim()).filter(Boolean).join('.*').replace('.*.*', '.*'),
    'gi',
  );

  return reg.test(item);
}

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
      let list = choices.filter(choiceItem => checkItem(choiceItem, input));

      list = list.sort((a, b) => {
        return sortOrder(input, a, b);
      });

      return Promise.resolve(list);
    }
  });

  return prompt;
};

//
export function checkItem(item: string, filterString: string): boolean {
  const reg = getRegExp(filterString);

  return reg.test(item);
}

function sortOrder(searchString: string, name1: string, name2: string): number {
  if (name1.indexOf(searchString) < name2.indexOf(searchString)) {
    return 1;
  }

  if (name2.includes(searchString)) {
    return 0;
  }

  return 1;
}


function getRegExp(filterString: string) {
  return new RegExp(
    filterString.split('').map(s => s.trim()).filter(Boolean).join('.*').replace('.*.*', '.*'),
    'gi',
  );
}

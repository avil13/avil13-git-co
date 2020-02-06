const inquirer = require('inquirer');

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
    type: 'autocomplete',
    name: 'branch',
    message,
    source(answersSoFar, input = '') {
      const list = choices.filter(str => str.indexOf(input) > -1);

      return Promise.resolve(list);
    }
  });

  return prompt;
};

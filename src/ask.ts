const { AutoComplete } = require('enquirer');

export const ask = async (message: string, choices: string[]) => {
  const limit = choices.length > 8 ? 8 : choices.length;

  const prompt = new AutoComplete({
    name: 'branch',
    message,
    limit,
    choices,
  });

  return await prompt.run();
};

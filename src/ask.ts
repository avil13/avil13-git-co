const { AutoComplete } = require('enquirer');

export const ask = async (message: string, choices: string[]) => {
  const prompt = new AutoComplete({
    name: 'branch',
    message,
    limit: 10,
    choices,
  });

  return await prompt.run();
};

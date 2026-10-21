export enum Commands {
  Unknown = 0,
  Help = 1,
  DeleteBranch = 2,
  MergeBranch = 4,
  ShowMerged = 8,
  ShowUnMerged = 16,
}

export const getWishOfUser = (firstArg = process.argv[2]): Commands => {
  if (['help', '-h', '--h', '--help'].includes(firstArg)) return Commands.Help;
  if (['-M', 'merge'].includes(firstArg)) return Commands.MergeBranch;
  if (['-D', 'rm'].includes(firstArg)) return Commands.DeleteBranch;
  if (['m', '-sm', '--show-merged'].includes(firstArg)) return Commands.ShowMerged;
  if (['un', '-un', '--no-merged'].includes(firstArg)) return Commands.ShowUnMerged;
  return Commands.Unknown;
};

export function parseArgs(args = process.argv.slice(2)) {
  const command = getWishOfUser(args[0] || '');
  if (!args.length) return { command, filter: '' };
  if (command === Commands.Unknown && args[0] !== '-') {
    throw new Error('Unknown option: ' + args[0] + '. Use co --help.');
  }
  const rest = args.slice(1);
  if (rest[0] === '-') rest.shift();
  return { command, filter: rest.join(' ') };
}

export const getHelp = (): string => `
DESCRIPTION:
  Quickly switch, merge and delete Git branches.

USAGE:
  co                         Select a branch to check out
  co - 1234                  Start with an editable search filter
  co -M [- filter]           Merge, then offer to delete the source branch [Y/n]
  co -D [- filter]           Delete multiple local branches (Space to select)
  co m, -sm, --show-merged   Show merged branches
  co un, -un, --no-merged    Show unmerged branches
  co help, -h, --h, --help   Show this message

  Ctrl+C cancels and restores the previous terminal screen.
`;

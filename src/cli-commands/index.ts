import { clc } from '../color';

const args = process.argv.slice(2);

export enum Commands {
  Unknown = 0,
  Help = 1,
  DeleteBranch = 2,
  MergeBranch = 4,
  ShowMerged = 8,
  ShowUnMerged = 16,
};

export const getWishOfUser = (firstArg?: string): Commands => {
  const arg: string = firstArg || args[0];

  switch (true) {
    case ['help', '-h', '--h', '--help'].includes(arg):
      return Commands.Help;

    case ['-M', 'merge'].includes(arg):
      return Commands.MergeBranch;

    case ['-D', 'rm'].includes(arg):
      return Commands.DeleteBranch;

    case ['-sm', '--show-merged'].includes(arg):
      return Commands.ShowMerged;

    case ['-un', '--no-merged'].includes(arg):
      return Commands.ShowUnMerged;

    default:
      return Commands.Unknown;
  }
}


export const getHelp = (): string => {
  return `
DESCRIPTION:
  A console program for quickly switching between branches

OPTIONS:
  help, -h, --h, --help
    Showing this message

  -M, merge
    Merge branch

  -sm, --show-merged
    Showing merged branches

  -un, --no-merged
    Showing not merged branches

  -D, rm
    Delete the selected branch
`;
}

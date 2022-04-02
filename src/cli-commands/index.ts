

const args = process.argv.slice(2);

export enum Commands {
  Unknown,
  Help,
  DeleteBranch,
};

export const getWishOfUser = (firstArg?: string): Commands => {
  const arg: string = firstArg || args[0];

  switch (true) {
    case ['help', '-h', '--h', '--help'].includes(arg):
      return Commands.Help;

      case ['D', '-D', 'rm'].includes(arg):
      return Commands.DeleteBranch;

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

  D, D', 'rm
    Delete the selected branch
`;
}

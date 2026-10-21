# avil13/co

Interactive Git branch checkout, merge and deletion.

![demo](assets/cli-demo.gif)

## Install

```sh
npm install -g avil13-co
```

## Usage

```sh
co                  # Search for a branch and check it out
co - 1234           # Pre-fill the editable search input with "1234"
co m                # Show merged branches (also: -sm, --show-merged)
co un               # Show unmerged branches (also: -un, --no-merged)
co -M               # Merge a selected branch (also: merge)
co -D               # Delete multiple local branches (also: rm)
co -h               # Show help
```

Search is case-insensitive and supports subsequences; special characters are literal.
Filters also work with commands, for example `co -M - 1234` or `co -D - 1234`.
For deletion, the initial filter restricts the checkbox list.

### Delete branches

Use **Space** to select branches, then **Enter** to confirm the selection.
A separate confirmation defaults to **No**. Only local branches are listed;
the current branch is excluded. Like Git's `-D`, this explicitly requested
operation can delete unmerged branches. Failures are reported per branch,
without skipping the remaining selections.

### Merge

After a successful, confirmed merge, `co` offers to delete the source branch
with **Yes** as the default (`[Y/n]`). This uses safe deletion (`git branch -d`),
not forced deletion. Remote-only branches are not offered for deletion.
A failed merge never triggers the deletion question.

### Cancel and errors

**Ctrl+C** exits with code 130 and restores the previous terminal screen,
removing this session's interactive output. Completed Git operations are not
rolled back. On normal completion, command results remain visible.
Screen switching is only enabled in an interactive terminal.

Git errors are printed without an unhandled rejection and return exit code 1.
Git is invoked directly, without shell interpolation of branch names.

## Development

```sh
npm test
npm run type-check
npm run build
```

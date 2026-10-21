import { execFile } from 'child_process';

export function exec(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('git', args, (error, stdout, stderr) => {
      if (error) {
        reject(new Error([stderr.trim(), stdout.trim()].filter(Boolean).join('\n') || error.message));
      } else {
        resolve([stdout.trimEnd(), stderr.trimEnd()].filter(Boolean).join('\n'));
      }
    });
  });
}

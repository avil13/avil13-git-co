import { exec as exe } from 'child_process';

export function exec(command): Promise<string> {
  return new Promise((resolve, reject) =>
    exe(command, (err, stdout) =>
      err ? reject(err) : resolve(stdout)
    )
  );
}

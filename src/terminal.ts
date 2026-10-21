// Keep interactive output isolated from the user's shell history.
let active = false;
let messages: string[] = [];

export function startTerminal() {
  active = Boolean(process.stdout.isTTY && process.stdin.isTTY);
  messages = [];
  if (active) process.stdout.write('\x1b[?1049h');
}

export function print(message: string) {
  if (!message.trim()) return;
  if (active) messages.push(message.trimEnd());
  console.log(message.trimEnd());
}

export function finishTerminal(cancelled = false) {
  if (!active) return;
  active = false;
  process.stdout.write('\x1b[?1049l\x1b[?25h');
  if (!cancelled && messages.length) console.log(messages.join('\n'));
  messages = [];
}

export function installInterruptHandler() {
  const onInterrupt = () => {
    finishTerminal(true);
    process.exit(130);
  };
  process.on('SIGINT', onInterrupt);
  return () => process.removeListener('SIGINT', onInterrupt);
}

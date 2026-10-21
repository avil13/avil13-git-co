import inquirer, { Answers, QuestionCollection } from 'inquirer';
import { finishTerminal } from './terminal';

export function prompt<T extends Answers = Answers>(questions: QuestionCollection<T>): Promise<T> {
  const result = inquirer.prompt<T>(questions);
  // Inquirer 8 re-sends SIGINT asynchronously and may exit before Node handles
  // it. Handle readline's raw-mode Ctrl+C synchronously instead.
  const ui = result.ui as any;
  if (ui) {
    ui.rl.removeListener('SIGINT', ui.onForceClose);
    ui.rl.once('SIGINT', () => {
      ui.close();
      finishTerminal(true);
      process.exit(130);
    });
  }
  return result;
}

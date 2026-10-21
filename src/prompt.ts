import inquirer, { Answers, QuestionCollection } from 'inquirer';
import { finishTerminal } from './terminal';

export function prompt<T extends Answers = Answers>(questions: QuestionCollection<T>): Promise<T> {
  // Bright yellow uses the terminal palette and keeps Inquirer's bold styling.
  const styleQuestion = (question: any) => {
    if (!process.stdout.isTTY || typeof question.message !== 'string') return question;
    return { ...question, message: `\x1b[93m${question.message}\x1b[39m` };
  };
  const styledQuestions = Array.isArray(questions)
    ? questions.map(styleQuestion)
    : styleQuestion(questions);
  const result = inquirer.prompt<T>(styledQuestions);
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

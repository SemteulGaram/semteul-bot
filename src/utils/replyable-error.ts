export class ReplyableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReplyableError';
  }
}

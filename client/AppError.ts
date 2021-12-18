export default class AppError extends Error {
  appMessage: string;

  static isAppError(value: unknown): value is AppError {
    if (value && typeof value === 'object' && 'appMessage' in value) {
      return true;
    }
    return false;
  }

  constructor(message: string) {
    super(message);
    this.appMessage = message;
  }
}

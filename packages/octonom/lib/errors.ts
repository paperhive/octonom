import { Model } from './model';

export class ExtendableError extends Error {
  constructor(message: string, prototype: object) {
    super(message);

    // see https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md
    Object.setPrototypeOf(this, prototype);
  }
}

export class ValidationError extends ExtendableError {
  constructor(
    message: string,
    public reason?: string,
    public value?: any,
    public path?: Array<string | number>,
    public instance?: Model,
  ) {
    super(message, ValidationError.prototype);
  }
}

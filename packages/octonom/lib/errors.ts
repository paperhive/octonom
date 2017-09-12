import { Model } from './model';
import { Path } from './schema/schema';

export class ExtendableError extends Error {
  constructor(message: string, prototype: object) {
    super(message);

    // see https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md
    Object.setPrototypeOf(this, prototype);
  }
}

export class SanitizationError extends ExtendableError {
  constructor(
    message: string,
    public reason?: string,
    public value?: any,
    public path?: Path,
    public instance?: Model,
  ) {
    super(message, SanitizationError.prototype);
  }
}

export class ValidationError extends ExtendableError {
  constructor(
    message: string,
    public reason?: string,
    public value?: any,
    public path?: Path,
    public instance?: Model,
  ) {
    super(message, ValidationError.prototype);
  }
}

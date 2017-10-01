import { Model } from './model';
import { IParent, OctoValue } from './schema/value';

export class ExtendableError extends Error {
  constructor(message: string, prototype: object) {
    super(message);

    // see https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md
    Object.setPrototypeOf(this, prototype);
  }
}

export class PopulationError extends ExtendableError {
  constructor(message: string) {
    super(message, PopulationError.prototype);
  }
}

export class SanitizationError extends ExtendableError {
  // TODO: add value parameter!
  constructor(message: string, public reason?: string, public parent?: IParent) {
    super(message, SanitizationError.prototype);
  }
}

export class ValidationError extends ExtendableError {
  constructor(message: string, public reason?: string, public value?: OctoValue<any>) {
    super(message, ValidationError.prototype);
  }
}

import { ISchemaParent } from './schema/schema';

export class ExtendableError extends Error {
  constructor(message: string, prototype: object) {
    super(message);

    // see https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md
    Object.setPrototypeOf(this, prototype);
  }
}

export class SanitizationError extends ExtendableError {
  // TODO: add value parameter!
  constructor(message: string, public reason?: string, public parent?: ISchemaParent) {
    super(message, SanitizationError.prototype);
  }
}

export class ValidationError extends ExtendableError {
  constructor(message: string, public reason?: string, public parent?: ISchemaParent) {
    super(message, ValidationError.prototype);
  }
}

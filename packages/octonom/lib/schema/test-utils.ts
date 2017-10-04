import { ValidationError } from '../errors';
import { ISchemaParent } from './schema';

export function testValidation(validationPromise: Promise<any>, expectedMsg: string, expectedParent: ISchemaParent) {
  return expect(validationPromise).to.be.rejectedWith(ValidationError, expectedMsg)
    .and.eventually.have.property('parent', expectedParent);
}

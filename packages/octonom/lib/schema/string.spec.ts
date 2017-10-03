import { SanitizationError, ValidationError } from '../errors';
import { ISchemaParent } from './schema';
import { StringSchema } from './string';

describe('StringSchema', () => {
  const parent: ISchemaParent = {
    instance: {} as any,
    path: 'string',
  };

  describe('constructor()', () => {
    it('should be instantiatable without options', () => {
      const schema = new StringSchema();
      expect(schema).to.have.property('options').that.eql({});
    });

    it('should be instantiatable with options', () => {
      const schema = new StringSchema({min: 5});
      expect(schema).to.have.property('options').that.eql({min: 5});
    });
  });

  describe('create()', () => {
    it('should throw if value is not a string', () => {
      expect(() => new StringSchema().create(42, {parent}))
        .to.throw(SanitizationError, 'Value is not a string.')
        .which.has.property('parent', parent);
    });

    it('should return a string if a string is provided (without sanitizeOptions)', () => {
      expect(new StringSchema().create('bar')).to.eql({value: 'bar', parent: undefined});
    });

    it('should return a string if a string is provided', () => {
      expect(new StringSchema().create('bar', {parent})).to.eql({value: 'bar', parent});
    });

    it('should return undefined if undefined is provided', () => {
      expect(new StringSchema().create(undefined)).to.equal(undefined);
    });

    it('should return a default value if undefined is provided and defaults is enabled', () => {
      expect(new StringSchema({default: 'bar'}).create(undefined, {defaults: true, parent}))
        .to.eql({value: 'bar', parent});
    });

    it('should return a default value from a function', () => {
      expect(new StringSchema({default: () => 'bar'}).create(undefined, {defaults: true, parent}))
        .to.eql({value: 'bar', parent});
    });
  });

  describe('validate()', () => {
    function testValidation(validationPromise: Promise<any>, expectedMsg: string, expectedParent: ISchemaParent) {
      return expect(validationPromise).to.be.rejectedWith(ValidationError, expectedMsg)
        .and.eventually.have.property('parent', expectedParent);
    }

    it('should throw if value is undefined but required', async () => {
      await testValidation(
        new StringSchema({required: true}).validate({value: undefined, parent}),
        'Required value is undefined.',
        parent,
      );
    });

    it('should throw if value is not a string', async () => {
      await testValidation(
        new StringSchema().validate({value: 42 as any, parent}),
        'Value is not a string.',
        parent,
      );
    });

    it('should throw if value is not in enum', async () => {
      await testValidation(
        new StringSchema({enum: ['foo', 'bar']}).validate({value: 'baz', parent}),
        'String not in enum: foo, bar.',
        parent,
      );
    });

    it('should throw if value is shorter than min', async () => {
      await testValidation(
        new StringSchema({min: 4}).validate({value: 'foo', parent}),
        'String must not have less than 4 characters',
        parent,
      );
    });

    it('should throw if value is longer than max', async () => {
      await testValidation(
        new StringSchema({max: 5}).validate({value: 'foobar', parent}),
        'String must not have more than 5 characters',
        parent,
      );
    });

    it('should throw if value does not match regex', async () => {
      await testValidation(
        new StringSchema({regex: /foo/}).validate({value: 'bar', parent}),
        'String does not match regex.',
        parent,
      );
    });

    it('should run custom validator', async () => {
      const schema = new StringSchema({
        validate: async instance => {
          if (instance.value === 'foo') {
            throw new ValidationError('foo is not allowed.');
          }
        },
      });
      await schema.validate({value: 'bar', parent});
      await testValidation(
        schema.validate({value: 'foo', parent}),
        'foo is not allowed.',
        parent,
      );
    });

    it('should validate undefined', async () => {
      await new StringSchema().validate({value: undefined, parent});
    });

    it('should validate a string', async () => {
      await new StringSchema().validate({value: 'foo'});
    });
  });
});

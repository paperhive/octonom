import { SanitizationError, ValidationError } from '../errors';
import { ISchemaParent } from './schema';
import { StringSchema } from './string';
import { testValidation } from './test-utils';

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
      const schema = new StringSchema();
      expect(schema.create('bar')).to.eql({value: 'bar', parent: undefined, schema});
    });

    it('should return a string if a string is provided', () => {
      const schema = new StringSchema();
      expect(schema.create('bar', {parent})).to.eql({value: 'bar', parent, schema});
    });

    it('should return undefined if undefined is provided', () => {
      expect(new StringSchema().create(undefined)).to.equal(undefined);
    });

    it('should return a default value if undefined is provided and defaults is enabled', () => {
      const schema = new StringSchema({default: 'bar'});
      expect(schema.create(undefined, {defaults: true, parent}))
        .to.eql({value: 'bar', parent, schema});
    });

    it('should return a default value from a function', () => {
      const schema = new StringSchema({default: () => 'bar'});
      expect(schema.create(undefined, {defaults: true, parent}))
        .to.eql({value: 'bar', parent, schema});
    });
  });

  describe('validate()', () => {
    it('should throw if value is undefined but required', async () => {
      const schema = new StringSchema({required: true});
      await testValidation(
        schema.validate({value: undefined, parent, schema}),
        'Required value is undefined.',
        parent,
      );
    });

    it('should throw if value is not a string', async () => {
      const schema = new StringSchema();
      await testValidation(
        schema.validate({value: 42 as any, parent, schema}),
        'Value is not a string.',
        parent,
      );
    });

    it('should throw if value is not in enum', async () => {
      const schema = new StringSchema({enum: ['foo', 'bar']});
      await testValidation(
        schema.validate({value: 'baz', parent, schema}),
        'String not in enum: foo, bar.',
        parent,
      );
    });

    it('should throw if value is shorter than min', async () => {
      const schema = new StringSchema({min: 4});
      await testValidation(
        schema.validate({value: 'foo', parent, schema}),
        'String must not have less than 4 characters',
        parent,
      );
    });

    it('should throw if value is longer than max', async () => {
      const schema = new StringSchema({max: 5});
      await testValidation(
        schema.validate({value: 'foobar', parent, schema}),
        'String must not have more than 5 characters',
        parent,
      );
    });

    it('should throw if value does not match regex', async () => {
      const schema = new StringSchema({regex: /foo/});
      await testValidation(
        schema.validate({value: 'bar', parent, schema}),
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
      await schema.validate({value: 'bar', parent, schema});
      await testValidation(
        schema.validate({value: 'foo', parent, schema}),
        'foo is not allowed.',
        parent,
      );
    });

    it('should validate undefined', async () => {
      const schema = new StringSchema();
      await schema.validate({value: undefined, parent, schema});
    });

    it('should validate a string', async () => {
      const schema = new StringSchema();
      await schema.validate({value: 'foo', parent, schema});
    });
  });
});

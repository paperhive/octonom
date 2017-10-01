import { SanitizationError, ValidationError } from '../errors';
import { OctoString, StringSchema } from './string';

describe('MetaString', () => {
  describe('constructor()', () => {
    it('should throw a SanitizationError if value is not a string', () => {
      expect(() => new OctoString(42))
        .to.throw(SanitizationError, 'Value is not a string');
    });

    it('should return undefined', () => {
      expect(new OctoString(undefined)).to.contain({value: undefined});
    });

    it('should return a string', () => {
      expect(new OctoString('bar')).to.contain({value: 'bar'});
    });

    it('should return a default value', () => {
      expect(new OctoString(undefined, {default: 'bar'}, {defaults: true}))
        .to.contain({value: 'bar'});
    });

    it('should return a default value from a function', () => {
      expect(new OctoString(undefined, {default: () => 'bar'}, {defaults: true}))
        .to.contain({value: 'bar'});
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = new StringSchema({required: true});
      await expect(schema.create(undefined).validate())
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw if value is not in enum', async () => {
      const schema = new StringSchema({enum: ['foo', 'bar']});
      await expect(schema.create('baz').validate())
        .to.be.rejectedWith(ValidationError, 'String not in enum: foo, bar.');
    });

    it('should throw if value is shorter than min', async () => {
      const schema = new StringSchema({min: 4});
      await expect(schema.create('foo').validate())
        .to.be.rejectedWith(ValidationError, 'String must not have less than 4 characters');
    });

    it('should throw if value is longer than max', async () => {
      const schema = new StringSchema({max: 5});
      await expect(schema.create('foobar').validate())
        .to.be.rejectedWith(ValidationError, 'String must not have more than 5 characters');
    });

    it('should throw if value does not match regex', async () => {
      const schema = new StringSchema({regex: /foo/});
      await expect(schema.create('bar').validate())
        .to.be.rejectedWith(ValidationError, 'String does not match regex.');
    });

    it('should run custom validator', async () => {
      const schema = new StringSchema({
        validate: async octoValue => {
          if (octoValue.value === 'foo') {
            throw new ValidationError('foo is not allowed.');
          }
        },
      });
      await schema.create('bar', {}).validate();
      await expect(schema.create('foo').validate())
        .to.be.rejectedWith(ValidationError, 'foo is not allowed.');
    });

    it('should validate undefined', async () => {
      const schema = new StringSchema();
      await schema.create(undefined).validate();
    });

    it('should validate a string', async () => {
      const schema = new StringSchema();
      await schema.create('foo').validate();
    });
  });
});

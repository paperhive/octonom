import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { IStringOptions, StringSchema } from './string';

describe('StringSchema', () => {
  describe('sanitize()', () => {
    it('should throw a SanitizationError if value is not a string', () => {
      const schema = new StringSchema();
      expect(() => schema.sanitize(42, ['key'], {} as Model))
        .to.throw(SanitizationError, 'Value is not a string');
    });

    it('should return undefined', () => {
      const schema = new StringSchema();
      expect(schema.sanitize(undefined, ['key'], {} as Model)).to.eql(undefined);
    });

    it('should return a string', () => {
      const schema = new StringSchema();
      expect(schema.sanitize('bar', ['key'], {} as Model)).to.eql('bar');
    });

    it('should return a default value', () => {
      const schema = new StringSchema({default: 'bar'});
      expect(schema.sanitize(undefined, ['key'], {} as Model, {defaults: true}))
        .to.eql('bar');
    });

    it('should return a default value from a function', () => {
      const schema = new StringSchema({default: () => 'bar'});
      expect(schema.sanitize(undefined, ['key'], {} as Model, {defaults: true}))
        .to.eql('bar');
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = new StringSchema({required: true});
      await expect(schema.validate(undefined, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw if value is not a string', async () => {
      const schema = new StringSchema();
      await expect(schema.validate(42 as any, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Value is not a string.');
    });

    it('should throw if value is not in enum', async () => {
      const schema = new StringSchema({enum: ['foo', 'bar']});
      await expect(schema.validate('baz', ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'String not in enum: foo, bar.');
    });

    it('should throw if value is shorter than min', async () => {
      const schema = new StringSchema({min: 4});
      await expect(schema.validate('foo', ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'String must not have less than 4 characters');
    });

    it('should throw if value is longer than max', async () => {
      const schema = new StringSchema({max: 5});
      await expect(schema.validate('foobar', ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'String must not have more than 5 characters');
    });

    it('should throw if value does not match regex', async () => {
      const schema = new StringSchema({regex: /foo/});
      await expect(schema.validate('bar', ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'String does not match regex.');
    });

    it('should run custom validator', async () => {
      const schema = new StringSchema({
        validate: async value => {
          if (value === 'foo') {
            throw new ValidationError('foo is not allowed.');
          }
        },
      });
      await schema.validate('bar', ['key'], {} as Model);
      await expect(schema.validate('foo', ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'foo is not allowed.');
    });

    it('should validate undefined', async () => {
      const schema = new StringSchema();
      await schema.validate(undefined, ['key'], {} as Model);
    });

    it('should validate a string', async () => {
      const schema = new StringSchema();
      await schema.validate('foo', ['key'], {} as Model);
    });
  });
});

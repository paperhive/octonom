import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { BooleanSchema, IBooleanOptions } from './boolean';

describe('BooleanSchema', () => {
  describe('sanitize()', () => {
    it('should throw a SanitizationError if value is not a boolean', () => {
      const schema = new BooleanSchema();
      expect(() => schema.sanitize('foo', ['key'], {} as Model))
        .to.throw(SanitizationError, 'Value is not a boolean.');
    });

    it('should return undefined', () => {
      const schema = new BooleanSchema();
      expect(schema.sanitize(undefined, ['key'], {} as Model)).to.eql(undefined);
    });

    it('should return a boolean', () => {
      const schema = new BooleanSchema();
      expect(schema.sanitize(true, ['key'], {} as Model)).to.eql(true);
    });

    it('should return a default value', () => {
      const schema = new BooleanSchema({default: true});
      expect(schema.sanitize(undefined, ['key'], {} as Model, {defaults: true}))
        .to.eql(true);
    });

    it('should return a default value from a function', () => {
      const schema = new BooleanSchema({default: () => false});
      expect(schema.sanitize(undefined, ['key'], {} as Model, {defaults: true}))
        .to.eql(false);
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = new BooleanSchema({required: true});
      await expect(schema.validate(undefined, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw if value is not a boolean', async () => {
      const schema = new BooleanSchema();
      await expect(schema.validate('foo' as any, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Value is not a boolean.');
    });

    it('should run custom validator', async () => {
      const schema = new BooleanSchema({
        validate: async value => {
          if (value === true) {
            throw new ValidationError('true is not allowed.');
          }
        },
      });
      await schema.validate(false, ['key'], {} as Model);
      await expect(schema.validate(true, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'true is not allowed.');
    });

    it('should validate undefined', async () => {
      const schema = new BooleanSchema();
      await schema.validate(undefined, ['key'], {} as Model);
    });

    it('should validate a boolean', async () => {
      const schema = new BooleanSchema();
      await schema.validate(true, ['key'], {} as Model);
    });
  });
});

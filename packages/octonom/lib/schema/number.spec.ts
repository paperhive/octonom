import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { NumberSchema } from './number';

describe('NumberSchema', () => {
  describe('sanitize()', () => {
    it('should throw a SanitizationError if value is not a number', () => {
      const schema = new NumberSchema();
      expect(() => schema.sanitize('foo', ['key'], {} as Model))
        .to.throw(SanitizationError, 'Value is not a number.');
    });

    it('should return undefined', () => {
      const schema = new NumberSchema();
      expect(schema.sanitize(undefined, ['key'], {} as Model)).to.eql(undefined);
    });

    it('should return a number', () => {
      const schema = new NumberSchema();
      expect(schema.sanitize(42, ['key'], {} as Model)).to.eql(42);
    });

    it('should return a default value', () => {
      const schema = new NumberSchema({default: 42});
      expect(schema.sanitize(undefined, ['key'], {} as Model, {defaults: true}))
        .to.eql(42);
    });

    it('should return a default value from a function', () => {
      const schema = new NumberSchema({default: () => 42});
      expect(schema.sanitize(undefined, ['key'], {} as Model, {defaults: true}))
        .to.eql(42);
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = new NumberSchema({required: true});
      await expect(schema.validate(undefined, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw if value is not a number', async () => {
      const schema = new NumberSchema();
      await expect(schema.validate('foo' as any, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Value is not a number.');
    });

    it('should throw if value is not an integer', async () => {
      const schema = new NumberSchema({integer: true});
      await expect(schema.validate(0.5, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Number is not an integer.');
    });

    it('should throw if value is less than min', async () => {
      const schema = new NumberSchema({min: 4});
      await expect(schema.validate(3, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Number must not be less than 4.');
    });

    it('should throw if value is greater than max', async () => {
      const schema = new NumberSchema({max: 5});
      await expect(schema.validate(6, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Number must not be greater than 5.');
    });

    it('should run custom validator', async () => {
      const schema = new NumberSchema({
        validate: async value => {
          if (value === 3) {
            throw new ValidationError('3 is not allowed.');
          }
        },
      });
      await schema.validate(2, ['key'], {} as Model);
      await expect(schema.validate(3, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, '3 is not allowed.');
    });

    it('should validate undefined', async () => {
      const schema = new NumberSchema();
      await schema.validate(undefined, ['key'], {} as Model);
    });

    it('should validate a number', async () => {
      const schema = new NumberSchema();
      await schema.validate(42, ['key'], {} as Model);
    });
  });
});

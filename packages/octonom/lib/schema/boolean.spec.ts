import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { BooleanSchema } from './boolean';

describe('BooleanSchema', () => {
  describe('sanitize()', () => {
    it('should throw a SanitizationError if value is not a boolean', () => {
      const schema = new BooleanSchema();
      expect(() => schema.create('foo'))
        .to.throw(SanitizationError, 'Value is not a boolean.');
    });

    it('should return undefined', () => {
      const schema = new BooleanSchema();
      expect(schema.create(undefined)).to.eql(undefined);
    });

    it('should return a boolean', () => {
      const schema = new BooleanSchema();
      expect(schema.create(true)).to.have.property('value').that.equals(true);
    });

    it('should return a default value', () => {
      const schema = new BooleanSchema({default: true});
      expect(schema.create(undefined, {defaults: true}))
        .to.have.property('value').that.equals(true);
    });

    it('should return a default value from a function', () => {
      const schema = new BooleanSchema({default: () => false});
      expect(schema.create(undefined, {defaults: true}))
        .to.have.property('value').that.equals(false);
    });
  });

  describe('validate()', () => {
    it('should run custom validator', async () => {
      const schema = new BooleanSchema({
        validate: async instance => {
          if (instance.value === true) {
            throw new ValidationError('true is not allowed.');
          }
        },
      });
      await schema.validate(schema.create(false));
      await expect(schema.validate(schema.create(true)))
        .to.be.rejectedWith(ValidationError, 'true is not allowed.');
    });

    it('should validate a boolean', async () => {
      const schema = new BooleanSchema();
      await schema.validate(schema.create(true));
    });
  });
});

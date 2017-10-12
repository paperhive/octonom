import { SanitizationError, ValidationError } from '../errors';
import { NumberSchema } from './number';

describe('NumberSchema', () => {
  describe('constructor()', () => {
    it('should be instantiatable without options', () => {
      const schema = new NumberSchema();
      expect(schema).to.have.property('options').that.eql({});
    });

    it('should be instantiatable with options', () => {
      const schema = new NumberSchema({min: 5});
      expect(schema).to.have.property('options').that.eql({min: 5});
    });
  });

  describe('create()', () => {
    it('should throw a SanitizationError if value is not a number', () => {
      const schema = new NumberSchema();
      expect(() => schema.create('foo'))
        .to.throw(SanitizationError, 'Value is not a number.');
    });

    it('should return undefined', () => {
      const schema = new NumberSchema();
      expect(schema.create(undefined)).to.equal(undefined);
    });

    it('should return a number', () => {
      const schema = new NumberSchema();
      expect(schema.create(42))
        .to.have.property('value').that.equals(42);
    });

    it('should return a default value', () => {
      const schema = new NumberSchema({default: 42});
      expect(schema.create(undefined, {defaults: true}))
        .to.have.property('value').that.equals(42);
    });

    it('should return a default value from a function', () => {
      const schema = new NumberSchema({default: () => 42});
      expect(schema.create(undefined, {defaults: true}))
        .to.have.property('value').that.equals(42);
    });
  });

  describe('toObject()', () => {
    it('should return a number', () => {
      const schema = new NumberSchema();
      expect(schema.toObject(schema.create(13.37))).to.equal(13.37);
    });
  });

  describe('validate()', () => {
    it('should throw if value is not an integer', async () => {
      const schema = new NumberSchema({integer: true});
      await expect(schema.validate(schema.create(0.5)))
        .to.be.rejectedWith(ValidationError, 'Number is not an integer.');
    });

    it('should throw if value is less than min', async () => {
      const schema = new NumberSchema({min: 4});
      await expect(schema.validate(schema.create(3)))
        .to.be.rejectedWith(ValidationError, 'Number must not be less than 4.');
    });

    it('should throw if value is greater than max', async () => {
      const schema = new NumberSchema({max: 5});
      await expect(schema.validate(schema.create(6)))
        .to.be.rejectedWith(ValidationError, 'Number must not be greater than 5.');
    });

    it('should run custom validator', async () => {
      const schema = new NumberSchema({
        validate: async instance => {
          if (instance.value === 3) {
            throw new ValidationError('3 is not allowed.');
          }
        },
      });
      await schema.validate(schema.create(2));
      await expect(schema.validate(schema.create(3)))
        .to.be.rejectedWith(ValidationError, '3 is not allowed.');
    });

    it('should validate a number', async () => {
      const schema = new NumberSchema();
      await schema.validate(schema.create(42));
    });
  });
});

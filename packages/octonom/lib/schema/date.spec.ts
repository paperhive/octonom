import { SanitizationError, ValidationError } from '../errors';
import { DateSchema } from './date';

describe('DateSchema', () => {
  describe('sanitize()', () => {
    it('should throw a SanitizationError if value is not a date', () => {
      const schema = new DateSchema();
      expect(() => schema.create('foo'))
        .to.throw(SanitizationError, 'Value is not a date.');
    });

    it('should return undefined', () => {
      const schema = new DateSchema();
      expect(schema.create(undefined)).to.equal(undefined);
    });

    it('should return a date', () => {
      const schema = new DateSchema();
      const date = new Date();
      const sanitizedDate = schema.create(date);
      expect(sanitizedDate)
        .to.have.property('value').that.eqls(date).and.not.equals(date);
    });

    it('should return a default value', () => {
      const date = new Date();
      const schema = new DateSchema({default: date});
      expect(schema.create(undefined, {defaults: true}))
        .to.have.property('value').that.eqls(date).and.not.equals(date);
    });

    it('should return a default value from a function', () => {
      const date = new Date();
      const schema = new DateSchema({default: () => date});
      expect(schema.create(undefined, {defaults: true}))
        .to.have.property('value').that.eqls(date).and.not.equals(date);
    });
  });

  describe('toObject()', () => {
    it('should return a date', () => {
      const schema = new DateSchema();
      const date = new Date();
      const value = schema.toObject(schema.create(date));
      expect(value.getTime()).to.equal(date.getTime());
    });
  });

  describe('validate()', () => {
    it('should throw if value is before min', async () => {
      const schema = new DateSchema({min: new Date('2010-01-01T00:00:00.000Z')});
      await expect(schema.validate(schema.create(new Date('2000-01-01T00:00:00.000Z'))))
        .to.be.rejectedWith(ValidationError, 'Date must not be before 2010-01-01T00:00:00.000Z.');
    });

    it('should throw if value is after max', async () => {
      const schema = new DateSchema({max: new Date('2010-01-01T00:00:00.000Z')});
      await expect(schema.validate(schema.create(new Date('2017-01-01T00:00:00.000Z'))))
        .to.be.rejectedWith(ValidationError, 'Date must not be after 2010-01-01T00:00:00.000Z.');
    });

    it('should run custom validator', async () => {
      const badDate = new Date('2010-01-01T00:00:00.000Z');
      const schema = new DateSchema({
        validate: async instance => {
          if (instance.value.getTime() === badDate.getTime()) {
            throw new ValidationError('Bad date is not allowed.');
          }
        },
      });
      await schema.validate(schema.create(new Date()));
      await expect(schema.validate(schema.create(badDate)))
        .to.be.rejectedWith(ValidationError, 'Bad date is not allowed.');
    });

    it('should validate a date', async () => {
      const schema = new DateSchema();
      await schema.validate(schema.create(new Date()));
    });
  });
});

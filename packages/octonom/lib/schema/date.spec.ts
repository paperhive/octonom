import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { DateSchema, IDateOptions } from './date';

describe('DateSchema', () => {
  describe('sanitize()', () => {
    it('should throw a SanitizationError if value is not a date', () => {
      const schema = new DateSchema();
      expect(() => schema.sanitize('foo', ['key'], {} as Model))
        .to.throw(SanitizationError, 'Value is not a date.');
    });

    it('should return undefined', () => {
      const schema = new DateSchema();
      expect(schema.sanitize(undefined, ['key'], {} as Model)).to.eql(undefined);
    });

    it('should return a date', () => {
      const schema = new DateSchema();
      const date = new Date();
      const sanitizedDate = schema.sanitize(date, ['key'], {} as Model);
      expect(sanitizedDate).to.eql(date);
    });

    it('should return a default value', () => {
      const date = new Date();
      const schema = new DateSchema({default: date});
      expect(schema.sanitize(undefined, ['key'], {} as Model, {defaults: true}))
        .to.eql(date);
    });

    it('should return a default value from a function', () => {
      const date = new Date();
      const schema = new DateSchema({default: () => date});
      expect(schema.sanitize(undefined, ['key'], {} as Model, {defaults: true}))
        .to.eql(date);
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = new DateSchema({required: true});
      await expect(schema.validate(undefined, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw if value is not a date', async () => {
      const schema = new DateSchema();
      await expect(schema.validate('foo' as any, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Value is not a date.');
    });

    it('should throw if value is before min', async () => {
      const schema = new DateSchema({min: new Date('2010-01-01T00:00:00.000Z')});
      await expect(schema.validate(new Date('2000-01-01T00:00:00.000Z'), ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Date must not be before 2010-01-01T00:00:00.000Z.');
    });

    it('should throw if value is after max', async () => {
      const schema = new DateSchema({max: new Date('2010-01-01T00:00:00.000Z')});
      await expect(schema.validate(new Date('2017-01-01T00:00:00.000Z'), ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Date must not be after 2010-01-01T00:00:00.000Z.');
    });

    it('should run custom validator', async () => {
      const badDate = new Date('2010-01-01T00:00:00.000Z');
      const schema = new DateSchema({
        validate: async (value: Date) => {
          if (value.getTime() === badDate.getTime()) {
            throw new ValidationError('Bad date is not allowed.');
          }
        },
      });
      await schema.validate(new Date(), ['key'], {} as Model);
      await expect(schema.validate(badDate, ['key'], {} as Model))
        .to.be.rejectedWith(ValidationError, 'Bad date is not allowed.');
    });

    it('should validate undefined', async () => {
      const schema = new DateSchema();
      await schema.validate(undefined, ['key'], {} as Model);
    });

    it('should validate a date', async () => {
      const schema = new DateSchema();
      await schema.validate(new Date(), ['key'], {} as Model);
    });
  });
});

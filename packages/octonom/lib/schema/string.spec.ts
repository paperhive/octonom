import { SanitizationError, ValidationError } from '../errors';
import { OctoString } from './string';

describe('MetaString', () => {
  describe('sanitize()', () => {
    it('should throw a SanitizationError if value is not a string', () => {
      expect(() => OctoString.sanitize(42))
        .to.throw(SanitizationError, 'Value is not a string');
    });

    it('should return undefined', () => {
      expect(OctoString.sanitize(undefined)).to.eql(undefined);
    });

    it('should return a string', () => {
      expect(OctoString.sanitize('bar')).to.eql('bar');
    });

    it('should return a default value', () => {
      expect(OctoString.sanitize(undefined, {default: 'bar'}, {defaults: true}))
        .to.eql('bar');
    });

    it('should return a default value from a function', () => {
      expect(OctoString.sanitize(undefined, {default: () => 'bar'}, {defaults: true}))
        .to.eql('bar');
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = OctoString.createSchema({required: true});
      await expect(schema(undefined).validate())
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw if value is not in enum', async () => {
      const schema = OctoString.createSchema({enum: ['foo', 'bar']});
      await expect(schema('baz').validate())
        .to.be.rejectedWith(ValidationError, 'String not in enum: foo, bar.');
    });

    it('should throw if value is shorter than min', async () => {
      const schema = OctoString.createSchema({min: 4});
      await expect(schema('foo').validate())
        .to.be.rejectedWith(ValidationError, 'String must not have less than 4 characters');
    });

    it('should throw if value is longer than max', async () => {
      const schema = OctoString.createSchema({max: 5});
      await expect(schema('foobar').validate())
        .to.be.rejectedWith(ValidationError, 'String must not have more than 5 characters');
    });

    it('should throw if value does not match regex', async () => {
      const schema = OctoString.createSchema({regex: /foo/});
      await expect(schema('bar').validate())
        .to.be.rejectedWith(ValidationError, 'String does not match regex.');
    });

    it('should run custom validator', async () => {
      const schema = OctoString.createSchema({
        validate: async metaValue => {
          if (metaValue.value === 'foo') {
            throw new ValidationError('foo is not allowed.');
          }
        },
      });
      await schema('bar', {}).validate();
      await expect(schema('foo').validate())
        .to.be.rejectedWith(ValidationError, 'foo is not allowed.');
    });

    it('should validate undefined', async () => {
      const schema = OctoString.createSchema();
      await schema(undefined).validate();
    });

    it('should validate a string', async () => {
      const schema = OctoString.createSchema();
      await schema('foo').validate();
    });
  });
});

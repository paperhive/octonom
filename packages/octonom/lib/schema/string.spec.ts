import { SanitizationError, ValidationError } from '../errors';
import { MetaString } from './string';

describe('MetaString', () => {
  describe('sanitize()', () => {
    it('should throw a SanitizationError if value is not a string', () => {
      expect(() => MetaString.sanitize(42))
        .to.throw(SanitizationError, 'Value is not a string');
    });

    it('should return undefined', () => {
      expect(MetaString.sanitize(undefined)).to.eql(undefined);
    });

    it('should return a string', () => {
      expect(MetaString.sanitize('bar')).to.eql('bar');
    });

    it('should return a default value', () => {
      expect(MetaString.sanitize(undefined, {default: 'bar'}, {defaults: true}))
        .to.eql('bar');
    });

    it('should return a default value from a function', () => {
      expect(MetaString.sanitize(undefined, {default: () => 'bar'}, {defaults: true}))
        .to.eql('bar');
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const factory = MetaString.getFactory({required: true});
      await expect(factory(undefined, {}).validate())
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw if value is not in enum', async () => {
      const factory = MetaString.getFactory({enum: ['foo', 'bar']});
      await expect(factory('baz', {}).validate())
        .to.be.rejectedWith(ValidationError, 'String not in enum: foo, bar.');
    });

    it('should throw if value is shorter than min', async () => {
      const factory = MetaString.getFactory({min: 4});
      await expect(factory('foo', {}).validate())
        .to.be.rejectedWith(ValidationError, 'String must not have less than 4 characters');
    });

    it('should throw if value is longer than max', async () => {
      const factory = MetaString.getFactory({max: 5});
      await expect(factory('foobar', {}).validate())
        .to.be.rejectedWith(ValidationError, 'String must not have more than 5 characters');
    });

    it('should throw if value does not match regex', async () => {
      const factory = MetaString.getFactory({regex: /foo/});
      await expect(factory('bar', {}).validate())
        .to.be.rejectedWith(ValidationError, 'String does not match regex.');
    });

    it('should run custom validator', async () => {
      const factory = MetaString.getFactory({
        validate: async metaValue => {
          if (metaValue.value === 'foo') {
            throw new ValidationError('foo is not allowed.');
          }
        },
      });
      await factory('bar', {}).validate();
      await expect(factory('foo', {}).validate())
        .to.be.rejectedWith(ValidationError, 'foo is not allowed.');
    });

    it('should validate undefined', async () => {
      const factory = MetaString.getFactory();
      await factory(undefined, {}).validate();
    });

    it('should validate a string', async () => {
      const factory = MetaString.getFactory();
      await factory('foo', {}).validate();
    });
  });
});

import { ValidationError } from '../errors';
import { AnySchema, OctoAny } from './any';

describe('AnySchema', () => {
  describe('constructor()', () => {
    it('should return a default value', () => {
      expect(new OctoAny(undefined, {default: {foo: 'bar'}}, {defaults: true}))
        .to.have.property('value').that.eql({foo: 'bar'});
    });

    it('should return a default value from a function', () => {
      expect(new OctoAny(undefined, {default: () => 'foo'}, {defaults: true}))
        .to.contain({value: 'foo'});
    });

    it('should return any value', () => {
      const obj = {foo: 'bar'};
      expect(new OctoAny(obj)).to.have.property('value').that.equal(obj);
    });
  });

  describe('toObject()', () => {
    it('should return any value cloned', () => {
      const schema = new AnySchema();
      const obj = {foo: 'bar'};
      const octoValue = schema.create(obj);
      const result = octoValue.toObject();
      expect(result).to.not.equal(obj);
      expect(result).to.eql(obj);
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if required but undefined', async () => {
      const schema = new AnySchema({required: true});
      await expect(schema.create(undefined).validate())
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should run custom validator', async () => {
      const schema = new AnySchema({
        validate: async octoValue => {
          if (octoValue.value === true) {
            throw new ValidationError('true is not allowed.');
          }
        },
      });
      await schema.create(false).validate();
      await expect(schema.create(true).validate())
        .to.be.rejectedWith(ValidationError, 'true is not allowed.');
    });

    it('should validate anything', async () => {
      const schema = new AnySchema();
      await schema.create(undefined).validate();
      await schema.create(true).validate();
      await schema.create(['foo']).validate();
      await schema.create({foo: 'bar'}).validate();
    });
  });
});

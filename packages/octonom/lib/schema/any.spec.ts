import { ValidationError } from '../errors';
import { AnySchema } from './any';
import { ISchemaParent } from './schema';
import { testValidation } from './test-utils';

describe('AnySchema', () => {
  const parent: ISchemaParent = {
    instance: {} as any,
    path: 'any',
  };

  describe('constructor()', () => {
    it('should be instantiatable without options', () => {
      const schema = new AnySchema();
      expect(schema).to.have.property('options').that.eql({});
    });

    it('should be instantiatable with options', () => {
      const schema = new AnySchema({required: true});
      expect(schema).to.have.property('options').that.eql({required: true});
    });
  });

  describe('create()', () => {
    it('should return undefined if undefined is provided', () => {
      expect(new AnySchema().create(undefined, {parent})).to.equal(undefined);
    });

    it('should return a default value if undefined with defaults enabled', () => {
      const schema = new AnySchema({default: {foo: 'bar'}});
      expect(schema.create(undefined, {defaults: true, parent}))
        .to.eql({value: {foo: 'bar'}, parent, schema});
    });

    it('should return a default value from a function if undefined with defaults enabled', () => {
      const schema = new AnySchema({default: () => 'foo'});
      expect(schema.create(undefined, {defaults: true, parent}))
        .to.eql({value: 'foo', parent, schema});
    });

    it('should return any value', () => {
      const schema = new AnySchema();
      const obj = {foo: 'bar'};
      expect(schema.create(obj, {parent})).to.eql({value: obj, parent, schema});
    });
  });

  describe('toObject()', () => {
    it('should return any value cloned', () => {
      const schema = new AnySchema();
      const obj = {foo: 'bar'};
      const instance = schema.create(obj);
      const result = schema.toObject(instance);
      expect(result).to.not.equal(obj);
      expect(result).to.eql(obj);
    });
  });

  describe('validate()', () => {
    it('should throw if value is undefined but required', async () => {
      const schema = new AnySchema({required: true});
      await testValidation(
        schema.validate({value: undefined, parent, schema}),
        'Required value is undefined.',
        parent,
      );
    });

    it('should run custom validator', async () => {
      const schema = new AnySchema({
        validate: async octoValue => {
          if (octoValue.value === true) {
            throw new ValidationError('true is not allowed.');
          }
        },
      });
      await schema.validate({value: false, parent, schema});
      await testValidation(
        schema.validate({value: true, parent, schema}),
        'true is not allowed.',
        parent,
      );
    });

    it('should validate anything', async () => {
      const schema = new AnySchema();
      await schema.validate({value: undefined, parent, schema});
      await schema.validate({value: true, parent, schema});
      await schema.validate({value: ['foo'], parent, schema});
      await schema.validate({value: {foo: 'bar'}, parent, schema});
    });
  });
});

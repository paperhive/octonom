import { spy } from 'sinon';

import { ArrayCollection } from '../array-collection';
import { SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ObjectSchema, setObject, toObject, validateObject } from './object';
import { ReferenceSchema } from './reference';
import { ISchemaParent, ISchemaParentInstance, SchemaInstanceMap, SchemaMap } from './schema';
import { StringSchema } from './string';
import { testValidation } from './test-utils';

/*
class TestModel extends Model {
  public id: string;
}
TestModel.setSchema('id', new StringSchema());

const collection = new ArrayCollection<TestModel>(TestModel, {modelIdField: 'id'});
const instance = new  TestModel({id: '0xACAB'});
collection.insert(instance);
*/

describe('helpers', () => {
  interface IFooBar {
    foo?: string;
    bar?: string;
  }

  const schemaMap: SchemaMap<IFooBar> = {
    foo: new StringSchema({required: true, default: 'default'}),
    bar: new StringSchema(),
  };

  let parentInstance: ISchemaParentInstance;

  beforeEach(() => {
    parentInstance  = {
      value: {},
      schema: new StringSchema(),
      beforeChange: spy(),
      afterChange: spy(),
    };
  });

  /*
  describe('populateObject()', () => {
    const schemaMap = {
      foo: new ReferenceSchema({collection: () => collection}),
      bar: new StringSchema(),
    };

    it('should throw if populateReference is not an object', async () => {
      await expect(populateObject(schemaMap, {foo: '0xACAB', bar: 'baz'}, true))
        .to.be.rejectedWith(Error, 'populateReference must be an object.');
    });

    it('should throw if a key is not populatable', async () => {
      await expect(populateObject(schemaMap, {foo: '0xACAB', bar: 'baz'}, {bar: true}))
        .to.be.rejectedWith(Error, 'Key bar is not populatable.');
    });

    it('should ignore a key if it\'s undefined', async () => {
      const obj = {bar: 'test'};
      const result = await populateObject(schemaMap, obj, {foo: true});
      expect(result).to.not.equal(obj);
      expect(result).to.eql({bar: 'test'});
    });

    it('should populate a key', async () => {
      const obj = {foo: '0xACAB', bar: 'test'};
      const result = await populateObject(schemaMap, obj, {foo: true});
      expect(result).to.not.equal(obj);
      expect(result).to.eql({foo: {id: '0xACAB'}, bar: 'test'});
    });
  });
  */

  describe('proxifyObject()', () => {
    it('should call beforeSet and afterSet when assigning a key');
    it('should call beforeSet and afterSet when deleting a key');
    it('should call beforeSet and afterSet when assigning a nested key');
    it('should call beforeSet and afterSet when deleting a nested key');
  });

  describe('setObject', () => {
    it('should throw if key not in schema', () => {
      expect(() => setObject({baz: 'foo'}, {}, {}, parentInstance, schemaMap, {}))
        .to.throw(SanitizationError, 'Key baz not found in schema.');
    });

    it('should throw if a nested schema sanitization throws', () => {
      expect(() => setObject({bar: 42}, {}, {}, parentInstance, schemaMap, {}))
        .to.throw(SanitizationError, 'Value is not a string.');
    });

    it('should do nothing with an empty data object', () => {
      const obj = {};
      const octoValueMap: SchemaInstanceMap = {};
      setObject({}, obj, octoValueMap, parentInstance, schemaMap, {});
      expect(obj).to.eql({});
      expect(octoValueMap).to.eql({});
    });

    it('should set a valid property', () => {
      const obj = {};
      const instanceMap: SchemaInstanceMap<IFooBar> = {};
      setObject({foo: 'bar'}, obj, instanceMap, parentInstance, schemaMap, {});
      expect(obj).to.eql({foo: 'bar'});
      expect(instanceMap).to.eql({
        foo: {value: 'bar', schema: schemaMap.foo, parent: {instance: parentInstance, path: 'foo'}},
      });
    });

    it('should not modify an existing property', () => {
      const obj = {bar: 'baz'};
      const barInstance = {value: 'baz', schema: schemaMap.bar, parent: {instance: parentInstance, path: 'bar'}};
      const instanceMap: SchemaInstanceMap<IFooBar> = {bar: barInstance};
      setObject<IFooBar>({foo: 'bar'}, obj, instanceMap, parentInstance, schemaMap, {});
      expect(obj).to.eql({foo: 'bar', bar: 'baz'});
      expect(instanceMap.bar).to.equal(barInstance);
      expect(instanceMap).to.eql({
        bar: barInstance,
        foo: {value: 'bar', schema: schemaMap.foo, parent: {instance: parentInstance, path: 'foo'}},
      });
    });

    it('should set a default value', () => {
      const obj = {};
      const instanceMap: SchemaInstanceMap<IFooBar> = {};
      setObject({bar: 'bar'}, obj, instanceMap, parentInstance, schemaMap, {defaults: true});
      expect(obj).to.eql({foo: 'default', bar: 'bar'});
      expect(instanceMap).to.eql({
        bar: {value: 'bar', schema: schemaMap.bar, parent: {instance: parentInstance, path: 'bar'}},
        foo: {value: 'default', schema: schemaMap.foo, parent: {instance: parentInstance, path: 'foo'}},
      });
    });

    it('should replace an object', () => {
      const obj = {bar: 'baz'};
      const barInstance = {value: 'baz', schema: schemaMap.bar, parent: {instance: parentInstance, path: 'bar'}};
      const instanceMap: SchemaInstanceMap<IFooBar> = {bar: barInstance};
      setObject<IFooBar>({foo: 'bar'}, obj, instanceMap, parentInstance, schemaMap, {replace: true});
      expect(obj).to.eql({foo: 'bar'});
      expect(instanceMap).to.eql({
        foo: {value: 'bar', schema: schemaMap.foo, parent: {instance: parentInstance, path: 'foo'}},
      });
    });
  });

  describe('toObject()', () => {
    it('should return an object', () => {
      const instanceMap: SchemaInstanceMap<IFooBar> = {
        foo: {value: 'bar', schema: schemaMap.foo, parent: {instance: parentInstance, path: 'foo'}},
      };
      expect(toObject(instanceMap)).to.eql({foo: 'bar'});
    });
  });

  describe('validateObject()', () => {
    const instance: ISchemaParentInstance = {
      value: {},
      schema: new StringSchema(),
      beforeChange: spy(),
      afterChange: spy(),
    };

    it('should throw if required key is undefined in the OctoValueMap', async () => {
      const instanceMap: SchemaInstanceMap<IFooBar> = {};
      await expect(validateObject(instanceMap, instance, schemaMap))
        .to.be.rejectedWith(ValidationError, 'Key foo is required.');
    });

    it('should pass for a valid object', async () => {
      const instanceMap: SchemaInstanceMap = {
        foo: schemaMap.foo.create('bar', {parent: {instance: parentInstance, path: 'foo'}}),
      };
      await validateObject(instanceMap, instance, schemaMap);
    });
  });
});

describe('ObjectSchema', () => {
  let parentInstance: ISchemaParentInstance;
  let parent: ISchemaParent;

  beforeEach(() => {
    parentInstance  = {
      value: {},
      schema: new StringSchema(),
      beforeChange: spy(),
      afterChange: spy(),
    };
    parent = {instance: parentInstance, path: 'path'};
  });
  /*
  describe('populate()', () => {
    // note: details are tested in populateObject() above
    it('should populate a key', async () => {
      const  schema = new ObjectSchema({schema: {foo: new ReferenceSchema({collection: () => collection})}});
      const obj = {foo: '0xACAB', bar: 'test'};
      const result = await schema.populate(obj, {foo: true});
      expect(result).to.not.equal(obj);
      expect(result).to.eql({foo: {id: '0xACAB'}, bar: 'test'});
    });
  });
  */

  describe('constructor()', () => {
    it('should be instantiatable with options', () => {
      const schema = new ObjectSchema({schemaMap: {foo: new StringSchema()}});
      expect(schema).to.have.property('options').that.eql({schemaMap: {foo: {options: {}}}});
    });
  });

  describe('create()', () => {
    // note: the constructor wraps setObject() (see above)
    it('should throw a SanitizationError if value is not an object', () => {
      const schema = new ObjectSchema({schemaMap: {}});
      expect(() => schema.create(42))
        .to.throw(SanitizationError, 'Value is not an object.');
    });

    it('should return an undefined for undefined input', () => {
      const schema = new ObjectSchema({schemaMap: {}});
      expect(schema.create(undefined)).to.equal(undefined);
    });

    it('should return an empty object for undefined if required and defaults', () => {
      const schema = new ObjectSchema({schemaMap: {}, required: true});
      expect(schema.create(undefined, {defaults: true, parent}))
        .to.have.property('value').that.eql({});
    });

    it('should return an object for undefined if required and defaults', () => {
      const schema = new ObjectSchema({
        required: true,
        schemaMap: {foo: new StringSchema({default: 'bar'})},
      });
      expect(schema.create(undefined, {defaults: true}))
        .to.have.property('value').that.eql({foo: 'bar'});
    });

    it('should return an object', () => {
      const schema = new ObjectSchema({schemaMap: {foo: new StringSchema()}});
      expect(schema.create({foo: 'bar'}))
        .to.have.property('value').that.eql({foo: 'bar'});
    });
  });

  describe('toObject()', () => {
    // note: OctoObject.toObject() wraps toObject() (see above)
    it('should return an object', () => {
      const schema = new ObjectSchema({schemaMap: {foo: new StringSchema()}});
      const instance = schema.create({foo: 'bar'});
      expect(schema.toObject(instance)).to.eql({foo: 'bar'}).and.not.equal(instance.value);
    });
  });

  describe('validate()', () => {
    it('should throw a ValidationError if nested value is required but undefined', async () => {
      const schema = new ObjectSchema({schemaMap: {foo: new StringSchema({required: true})}});
      await expect(schema.validate(schema.create({})))
        .to.be.rejectedWith(ValidationError, 'Key foo is required.');
    });

    it('should throw a ValidationError if nested validation fails', async () => {
      const schema = new ObjectSchema({schemaMap: {foo: new StringSchema({enum: ['bar']})}});
      await expect(schema.validate(schema.create({foo: 'baz'})))
        .to.be.rejectedWith(ValidationError, 'String not in enum: bar.');
    });

    it('should run custom validator', async () => {
      const schema = new ObjectSchema<{foo: string}>({
        schemaMap: {foo: new StringSchema()},
        validate: async instance => {
          if (instance.value.foo === 'bar') {
            throw new ValidationError('bar is not allowed.');
          }
        },
      });
      await schema.validate(schema.create({foo: 'baz'}));
      await expect(schema.validate(schema.create({foo: 'bar'})))
        .to.be.rejectedWith(ValidationError, 'bar is not allowed.');
    });

    it('should validate an object', async () => {
      const schema = new ObjectSchema({schemaMap: {foo: new StringSchema()}});
      await schema.validate(schema.create({foo: 'bar'}));
    });
  });
});

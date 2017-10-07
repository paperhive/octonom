import { ArrayCollection } from '../array-collection';
import { PopulationError, SanitizationError, ValidationError } from '../errors';
import { Model } from '../model';
import { ReferenceSchema } from './reference';
import { StringSchema } from './string';

describe('ReferenceSchema', () => {
  class TestModel extends Model {
    public id: string;
  }
  TestModel.setSchema('id', new StringSchema({required: true}));

  const collection = () => new ArrayCollection<TestModel>(TestModel, {modelIdField: 'id'});

  describe('constructor()', () => {
    it('should be instantiatable with options', () => {
      const schema = new ReferenceSchema({collection});
      expect(schema).to.have.property('options').that.eql({collection});
    });
  });

  describe('create()', () => {
    const schema = new ReferenceSchema({collection});

    it('should throw a SanitizationError if value is not a string or model', () => {
      expect(() => schema.create(42))
        .to.throw(SanitizationError, 'Value is not an instance or an id.');
    });

    it('should return undefined', () => {
      expect(schema.create(undefined)).to.eql(undefined);
    });

    it('should return a string', () => {
      expect(schema.create('id')).to.contain({id: 'id', value: 'id'});
    });

    it('should return a model instance ', () => {
      const modelInstance  = new TestModel({id: 'id'});
      const instance = schema.create(modelInstance);
      expect(instance).to.eql({
        id: 'id',
        value: {id: 'id'},
        schema,
      });
      expect(instance.value).to.be.instanceOf(TestModel);
    });
  });

  describe('populate()', () => {
    class FriendModel extends Model {
      public id: string;
      public friend: string | FriendModel;
    }

    FriendModel.setSchema('id', new StringSchema({required: true}));
    const schema = new ReferenceSchema<FriendModel>({collection: () => friendCollection});
    FriendModel.setSchema('friend', schema);

    const friendCollection = new ArrayCollection<FriendModel>(FriendModel, {modelIdField: 'id'});

    const alice = new FriendModel({id: 'alice', friend: 'bob'});
    const bob = new FriendModel({id: 'bob'});

    friendCollection.insert(alice);
    friendCollection.insert(bob);

    it('should throw if instance cannot be found', async () => {
      const instance = schema.create('karl');
      const value = await schema.populate(instance, true);
      expect(value).to.equal(undefined);
      expect(instance.value).to.equal(value);
      expect(instance.id).to.equal('karl');
    });

    it('should return an instance if id is provided', async () => {
      const instance = schema.create('alice');
      const value = await schema.populate(instance, true);
      expect(value).to.eql(alice);
      expect(instance.value).to.equal(value);
      expect(instance.id).to.equal('alice');
    });

    it('should return an instance if instance is provided', async () => {
      const instance = schema.create(alice);
      const value = await schema.populate(instance, true);
      expect(value).to.eql(alice);
      expect(instance.value).to.equal(value);
      expect(instance.id).to.equal('alice');
    });

    it('should return a deep populated instance if id is provided', async () => {
      const instance = schema.create('alice');
      const value = await schema.populate(instance, {friend: true});
      expect(value).to.eql({...alice, friend: bob});
      expect(instance.value).to.equal(value);
      expect(instance.id).to.equal('alice');
    });

    it('should return a deep populated instance if instance is provided', async () => {
      const instance = schema.create(alice);
      const value = await schema.populate(instance, {friend: true});
      expect(value).to.eql({...alice, friend: bob});
      expect(instance.value).to.equal(value);
      expect(instance.id).to.equal('alice');
    });
  });

  describe('toObject()', () => {
    const schema = new ReferenceSchema({collection});

    it('should return an id', () => {
      expect(schema.toObject(schema.create('id'))).to.equal('id');
    });

    it('should return an object for a populated reference', () => {
      expect(schema.toObject(schema.create(new TestModel({id: '0xACAB'}))))
        .to.eql({id: '0xACAB'});
    });

    it('should return an id for a populated reference with unpopulate', () => {
      expect(schema.toObject(schema.create(new TestModel({id: '0xACAB'})), {unpopulate: true}))
        .to.eql('0xACAB');
    });
  });

  describe('validate()', () => {
    it('should run custom validator', async () => {
      const schema = new ReferenceSchema({
        collection,
        validate: async instance => {
          if (instance.value === 'foo') {
            throw new ValidationError('foo is not allowed.');
          }
        },
      });
      await schema.validate(schema.create('bar'));
      await schema.validate(schema.create(new TestModel({id: '42'})));
      await expect(schema.validate(schema.create('foo')))
        .to.be.rejectedWith(ValidationError, 'foo is not allowed.');
    });

    it('should not validate a populated model', async () => {
      const schema = new ReferenceSchema({collection});
      const instance = schema.create(new TestModel({id: '42'}));
      const modelInstance = instance.value as TestModel;
      delete modelInstance.id;
      await expect(modelInstance.validate())
        .to.be.rejectedWith(ValidationError, 'Key id is required.');
      await schema.validate(instance);
    });

    it('should validate a string', async () => {
      const schema = new ReferenceSchema({collection});
      await schema.validate(schema.create('foo'));
    });
  });
});

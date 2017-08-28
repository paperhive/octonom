import { collections } from '../test/data/collections';
import { DiscussionModel } from '../test/data/models/discussion';
import { PersonModel } from '../test/data/models/person';

import { populateArray, populateObject, populateValue } from './populate';
import { SchemaMap, SchemaValue } from './schema';

describe('populate', () => {
  let alice: PersonModel;
  let bob: PersonModel;
  let aliceDiscussion: DiscussionModel;
  let bobDiscussion: DiscussionModel;

  beforeEach(async () => {
    alice = new PersonModel({id: '42', name: 'Alice'});
    bob = new PersonModel({id: '23', name: 'Bob'});

    aliceDiscussion = new DiscussionModel({id: '1337', author: '42', title: 'hi'});
    bobDiscussion = new DiscussionModel({id: '4711', author: '23', title: 'howdy'});

    collections.people.clear();
    collections.people.insert(alice);
    collections.people.insert(bob);

    collections.discussions.clear();
    collections.discussions.insert(aliceDiscussion);
    collections.discussions.insert(bobDiscussion);
  });

  describe('populateArray()', () => {
    it('should throw if not nested and schema is not a reference', async () => {
      await expect(populateArray(['42'], {type: 'string'}, true))
        .to.be.rejectedWith('Reference expected but got string');
    });

    it('should throw if an id cannot be found', async () => {
      await expect(populateArray(
        ['42', 'non-existent'],
        {type: 'reference', collection: () => collections.people},
        true,
      )).to.be.rejectedWith('Id non-existent not found');
    });

    it('should populate references without touching instances', async () => {
      const result = await populateArray(
        ['42', bob],
        {type: 'reference', collection: () => collections.people},
        true,
      );
      expect(result).to.be.an('array').and.have.length(2);
      expect(result[0]).to.be.an.instanceof(PersonModel);
      expect(result[0].toObject()).to.eql(alice.toObject());
      expect(result[1]).to.equal(bob);
    });

    it('should populate nested references', async () => {
      const result = await populateArray(
        ['1337', bobDiscussion],
        {type: 'reference', collection: () => collections.discussions},
        {author: true},
      );
      expect(result).to.be.an('array').and.have.length(2);
      expect(result[0]).to.be.an.instanceof(DiscussionModel);
      expect(result[0].author).to.be.an.instanceof(PersonModel);
      const aliceDiscussionObj = aliceDiscussion.toObject();
      aliceDiscussionObj.author = alice.toObject();
      expect(result[0].toObject()).to.eql(aliceDiscussionObj);
      expect(result[1]).to.equal(bobDiscussion);
      expect(result[1].author).to.be.an.instanceof(PersonModel);
      const bobDiscussionObj = bobDiscussion.toObject();
      bobDiscussionObj.author = bob.toObject();
      expect(result[1].toObject()).to.eql(bobDiscussionObj);
    });
  });

  describe('populateObject()', () => {
    const objectSchemaMap: SchemaMap = {
      foo: {type: 'reference', collection: () => collections.people},
      bar: {type: 'reference', collection: () => collections.people},
    };

    it('should fail if a key is not in the schema', async () => {
      await expect(populateObject({foo: '42', baz: '23'}, objectSchemaMap, {baz: true}))
        .to.be.rejectedWith('Key baz not found in schema.');
    });

    it('should fail if an id cannot not found', async () => {
      const obj = {foo: '42', bar: 'non-existent'};
      await expect(populateObject(obj, objectSchemaMap, {foo: true, bar: true}))
        .to.be.rejectedWith(`Id non-existent not found`);
      expect(obj).to.eql({foo: '42', bar: 'non-existent'});
    });

    it('should not touch undefined properties', async () => {
      const result = await populateObject({foo: '42'}, objectSchemaMap, {bar: true});
      expect(result).to.eql({foo: '42'});
    });

    it('should populate an id', async () => {
      const result = await populateObject({foo: '42', bar: '23'}, objectSchemaMap, {foo: true}) as any;
      expect(result.foo).to.be.an.instanceof(PersonModel);
      expect(result.foo.toObject()).to.eql(alice.toObject());
      expect(result.bar).to.equal('23');
    });
  });

  describe('populateValue()', () => {
    it('should throw with a non-populatable schema type', async () => {
      await expect(populateValue('foo', {type: 'string'}, true))
        .to.be.rejectedWith('Cannot populate type string');
    });

    describe('type reference', () => {
      const personRefSchema: SchemaValue = {type: 'reference', collection: () => collections.people};
      const discussionRefSchema: SchemaValue = {type: 'reference', collection: () => collections.discussions};

      it('should throw if the id cannot be found', async () => {
        await expect(populateValue('non-existent', personRefSchema, true))
          .to.be.rejectedWith('Id non-existent not found.');
      });

      it('should return an instance if id is provided', async () => {
        const result = await populateValue('42', personRefSchema, true);
        expect(result).to.be.an.instanceof(PersonModel);
        expect(result.toObject()).to.eql(alice.toObject());
      });

      it('should return input if instance is provided', async () => {
        const result = await populateValue(alice, personRefSchema, true);
        expect(result).to.equal(alice);
      });

      it('should return a nested populated instance if id is provided', async () => {
        const result = await populateValue('1337', discussionRefSchema, {author: true});
        expect(result).to.be.an.instanceof(DiscussionModel);
        expect(result.author).to.be.an.instanceof(PersonModel);
        const obj = aliceDiscussion.toObject();
        obj.author = alice.toObject();
        expect(result.toObject()).to.eql(obj);
      });

      it('should return a nested populated instance if instance is provided', async () => {
        const result = await populateValue(aliceDiscussion, discussionRefSchema, {author: true});
        expect(result).to.equal(aliceDiscussion);
        expect(result.author).to.be.an.instanceof(PersonModel);
        const obj = aliceDiscussion.toObject();
        obj.author = alice.toObject();
        expect(result.toObject()).to.eql(obj);
      });
    });

    describe('type object', () => {
      const objectSchema: SchemaValue = {
        type: 'object',
        definition: {
          foo: {type: 'reference', collection: () => collections.people},
          bar: {type: 'reference', collection: () => collections.people},
        },
      };

      it('should throw if called without a populateMap', async () => {
        await expect(populateValue({foo: '42'}, objectSchema, true))
          .to.be.rejectedWith('cannot be populated with populateReference = true');
      });

      it('should populate an object property', async () => {
        const result = await populateValue({foo: '42', bar: '23'}, objectSchema, {foo: true});
        expect(result.foo).to.be.an.instanceof(PersonModel);
        expect(result.foo.toObject()).to.eql(alice.toObject());
        expect(result.bar).to.equal('23');
      });
    });

    describe('type array', () => {
      const arraySchema: SchemaValue = {
        type: 'array',
        definition: {type: 'reference', collection: () => collections.people},
      };

      it('should populate an array', async () => {
        const result = await populateValue(['42', '23'], arraySchema, true);
        expect(result).to.be.an('array').and.have.length(2);
        expect(result[0]).to.be.instanceof(PersonModel);
        expect(result[1]).to.be.instanceof(PersonModel);
        expect(result[0].toObject()).to.eql(alice.toObject());
        expect(result[1].toObject()).to.eql(bob.toObject());
      });
    });
  });
});

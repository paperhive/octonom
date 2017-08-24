import { discussionCollection, DiscussionModel, peopleCollection,  PersonModel } from './model.data';
import { IPopulateMap, populateArray, populateObject, populateValue } from './populate';
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

    peopleCollection.clear();
    peopleCollection.insert(alice);
    peopleCollection.insert(bob);

    discussionCollection.clear();
    discussionCollection.insert(aliceDiscussion);
    discussionCollection.insert(bobDiscussion);
  });

  describe('populateArray()', () => {
  });

  describe('populateObject()', () => {
  });

  describe('populateValue()', () => {
    it('should throw with a non-populatable schema type', async () => {
      await expect(populateValue('foo', {type: 'string'}, true))
        .to.be.rejectedWith('Cannot populate type string');
    });

    describe('type reference', () => {
      const personRefSchema: SchemaValue = {type: 'reference', collection: () => peopleCollection};
      const discussionRefSchema: SchemaValue = {type: 'reference', collection: () => discussionCollection};

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
      const objectSchema: SchemaValue ={
        type: 'object',
        definition: {
          foo: {type: 'reference', collection: () => peopleCollection},
          bar: {type: 'reference', collection: () => peopleCollection},
        }
      };

      it('should throw if called without a populateMap', async () => {
        await expect(populateValue({foo: '42'}, objectSchema, true))
          .to.be.rejectedWith('cannot be populated with populateReference = true');
      });

      it('should populate an object property', async () => {
        const result = await populateValue({foo: '42', bar: '23'}, objectSchema, {foo: true})
        expect(result.foo).to.be.an.instanceof(PersonModel);
        expect(result.foo.toObject()).to.eql(alice.toObject());
        expect(result.bar).to.equal('23');
      });
    });

    describe('type array', () => {
      const arraySchema: SchemaValue ={
        type: 'array',
        definition: {type: 'reference', collection: () => peopleCollection},
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

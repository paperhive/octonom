import { spy } from 'sinon';

import { Model } from './model';
import { ModelArray } from './model-array';
import { CatModel, DiscussionModel, IPerson,
  peopleCollection, PersonAccountModel, PersonModel } from './model.data';
import { generateId } from './utils';

describe('Model', () => {
  describe('simple (CatModel)', () => {
    describe('constructor', () => {
      it('should create an empty instance with generated id via default function', () => {
        const cat = new CatModel();
        expect(cat.id).to.be.a('string').of.length.at.least(1);
      });

      it('should create a cat with id and name', () => {
        const cat = new CatModel({id: '42', name: 'Yllim'});
        expect(cat.id).to.equal('42');
        expect(cat.name).to.equal('Yllim');
      });
    });

    describe('property setter', () => {
      it('should set a property', () => {
        const cat = new CatModel();
        cat.id = '42';
        expect(cat.id).to.equal('42');
        cat.name = 'Yllim';
        expect(cat.name).to.equal('Yllim');
      });
    });

    describe('toObject()', () => {
      it('should get only schema properties', () => {
        const cat = new CatModel({id: '42', name: 'Yllim'});
        expect(cat.toObject()).to.eql({id: '42', name: 'Yllim'});
      });

      it('should not return properties with undefined value', () => {
        const cat = new CatModel({id: '42'});
        expect(cat.toObject()).to.eql({id: '42'});
      });
    });

    describe('inspect()', () => {
      it('should equal toObject() result', () => {
        const cat = new CatModel({id: '42', name: 'Yllim'});
        expect(cat.inspect()).to.eql({id: '42', name: 'Yllim'});
      });
    });
  });

  describe('nested model (PersonAccountModel in PersonModel)', () => {
    describe('constructor', () => {
      it('should create a person without account', () => {
        const person = new PersonModel({id: '42', name: 'Alice'});
        expect(person.toJSON()).to.deep.equal({id: '42', name: 'Alice'});
      });

      it('should create a person with raw account object', () => {
        const person = new PersonModel({id: '42', name: 'Alice', account: {username: 'alice'}});
        expect(person.account).to.be.an.instanceOf(PersonAccountModel);
        expect(person.toJSON()).to.deep.equal({id: '42', name: 'Alice', account: {username: 'alice'}});
      });

      it('should create a person with account instance', () => {
        const account = new PersonAccountModel({username: 'alice'});
        const person = new PersonModel({id: '42', name: 'Alice', account});
        expect(person.account).to.be.an.instanceOf(PersonAccountModel).and.equal(account);
        expect(person.toJSON()).to.deep.equal({id: '42', name: 'Alice', account: {username: 'alice'}});
      });
    });

    describe('set()', () => {
      it('should set a raw account object with set()', () => {
        const person = new PersonModel({name: 'Alice'});
        person.set({account: {username: 'alice'}});
        expect(person.account).to.be.an.instanceOf(PersonAccountModel);
        const personObj = person.toObject();
        expect(personObj).to.deep.equal({id: personObj.id, name: 'Alice', account: {username: 'alice'}});
      });

      it('should set an account instance with set()', () => {
        const person = new PersonModel({name: 'Alice'});
        const account = new PersonAccountModel({username: 'alice'});
        person.set({account});
        expect(person.account).to.be.an.instanceOf(PersonAccountModel).and.equal(account);
        const personObj = person.toObject();
        expect(personObj).to.deep.equal({id: personObj.id, name: 'Alice', account: {username: 'alice'}});
      });
    });

    describe('property setter', () => {
      it('should set a raw account object directly', () => {
        const person = new PersonModel({name: 'Alice'});
        person.account = {username: 'alice'};
        expect(person.account).to.be.an.instanceOf(PersonAccountModel);
        const personObj = person.toObject();
        expect(personObj).to.deep.equal({id: personObj.id, name: 'Alice', account: {username: 'alice'}});
      });

      it('should set an account instance directly', () => {
        const person = new PersonModel({name: 'Alice'});
        const account = new PersonAccountModel({username: 'alice'});
        person.account = account;
        expect(person.account).to.be.an.instanceOf(PersonAccountModel).and.equal(account);
        const personObj = person.toObject();
        expect(personObj).to.deep.equal({id: personObj.id, name: 'Alice', account: {username: 'alice'}});
      });
    });
  });

  describe('model array', () => {
    interface IGroup {
      id: string;
      members: ModelArray<IPerson, PersonModel> | Array<Partial<IPerson> | PersonModel>;
    }

    class GroupModel extends Model<IGroup> {
      @Model.PropertySchema({type: 'string', default: generateId})
      public id: string;

      @Model.PropertySchema({type: 'array', definition: {type: 'model', model: PersonModel}})
      public members: ModelArray<IPerson, PersonModel> | Array<Partial<IPerson> | PersonModel>;
    }

    describe('constructor', () => {
      it('should create a group with a raw array with mixed raw person object and person instance', () => {
        const person = new PersonModel({name: 'Bob'});
        const group = new GroupModel({members: [{name: 'Alice'}, person]});
        expect(group.members).to.be.an.instanceOf(ModelArray);
        expect(group.members).to.have.lengthOf(2);
        expect(group.members[0]).to.be.an.instanceOf(PersonModel).and.have.property('name', 'Alice');
        expect(group.members[1]).to.equal(person);
      });

      it('should create a group with a model array with person instances', () => {
        const members = new ModelArray(PersonModel, [{name: 'Alice'}, {name: 'Bob'}]);
        const group = new GroupModel({members});
        expect(group.members).to.equal(members);
      });

      it('should throw if a model array is provided with the wrong model', () => {
        const cats = new ModelArray(CatModel, [{name: 'Yllim'}]);
        expect(() => new GroupModel({members: cats})).to.throw('ModelArray model mismatch');
      });
    });

    describe('set()', () => {
      it('should set a raw array with mixed raw person object and person instance', () => {
        const person = new PersonModel({name: 'Bob'});
        const group = new GroupModel();
        group.set({members: [{name: 'Alice'}, person]});
        expect(group.members).to.be.an.instanceOf(ModelArray);
        expect(group.members).to.have.lengthOf(2);
        expect(group.members[0]).to.be.an.instanceOf(PersonModel).and.have.property('name', 'Alice');
        expect(group.members[1]).to.equal(person);
      });

      it('should set a model array with person instances', () => {
        const members = new ModelArray(PersonModel, [{name: 'Alice'}, {name: 'Bob'}]);
        const group = new GroupModel();
        group.set({members});
        expect(group.members).to.equal(members);
      });

      it('should throw if a model array is provided with the wrong model', () => {
        const cats = new ModelArray(CatModel, [{name: 'Yllim'}]);
        const group = new GroupModel();
        expect(() => group.set({members: cats})).to.throw('ModelArray model mismatch');
      });
    });

    describe('property setter', () => {
      it('should set a raw array with mixed raw person object and person instance', () => {
        const person = new PersonModel({name: 'Bob'});
        const group = new GroupModel();
        group.members = [{name: 'Alice'}, person];
        expect(group.members).to.be.an.instanceOf(ModelArray);
        expect(group.members).to.have.lengthOf(2);
        expect(group.members[0]).to.be.an.instanceOf(PersonModel).and.have.property('name', 'Alice');
        expect(group.members[1]).to.equal(person);
      });

      it('should set a model array with a person instance', () => {
        const members = new ModelArray(PersonModel, [{name: 'Alice'}, {name: 'Bob'}]);
        const group = new GroupModel();
        group.members = members;
        expect(group.members).to.equal(members);
      });

      it('should throw if a model array is provided with the wrong model', () => {
        const cats = new ModelArray(CatModel, [{name: 'Yllim'}]);
        const group = new GroupModel();
        expect(() => group.members = cats).to.throw('ModelArray model mismatch');
      });
    });

    describe('toObject()', () => {
      it('should run toObject on array elements', async () => {
        const person = new PersonModel({id: '42', name: 'Bob'});
        const toObject = spy(person, 'toObject');
        const group = new GroupModel({id: '1337', members: [person]});
        expect(group.toObject({unpopulate: true})).to.eql({id: '1337', members: [{id: '42', name: 'Bob'}]});
        expect(toObject.calledWith({unpopulate: true}));
      });
    });
  });

  describe('reference (author/PersonModel in DiscussionModel', () => {
    const alice = new PersonModel({id: '42', name: 'Alice'});
    const bob = new PersonModel({id: '23', name: 'Bob'});

    beforeEach(() => {
      peopleCollection.clear();
      peopleCollection.insert(alice);
      peopleCollection.insert(bob);
    });

    describe('constructor', () => {
      it('should create a discussion with an id', () => {
        const discussion = new DiscussionModel({author: '42'});
        expect(discussion.author).to.equal('42');
      });

      it('should create a discussion with a person instance', () => {
        const discussion = new DiscussionModel({author: alice});
        expect(discussion.author).to.equal(alice);
      });
    });

    describe('set()', () => {
      it('should set a discussion with an id', () => {
        const discussion = new DiscussionModel();
        discussion.set({author: '42'});
        expect(discussion.author).to.equal('42');
      });

      it('should set a discussion with a person instance', () => {
        const discussion = new DiscussionModel();
        discussion.set({author: alice});
        expect(discussion.author).to.equal(alice);
      });
    });

    describe('property setter', () => {
      it('should set a discussion with an id', () => {
        const discussion = new DiscussionModel();
        discussion.author = '42';
        expect(discussion.author).to.equal('42');
      });

      it('should set a discussion with a person instance', () => {
        const discussion = new DiscussionModel();
        discussion.author = alice;
        expect(discussion.author).to.equal(alice);
      });
    });

    describe('populate()', () => {
      it('should throw if key does not exist', async () => {
        const discussion = new DiscussionModel();
        await expect(discussion.populate({'non-existent': true}))
          .to.be.rejectedWith('Key non-existent not found in schema');
      });

      it('should throw if id does not exist', async () => {
        const discussion = new DiscussionModel({author: 'non-existent'});
        await expect(discussion.populate({author: true}))
          .to.be.rejectedWith('Id non-existent not found.');
      });

      it('should populate an id with an instance', async () => {
        const discussion = new DiscussionModel({author: '42'});
        await discussion.populate({author: true});
        expect(discussion.author).to.be.instanceof(PersonModel);
        expect((discussion.author as PersonModel).toObject()).to.eql({id: '42', name: 'Alice'});
      });

      it('should populate multiple fields');
    });

    describe('toObject()', () => {
      it('should return the id of an unpopulated reference', () => {
        const discussion = new DiscussionModel({author: '42'});
        expect(discussion.toObject()).have.property('author', '42');
      });

      it('should run toObject() recursively on a populated reference with {unpopulate: false}', () => {
        const discussion = new DiscussionModel({author: alice});
        expect(discussion.toObject({unpopulate: false})).have.property('author').that.eql({id: '42', name: 'Alice'});
      });

      it('should return the id of a populated reference with {unpopulate: true}', () => {
        const discussion = new DiscussionModel({author: alice});
        expect(discussion.toObject({unpopulate: true})).have.property('author', '42');
      });
    });
  });

  describe('reference array', () => {
    interface IGroup {
      id: string;
      members: Array<string | PersonModel>;
    }

    class GroupModel extends Model<IGroup> {
      @Model.PropertySchema({type: 'string', default: generateId})
      public id: string;

      @Model.PropertySchema({type: 'array', definition: {type: 'reference', collection: () => peopleCollection}})
      public members: Array<string | PersonModel>;
    }

    const alice = new PersonModel({id: '42', name: 'Alice'});
    const bob = new PersonModel({id: '23', name: 'Bob'});

    beforeEach(() => {
      peopleCollection.clear();
      peopleCollection.insert(alice);
      peopleCollection.insert(bob);
    });

    describe('constructor', () => {
      it('should create a group with an array with id and person instance', () => {
        const members = [alice.id, bob];
        const group = new GroupModel({id: '1337', members});
        expect(group.members).to.be.an('array').and.to.eql(members);
      });
    });

    describe('set()', () => {
      it('should set an array with id and person instance', () => {
        const group = new GroupModel({id: '1337'});
        const members = [alice.id, bob];
        group.set({members});
        expect(group.members).to.be.an('array').and.to.eql(members);
      });
    });

    describe('property setter', () => {
      it('should set an array with id and person instance', () => {
        const group = new GroupModel({id: '1337'});
        const members = [alice.id, bob];
        group.members = members;
        expect(group.members).to.be.an('array').and.to.eql(members);
      });
    });

    describe('populate()', () => {
      it('should throw if path is invalid', async () => {
        const discussion = new DiscussionModel({author: 'non-existent'});
        await expect(discussion.populate({foo: true})).to.be.rejectedWith('Key foo not found in schema');
      });

      it('should throw if id does not exist', async () => {
        const discussion = new DiscussionModel({author: 'non-existent'});
        await expect(discussion.populate({author: true})).to.be.rejectedWith('Id non-existent not found');
      });

      it('should populate ids with an instance', async () => {
        const group = new GroupModel({id: '1337', members: [alice, bob.id]});
        await group.populate({members: true});
        expect(group.members).to.be.an('array').and.be.of.length(2);
        expect(group.members[0]).to.equal(alice);
        expect((group.members[1] as PersonModel).toObject()).to.eql(bob.toObject());
      });
    });

    describe('toObject()', () => {
      it('should return an object for instances and the id for an unpopulated reference', () => {
        const members = [alice, bob.id];
        const group = new GroupModel({id: '1337', members});
        const groupObj = group.toObject();
        expect(groupObj.members).to.eql([alice.toObject(), bob.id]);
      });

      it('should run toObject() recursively on populated references with {unpopulate: false}', () => {
        const members = [alice, bob.id];
        const group = new GroupModel({id: '1337', members});
        const groupObj = group.toObject({unpopulate: false});
        expect(groupObj.members).to.eql([alice.toObject(), bob.id]);
      });

      it('should return the id of populated references with {unpopulate: true}', () => {
        const members = [alice, bob.id];
        const group = new GroupModel({id: '1337', members});
        const groupObj = group.toObject({unpopulate: true});
        expect(groupObj.members).to.eql([alice.id, bob.id]);
      });
    });
  });
});

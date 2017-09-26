import { spy } from 'sinon';

import { collections } from '../test/data/collections';

import { AllModel, nestedCollection, NestedModel } from '../test/data/models/all';
import { CatModel } from '../test/data/models/cat';
import { DiscussionModel } from '../test/data/models/discussion';
import { GroupWithArrayModel } from '../test/data/models/group-with-array';
import { GroupWithReferencesModel } from '../test/data/models/group-with-references';
import { PersonModel } from '../test/data/models/person';
import { PersonAccountModel } from '../test/data/models/person-account';

import { ValidationError } from './errors';
import { Hook, Model } from './model';
import { ModelArray } from './model-array';
import { Property, Schema } from './schema/index';

describe('Hook decorator', () => {
  let beforeObj;
  let afterObj;
  const beforeSet = spy(options => beforeObj = options.instance.toObject());
  const afterSet = spy(options => afterObj = options.instance.toObject());

  function resetSpies() {
    beforeObj = undefined;
    afterObj = undefined;
    beforeSet.reset();
    afterSet.reset();
  }

  beforeEach(resetSpies);

  @Hook('beforeSet', beforeSet)
  @Hook('afterSet', afterSet)
  class Hooked extends Model {
    @Property.String()
    public foo: string;

    @Property.String()
    public baz: string;

    @Property.Model({model: NestedModel})
    public model: Partial<NestedModel>;

    @Property.Object({schema: {name: new Schema.String()}})
    public object: {name: string};

    @Property.Array({elementSchema: new Schema.String()})
    public array: string[];
  }

  it('should register handlers', () => {
    expect((Hooked.hooks as any).handlers.beforeSet).to.eql([beforeSet]);
    expect((Hooked.hooks as any).handlers.afterSet).to.eql([afterSet]);
  });

  it('should create separate Hook instances for new classes', () => {
    @Hook('beforeSet', beforeSet)
    class DoubleHooked extends Hooked {}
    expect((Hooked.hooks as any).handlers.beforeSet).to.eql([beforeSet]);
    expect((Hooked.hooks as any).handlers.afterSet).to.eql([afterSet]);
    expect((DoubleHooked.hooks as any).handlers.beforeSet).to.eql([beforeSet, beforeSet]);
    expect((DoubleHooked.hooks as any).handlers.afterSet).to.eql([afterSet]);
  });

  describe('set handlers', () => {
    describe('on root model', () => {
      it('should run handlers when constructed', () => {
        const hooked = new Hooked({foo: 'bar', object: {name: 'foo'}});
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: [], data: {foo: 'bar', object: {name: 'foo'}}});
        expect(beforeObj).to.eql({});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: [], data: {foo: 'bar', object: {name: 'foo'}}});
        expect(afterObj).to.eql({foo: 'bar', object: {name: 'foo'}});
      });

      it('should run handlers when calling set()', () => {
        const hooked = new Hooked({});
        resetSpies();
        hooked.set({foo: 'bar', baz: 'lol'});
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: [], data: {foo: 'bar', baz: 'lol'}});
        expect(beforeObj).to.eql({});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: [], data: {foo: 'bar', baz: 'lol'}});
        expect(afterObj).to.eql({foo: 'bar', baz: 'lol'});
      });

      it('should run handlers when setting a value', () => {
        const hooked = new Hooked({});
        resetSpies();
        hooked.foo = 'bar';
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['foo'], data: 'bar'});
        expect(beforeObj).to.eql({});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['foo'], data: 'bar'});
        expect(afterObj).to.eql({foo: 'bar'});
      });

      it('should run handlers when deleting a value', () => {
        const hooked = new Hooked({foo: 'bar'});
        resetSpies();
        delete hooked.foo;
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['foo'], data: undefined});
        expect(beforeObj).to.eql({foo: 'bar'});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['foo'], data: undefined});
        expect(afterObj).to.eql({});
      });
    });

    describe('nested model', () => {
      it('should run handlers on root model when calling set() on nested model', () => {
        const hooked = new Hooked({model: {name: 'foo'}});
        resetSpies();
        hooked.model.set({name: 'bar'});
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['model'], data: {name: 'bar'}});
        expect(beforeObj).to.eql({model: {name: 'foo'}});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['model'], data: {name: 'bar'}});
        expect(afterObj).to.eql({model: {name: 'bar'}});
      });

      it('should run handlers on root model when setting a value on a nested model', () => {
        const hooked = new Hooked({model: {name: 'foo'}});
        resetSpies();
        hooked.model.name = 'bar';
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['model', 'name'], data: 'bar'});
        expect(beforeObj).to.eql({model: {name: 'foo'}});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['model', 'name'], data: 'bar'});
        expect(afterObj).to.eql({model: {name: 'bar'}});
      });

      it('should run handlers on root model when deleting a value on a nested model ', () => {
        const hooked = new Hooked({model: {name: 'foo'}});
        resetSpies();
        delete hooked.model.name;
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['model', 'name'], data: undefined});
        expect(beforeObj).to.eql({model: {name: 'foo'}});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['model', 'name'], data: undefined});
        expect(afterObj).to.eql({model: {}});
      });
    });

    describe('nested object', () => {
      it('should run handlers on root model when setting a value on a nested object', () => {
        const hooked = new Hooked({object: {name: 'foo'}});
        resetSpies();
        hooked.object.name = 'bar';
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['object', 'name'], data: 'bar'});
        expect(beforeObj).to.eql({object: {name: 'foo'}});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['object', 'name'], data: 'bar'});
        expect(afterObj).to.eql({object: {name: 'bar'}});
      });

      it('should run handlers on root model when deleting a value on a nested object', () => {
        const hooked = new Hooked({object: {name: 'foo'}});
        resetSpies();
        delete hooked.object.name;
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['object', 'name'], data: undefined});
        expect(beforeObj).to.eql({object: {name: 'foo'}});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['object', 'name'], data: undefined});
        expect(afterObj).to.eql({object: {}});
      });
    });

    describe('nested array', () => {
      it('should run handlers on root model when setting a value on a nested array', () => {
        const hooked = new Hooked({array: ['foo', 'bar']});
        resetSpies();
        hooked.array[1] = 'baz';
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array', 1], data: 'baz'});
        expect(beforeObj).to.eql({array: ['foo', 'bar']});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array', 1], data: 'baz'});
        expect(afterObj).to.eql({array: ['foo', 'baz']});
      });

      it('should run handlers on root model when deleting a value on a nested array', () => {
        const hooked = new Hooked({array: ['foo', 'bar']});
        resetSpies();
        delete hooked.array[1];
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array', 1], data: undefined});
        expect(beforeObj).to.eql({array: ['foo', 'bar']});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array', 1], data: undefined});
        expect(afterObj).to.eql({array: ['foo', undefined]});
      });

      it('should run handlers on root model when copying within an array', () => {
        const hooked = new Hooked({array: ['foo', 'bar', 'baz']});
        resetSpies();
        hooked.array.copyWithin(2, 0, 1);
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array'], data: ['foo', 'bar', 'foo']});
        expect(beforeObj).to.eql({array: ['foo', 'bar', 'baz']});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array'], data: ['foo', 'bar', 'foo']});
        expect(afterObj).to.eql({array: ['foo', 'bar', 'foo']});
      });

      it('should run handlers on root model when filling a nested array', () => {
        const hooked = new Hooked({array: ['foo', 'bar', 'boo']});
        resetSpies();
        hooked.array.fill('baz', 1, 3);
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array'], data: ['foo', 'baz', 'baz']});
        expect(beforeObj).to.eql({array: ['foo', 'bar', 'boo']});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array'], data: ['foo', 'baz', 'baz']});
        expect(afterObj).to.eql({array: ['foo', 'baz', 'baz']});
      });

      it('should run handlers on root model when pushing values to a nested array', () => {
        const hooked = new Hooked({array: ['foo', 'bar']});
        resetSpies();
        const element = hooked.array.pop();
        expect(element).to.equal('bar');
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array'], data: ['foo']});
        expect(beforeObj).to.eql({array: ['foo', 'bar']});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array'], data: ['foo']});
        expect(afterObj).to.eql({array: ['foo']});
      });

      it('should run handlers on root model when pushing values to a nested array', () => {
        const hooked = new Hooked({array: ['foo', 'bar']});
        resetSpies();
        hooked.array.push('baz', 'boo');
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array'], data: ['foo', 'bar', 'baz', 'boo']});
        expect(beforeObj).to.eql({array: ['foo', 'bar']});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array'], data: ['foo', 'bar', 'baz', 'boo']});
        expect(afterObj).to.eql({array: ['foo', 'bar', 'baz', 'boo']});
      });

      it('should run handlers on root model when reversing a nested array', () => {
        const hooked = new Hooked({array: ['foo', 'bar']});
        resetSpies();
        hooked.array.reverse();
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array'], data: ['bar', 'foo']});
        expect(beforeObj).to.eql({array: ['foo', 'bar']});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array'], data: ['bar', 'foo']});
        expect(afterObj).to.eql({array: ['bar', 'foo']});
      });

      it('should run handlers on root model when splicing a nested array', () => {
        const hooked = new Hooked({array: ['foo', 'bar', 'baz']});
        resetSpies();
        hooked.array.splice(1, 1, 'boo', 'buu');
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array'], data: ['foo', 'boo', 'buu', 'baz']});
        expect(beforeObj).to.eql({array: ['foo', 'bar', 'baz']});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array'], data: ['foo', 'boo', 'buu', 'baz']});
        expect(afterObj).to.eql({array: ['foo', 'boo', 'buu', 'baz']});
      });

      it('should run handlers on root model when unshifting a nested array', () => {
        const hooked = new Hooked({array: ['foo', 'bar']});
        resetSpies();
        hooked.array.unshift('baz', 'boo');
        expect(beforeSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array'], data: ['baz', 'boo', 'foo', 'bar']});
        expect(beforeObj).to.eql({array: ['foo', 'bar']});
        expect(afterSet).to.be.calledOnce.and
          .calledWith({instance: hooked, path: ['array'], data: ['baz', 'boo', 'foo', 'bar']});
        expect(afterObj).to.eql({array: ['baz', 'boo', 'foo', 'bar']});
      });
    });
  });
});

describe('Property decorator', () => {
  class TestModel extends Model {
    @Property.String()
    public foo: string;
  }

  it('should register a schema property', () => {
    expect(TestModel.schema.foo).to.be.an.instanceOf(Schema.String);
  });

  it('should create a separate for new classes', () => {
    class Derived extends TestModel {
      @Property.String()
      public bar: string;
    }
    expect(TestModel.schema).to.not.have.property('bar');
    expect(Derived.schema.bar).to.be.an.instanceOf(Schema.String);
  });
});

describe('Model', () => {
  it('should allow non-schema properties', () => {
    class TestModel extends Model {
      @Property.String()
      public foo: string;

      public bar: string;
    }
    const instance = new TestModel({foo: 'test'});
    instance.bar = 'baz';
    expect(instance).to.eql({foo: 'test', bar: 'baz'});
    delete instance.bar;
    expect(instance).to.eql({foo: 'test'});
  });

  it('should set a schema property', () => {
    class TestModel extends Model {
      public foo: string;
    }
    const schema = new Schema.String();
    TestModel.setSchema('foo', schema);
    expect(TestModel.schema).to.have.property('foo', schema);
  });

  it('should throw if a schema property is already set', () => {
    class TestModel extends Model {
      public foo: string;
    }
    TestModel.setSchema('foo', new Schema.String());
    expect(() => TestModel.setSchema('foo', new Schema.String()))
      .to.throw(Error, 'Key foo is already set.');
  });

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

      it('should delete a property', () => {
        const cat = new CatModel();
        cat.id = '42';
        delete cat.id;
        expect(cat.id).to.equal(undefined);
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
        expect(person.account).to.be.an.instanceOf(PersonAccountModel).and.eql(account);
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
        expect(person.account).to.be.an.instanceOf(PersonAccountModel).and.eql(account);
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
        expect(person.account).to.be.an.instanceOf(PersonAccountModel).and.eql(account);
        const personObj = person.toObject();
        expect(personObj).to.deep.equal({id: personObj.id, name: 'Alice', account: {username: 'alice'}});
      });
    });
  });

  describe('model array', () => {
    describe('constructor', () => {
      it('should create a group with a raw array with mixed raw person object and person instance', () => {
        const person = new PersonModel({name: 'Bob'});
        const group = new GroupWithArrayModel({members: [{name: 'Alice'}, person]});
        expect(group.members).to.be.an('array').and.have.lengthOf(2);
        expect(group.members[0]).to.be.an.instanceOf(PersonModel).and.have.property('name', 'Alice');
        expect(group.members[1]).to.eql(person);
      });

      it('should create a group with a model array with person instances', () => {
        const members = new ModelArray<PersonModel>(PersonModel, [{name: 'Alice'}, {name: 'Bob'}]);
        const group = new GroupWithArrayModel({members});
        expect(group.members).to.eql(members);
      });

      it('should throw if a model array is provided with the wrong model', () => {
        const cats = new ModelArray<CatModel>(CatModel, [{name: 'Yllim'}]);
        expect(() => new GroupWithArrayModel({members: cats})).to.throw('ModelArray model mismatch');
      });
    });

    describe('set()', () => {
      it('should set a raw array with mixed raw person object and person instance', () => {
        const person = new PersonModel({name: 'Bob'});
        const group = new GroupWithArrayModel();
        group.set({members: [{name: 'Alice'}, person]});
        expect(group.members).to.be.an('array').and.have.lengthOf(2);
        expect(group.members[0]).to.be.an.instanceOf(PersonModel).and.have.property('name', 'Alice');
        expect(group.members[1]).to.eql(person);
      });

      it('should set a model array with person instances', () => {
        const members = new ModelArray<PersonModel>(PersonModel, [{name: 'Alice'}, {name: 'Bob'}]);
        const group = new GroupWithArrayModel();
        group.set({members});
        expect(group.members).to.eql(members);
      });

      it('should throw if a model array is provided with the wrong model', () => {
        const cats = new ModelArray<CatModel>(CatModel, [{name: 'Yllim'}]);
        const group = new GroupWithArrayModel();
        expect(() => group.set({members: cats})).to.throw('ModelArray model mismatch');
      });
    });

    describe('property setter', () => {
      it('should set a raw array with mixed raw person object and person instance', () => {
        const person = new PersonModel({name: 'Bob'});
        const group = new GroupWithArrayModel();
        group.members = [{name: 'Alice'}, person];
        expect(group.members).to.be.an('array').and.to.have.lengthOf(2);
        expect(group.members[0]).to.be.an.instanceOf(PersonModel).and.have.property('name', 'Alice');
        expect(group.members[1]).to.eql(person);
      });

      it('should set a model array with a person instance', () => {
        const members = new ModelArray<PersonModel>(PersonModel, [{name: 'Alice'}, {name: 'Bob'}]);
        const group = new GroupWithArrayModel();
        group.members = members;
        expect(group.members).to.eql(members);
      });

      it('should throw if a model array is provided with the wrong model', () => {
        const cats = new ModelArray<CatModel>(CatModel, [{name: 'Yllim'}]);
        const group = new GroupWithArrayModel();
        expect(() => group.members = cats).to.throw('ModelArray model mismatch');
      });
    });

    describe('toObject()', () => {
      it('should run toObject on array elements', async () => {
        const person = new PersonModel({id: '42', name: 'Bob'});
        const group = new GroupWithArrayModel({id: '1337', members: [person]});
        expect(group.toObject({unpopulate: true})).to.eql({id: '1337', members: [{id: '42', name: 'Bob'}]});
      });
    });
  });

  describe('reference (author/PersonModel in DiscussionModel', () => {
    const alice = new PersonModel({id: '42', name: 'Alice'});
    const bob = new PersonModel({id: '23', name: 'Bob'});

    beforeEach(() => {
      collections.people.clear();
      collections.people.insert(alice);
      collections.people.insert(bob);
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
          .to.be.rejectedWith('Instance with id non-existent not found.');
      });

      it('should populate an id with an instance', async () => {
        const discussion = new DiscussionModel({author: '42'});
        await discussion.populate({author: true});
        expect(discussion.author).to.be.instanceof(PersonModel);
        expect((discussion.author as PersonModel).toObject()).to.eql({id: '42', name: 'Alice'});
      });
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
    const alice = new PersonModel({id: '42', name: 'Alice'});
    const bob = new PersonModel({id: '23', name: 'Bob'});

    beforeEach(() => {
      collections.people.clear();
      collections.people.insert(alice);
      collections.people.insert(bob);
    });

    describe('constructor', () => {
      it('should create a group with an array with id and person instance', () => {
        const members = [alice.id, bob];
        const group = new GroupWithReferencesModel({id: '1337', members});
        expect(group.members).to.be.an('array').and.to.eql(members);
      });
    });

    describe('set()', () => {
      it('should set an array with id and person instance', () => {
        const group = new GroupWithReferencesModel({id: '1337'});
        const members = [alice.id, bob];
        group.set({members});
        expect(group.members).to.be.an('array').and.to.eql(members);
      });
    });

    describe('property setter', () => {
      it('should set an array with id and person instance', () => {
        const group = new GroupWithReferencesModel({id: '1337'});
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
        await expect(discussion.populate({author: true})).to.be.rejectedWith('Instance with id non-existent not found');
      });

      it('should populate ids with an instance', async () => {
        const group = new GroupWithReferencesModel({id: '1337', members: [alice, bob.id]});
        await group.populate({members: true});
        expect(group.members).to.be.an('array').and.be.of.length(2);
        expect(group.members[0]).to.equal(alice);
        expect((group.members[1] as PersonModel).toObject()).to.eql(bob.toObject());
      });
    });

    describe('toObject()', () => {
      it('should return an object for instances and the id for an unpopulated reference', () => {
        const members = [alice, bob.id];
        const group = new GroupWithReferencesModel({id: '1337', members});
        const groupObj = group.toObject();
        expect(groupObj.members).to.eql([alice.toObject(), bob.id]);
      });

      it('should run toObject() recursively on populated references with {unpopulate: false}', () => {
        const members = [alice, bob.id];
        const group = new GroupWithReferencesModel({id: '1337', members});
        const groupObj = group.toObject({unpopulate: false});
        expect(groupObj.members).to.eql([alice.toObject(), bob.id]);
      });

      it('should return the id of populated references with {unpopulate: true}', () => {
        const members = [alice, bob.id];
        const group = new GroupWithReferencesModel({id: '1337', members});
        const groupObj = group.toObject({unpopulate: true});
        expect(groupObj.members).to.eql([alice.id, bob.id]);
      });
    });
  });

  describe('all schemas (AllModel)', () => {
    const nested = new NestedModel({id: 'alice', name: 'Alice'});

    before(() => {
      nestedCollection.clear();
      nestedCollection.insert(nested);
    });

    it('should create an instance with all schemas', async () => {
      const data: Partial<AllModel> = {
        any: {foo: 'bar'},
        array: [true, false],
        boolean: false,
        date: new Date(),
        model: new NestedModel({id: 'bob', name: 'Bob'}),
        number: 42,
        object: {enabled: true},
        reference: nested.id,
        string: 'foo',
      };
      const all = new AllModel(data);
      expect(all).to.eql(data);
    });
  });

  describe('validate()', () => {
    class TestModel extends Model {
      @Property.String({required: true})
      public required: string;

      @Property.Array({elementSchema: new Schema.String({enum: ['foo', 'bar']})})
      public array: string[];

      @Property.Model({model: TestModel})
      public model: TestModel;

      @Property.Object({schema: {foo: new Schema.String({enum: ['bar']})}})
      public object: {foo: string};
    }

    it('should throw if a key is required', async () => {
      const instance = new TestModel();
      await expect(instance.validate())
        .to.be.rejectedWith(ValidationError, 'Required value is undefined.');
    });

    it('should throw if nested array validation throws', async () => {
      const instance = new TestModel({required: 'foo', array: ['foo', 'baz']});
      let error;
      await instance.validate().catch(e => error = e);
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.equal('String not in enum: foo, bar.');
      expect(error.value).to.equal('baz');
      expect(error.path).to.eql(['array', 1]);
      expect(error.instance).to.equal(instance);
    });

    it('should throw if nested model validation throws', async () => {
      const instance = new TestModel({
        required: 'foo',
        model: new TestModel({}),
      });
      let error;
      await instance.validate().catch(e => error = e);
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.equal('Required value is undefined.');
      expect(error.value).to.equal(undefined);
      expect(error.path).to.eql(['model', 'required']);
      expect(error.instance).to.equal(instance);
    });

    it('should throw if nested object validation throws', async () => {
      const instance = new TestModel({required: 'foo', object: {foo: 'baz'}});
      let error;
      await instance.validate().catch(e => error = e);
      expect(error).to.be.instanceOf(ValidationError);
      expect(error.message).to.equal('String not in enum: bar.');
      expect(error.value).to.equal('baz');
      expect(error.path).to.eql(['object', 'foo']);
      expect(error.instance).to.equal(instance);
    });

    it('should pass with a valid instance', async () => {
      const instance = new TestModel({
        required: 'foo',
        array: ['foo', 'bar'],
        model: new TestModel({required: 'bar'}),
        object: {foo: 'bar'},
      });
      await instance.validate();
    });
  });
});

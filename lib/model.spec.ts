import { CatModel, DiscussionModel, GroupModel, PersonAccountModel, PersonModel } from './model.data' ;

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

  describe('nested (PersonAccountModel in PersonModel)', () => {
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

  describe('nested array (PersonModel in GroupModel)', () => {
    describe('constructor', () => {
      it('should create a group with a raw array with mixed raw person object and person instance');

      it('should create a group with a model array with a person instance');
    });

    describe('set()', () => {
      it('should set a raw array with mixed raw person object and person instance');
      it('should set a model array with a person instance');
    });

    describe('property setter', () => {
      it('should set a raw array with mixed raw person object and person instance');
      it('should set a model array with a person instance');
    });
  });

  describe('reference (PersonModel in DiscussionModel', () => {
    describe('constructor', () => {
      it('should create a discussion with a raw person object');
      it('should create a discussion with a person instance');
    });

    describe('set()', () => {
      it('should set a discussion with a raw person object');
      it('should set a discussion with a person instance');
    });

    describe('property setter', () => {
      it('should set a discussion with a raw person object');
      it('should set a discussion with a person instance');
    });

    describe('populate()', () => {
      it('should populate a person');
    });
  });

  describe('reference array (PersonModel in DiscussionModel)', () => {
    describe('constructor', () => {
      it('should create a discussion with a raw array with mixed raw person object and person instance');
      it('should create a discussion with a model array with a person instance');
    });

    describe('set()', () => {
      it('should set a raw array with mixed raw person object and person instance');
      it('should set a model array with a person instance');
    });

    describe('property setter', () => {
      it('should set a raw array with mixed raw person object and person instance');
      it('should set a model array with a person instance');
    });
  });
});

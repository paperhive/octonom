import { DiscussionModel, PersonAccountModel, PersonModel } from './model.data' ;

describe('Model', () => {

  describe('PersonModel', () => {
    it('should create an empty person', () => {
      const person = new PersonModel();
      expect(person.toJSON()).to.deep.equal({});
    });

    it('should allow to set a property with set()', () => {
      const person = new PersonModel();
      person.set({name: 'Alice', account: {username: 'alice'}});
      expect(person.toJSON()).to.deep.equal({name: 'Alice', account: {username: 'alice'}});
    });

    it('should allow to set a property directly with proper instances', () => {
      const person = new PersonModel();
      person.name = 'Alice';
      person.account = new PersonAccountModel({username: 'alice'});
      expect(person.account).to.be.an.instanceOf(PersonAccountModel);
      expect(person.toJSON()).to.deep.equal({name: 'Alice', account: {username: 'alice'}});
    });

    it('should allow to set a property directly with implicit instantiation', () => {
      const person = new PersonModel();
      person.name = 'Alice';
      person.account = {username: 'alice'};
      expect(person.account).to.be.an.instanceOf(PersonAccountModel);
      expect(person.toJSON()).to.deep.equal({name: 'Alice', account: {username: 'alice'}});
    });

    it('should create a person without account', () => {
      const person = new PersonModel({name: 'Alice'});
      expect(person.toJSON()).to.deep.equal({name: 'Alice'});
    });

    it('should create a person with account', () => {
      const person = new PersonModel({name: 'Alice', account: {username: 'alice'}});
      expect(person.account).to.be.an.instanceOf(PersonAccountModel);
      expect(person.toJSON()).to.deep.equal({name: 'Alice', account: {username: 'alice'}});
    });
  });

  it.skip('should create a DiscussionModel', () => {
    const discussion = new DiscussionModel({author: '42', title: 'new discussion'});
    // console.log(discussion.toJSON());
  });
});

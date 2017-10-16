import { expect } from 'chai';
import { Model, Property } from 'octonom';

import { CreatedAt, Timestamp, UpdatedAt } from './timestamp';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class Timestamped extends Model {
  @CreatedAt()
  public createdAt: Date;

  @UpdatedAt()
  public updatedAt: Date;

  @Property.String()
  public foo: string;
}

describe('CreatedAt', () => {
  it('should set createdAt on a new instance', () => {
    const instance = new Timestamped();
    expect(instance).to.have.property('createdAt').which.is.an.instanceOf(Date);
  });

  it('should set createdAt on an initialized new instance', () => {
    const instance = new Timestamped({foo: 'bar'});
    expect(instance).to.have.property('createdAt').which.is.an.instanceOf(Date);
  });

  it('should use createdAt from initialization data', () => {
    const createdAt = new Date('2016-09-15T20:00:00.000Z');
    const instance = new Timestamped({createdAt, foo: 'bar'});
    expect(instance).to.have.property('createdAt').which.is.an.instanceOf(Date);
    expect(instance.createdAt.getTime()).to.equal(createdAt.getTime());
  });

  it('should not change when setting a property', async () => {
    const instance = new Timestamped({foo: 'bar'});
    expect(instance).to.have.property('createdAt').which.is.an.instanceOf(Date);
    const createdAt = new Date(instance.createdAt);
    await sleep(10);
    instance.foo = 'baz';
    expect(instance.createdAt.getTime()).to.equal(createdAt.getTime());
  });
});

describe('UpdatedAt', () => {
  it('should set updatedAt on a new instance', () => {
    const instance = new Timestamped();
    expect(instance).to.have.property('updatedAt').which.is.an.instanceOf(Date);
  });

  it('should set updatedAt on an initialized new instance', () => {
    const instance = new Timestamped({foo: 'bar'});
    expect(instance).to.have.property('updatedAt').which.is.an.instanceOf(Date);
  });

  it('should use updatedAt from initialization data', () => {
    const updatedAt = new Date('2016-09-15T20:00:00.000Z');
    const instance = new Timestamped({updatedAt, foo: 'bar'});
    expect(instance).to.have.property('updatedAt').which.is.an.instanceOf(Date);
    expect(instance.updatedAt.getTime()).to.equal(updatedAt.getTime());
  });

  it('should update when setting a property', async () => {
    const instance = new Timestamped({foo: 'bar'});
    expect(instance).to.have.property('updatedAt').which.is.an.instanceOf(Date);
    const updatedAt = new Date(instance.updatedAt);
    await sleep(10);
    instance.foo = 'baz';
    expect(updatedAt.getTime()).to.be.lessThan(instance.updatedAt.getTime());
  });
});

describe('Timestamp mixin', () => {
  class Base extends Model {
    @Property.String()
    public name: string;
  }

  function testInstance(instance) {
    expect(instance).to.have.property('createdAt').which.is.an.instanceOf(Date);
    expect(instance).to.have.property('updatedAt').which.is.an.instanceOf(Date);
  }

  function testClass(timestampedClass) {
    it('should set createdAt and updatedAt on a new instance', () => {
      const instance = new timestampedClass();
      testInstance(instance);
      expect(instance.createdAt.getTime()).to.equal(instance.updatedAt.getTime());
    });

    it('should use createdAt and updatedAt from initialization data', () => {
      const createdAt = new Date('2016-09-15T20:00:00.000Z');
      const updatedAt = new Date('2016-09-16T07:00:00.000Z');
      const instance = new timestampedClass({name: 'test', createdAt, updatedAt});
      testInstance(instance);
      expect(instance).to.eql({name: 'test', createdAt, updatedAt});
    });

    it('should update updatedAt when calling set()', async () => {
      const instance = new timestampedClass();
      await sleep(10);
      instance.set({name: 'test'});
      testInstance(instance);
      expect(instance.createdAt.getTime()).to.be.lessThan(instance.updatedAt.getTime());
    });

    it('should update updatedAt when setting a property', async () => {
      const instance = new timestampedClass();
      await sleep(10);
      instance.name = 'test';
      testInstance(instance);
      expect(instance.createdAt.getTime()).to.be.lessThan(instance.updatedAt.getTime());
    });

    it('should update updatedAt when deleting a property', async () => {
      const instance = new timestampedClass({name: 'test'});
      await sleep(10);
      delete instance.name;
      testInstance(instance);
      expect(instance.createdAt.getTime()).to.be.lessThan(instance.updatedAt.getTime());
    });
  }

  describe('Direct mixin extending from Model', () => {
    class Timestamped extends Timestamp(Model) {
      @Property.String()
      public name: string;
    }

    testClass(Timestamped);
  });

  describe('Mixin extending a base class', () => {
    class Timestamped extends Timestamp(Base) {}

    testClass(Timestamped);
  });
});

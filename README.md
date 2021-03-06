# octonom

[![npm version](https://badge.fury.io/js/octonom.svg)](https://badge.fury.io/js/octonom)
[![Greenkeeper badge](https://badges.greenkeeper.io/paperhive/octonom.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/paperhive/octonom.svg?branch=master)](https://travis-ci.org/paperhive/octonom)
[![codecov](https://codecov.io/gh/paperhive/octonom/branch/master/graph/badge.svg)](https://codecov.io/gh/paperhive/octonom)

<img src="https://paperhive.github.io/octonom/octonom.svg" width="400"></img><br>
###### Logo by [Laura Simonite](https://twitter.com/LFSimonite) (CC-BY 4.0)

Octonom brings you TypeScript-based models and collections for any database with proper separation of concerns:

* **Models**
  * have a schema
  * instances can be validated
  * are independent of how the data is actually stored in a database
* **Collections**
  * deal with getting your data from/to the database
  * raw database objects are mapped to rich typescript models on the fly (and vice versa)
  * are specific to the database you use (e.g. `MongoCollection`, `CouchCollection`)

## Features of octonom

* clear separation of concerns:
  * models allow you to work with your data
  * collections take care of persisting and retrieving data to/from a database
* models are TypeScript/ES6 classes with typed properties
* extensible: if you need something specific, just extend the octonom classes
* multi-database support: implementing a collection for your favorite database is just a few LOCs
* runs in NodeJS and browsers

## Examples

### Model

Let's define a model:

```typescript
import { Model, Property } from 'octonom';

export class Person extends Model {
  @Property.String()
  public id: string;

  @Property.String()
  public name: string;

  @Property.Number({integer: true, min: 0})
  public age: number;

  public makeOlder() {
    this.age++;
  }
}
```

Let's create an instance:

```typescript
// create an instance with initial data
const person = new Person({name: 'Marx', age: 200});

// call a model instance method
person.makeOlder();
console.log(person); // {id: '42', name: 'Marx', age: 201}

// set a model instance property
person.name = 'Rosa';
console.log(person); // {id: '42', name: 'Rosa', age: 201}
```

### Collection

Having a local instance of a model is really nice but you probably want to persist it to some database. Collections provide a bridge between raw data objects in a database and the class-based models.

Let's create a collection for people and connect it with a database:

```typescript
import { MongoClient } from 'mongodb';
import { MongoCollection } from 'octonom';

// create people collection
const people = new MongoCollection('people', Person, {modelIdField: 'id'});

// connect with to database
const db = await MongoClient.connect('mongodb://localhost:27017/mydb');

// init collection in database
await people.init(db);
```

Inserting and retrieving models is straight-forward:

```typescript
// insert a person
const karl = new Person({id: 'C4p1T4l', name: 'Marx', age: 200});
await people.insertOne(karl);

// retrieve a person
const foundPerson = await people.findById('C4p1T4l');

// foundPerson is again a model instance so we can call its methods
foundPerson.makeOlder();
console.log(foundPerson); // {id: 'C4p1T4l', name: 'Marx', age: 201}

// update a person
await people.update(foundPerson);
```

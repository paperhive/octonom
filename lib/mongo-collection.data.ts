import { cloneDeep } from 'lodash';

import { DiscussionModel, IDiscussion, IPerson, PersonModel } from './model.data';
import { MongoCollection } from './mongo-collection';
import { invertMap, rename } from './utils';

class DiscussionMongoCollection extends MongoCollection<IDiscussion, DiscussionModel> {
  protected static toDbMap = {id: '_id'};

  protected static fromDbMap = invertMap(DiscussionMongoCollection.toDbMap);

  public toDb(person: IDiscussion) {
    const doc = cloneDeep(person) as object;
    rename(doc, DiscussionMongoCollection.toDbMap);
    return doc;
  }

  public fromDb(doc: object) {
    const person = cloneDeep(doc);
    rename(doc, DiscussionMongoCollection.fromDbMap);
    return person as IDiscussion;
  }
}

class PeopleMongoCollection extends MongoCollection<IPerson, PersonModel> {
  protected static toDbMap = {id: '_id'};

  protected static fromDbMap = invertMap(PeopleMongoCollection.toDbMap);

  public toDb(person: IPerson) {
    const doc = cloneDeep(person) as object;
    rename(doc, PeopleMongoCollection.toDbMap);
    return doc;
  }

  public fromDb(doc: object) {
    const person = cloneDeep(doc);
    rename(doc, PeopleMongoCollection.fromDbMap);
    return person as IPerson;
  }
}

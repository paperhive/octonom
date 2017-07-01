import { cloneDeep } from 'lodash';

import { DiscussionModel, IDiscussion, IPerson, PersonModel } from './model.data';
import { MongoCollection } from './mongo-collection';
import { invertMap, rename } from './utils';

class DiscussionMongoCollection extends MongoCollection<IDiscussion, DiscussionModel> {
  protected static toDbMap = {id: '_id'};

  protected static fromDbMap = invertMap(DiscussionMongoCollection.toDbMap);

  public toDb(person: IDiscussion) {
    return rename(person, DiscussionMongoCollection.toDbMap);
  }

  public fromDb(doc: object) {
    return rename(doc, DiscussionMongoCollection.fromDbMap) as IDiscussion;
  }
}

class PeopleMongoCollection extends MongoCollection<IPerson, PersonModel> {
  protected static toDbMap = {id: '_id'};

  protected static fromDbMap = invertMap(PeopleMongoCollection.toDbMap);

  public toDb(person: IPerson) {
    return rename(person, PeopleMongoCollection.toDbMap);
  }

  public fromDb(doc: object) {
    return rename(doc, PeopleMongoCollection.fromDbMap) as IPerson;
  }
}

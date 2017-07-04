import { cloneDeep } from 'lodash';

import { DiscussionModel, IDiscussion, IPerson, PersonModel } from './model.data';
import { MongoCollection } from './mongo-collection';
import { invertMap, rename } from './utils';

class DiscussionMongoCollection extends MongoCollection<IDiscussion, DiscussionModel> {}

class PeopleMongoCollection extends MongoCollection<IPerson, PersonModel> {}

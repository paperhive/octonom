import { MongoCollection } from './collection';
import { DiscussionModel, PersonModel } from './model.data';

export const collections = {
  discussions: new MongoCollection('discussions', DiscussionModel),
  people: new MongoCollection('people', PersonModel),
};

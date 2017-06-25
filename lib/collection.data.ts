import { MongoCollection } from './collection';
import { discussionModel, personModel } from './model.data';

export const discussionCollection = new MongoCollection('discussions', discussionModel);
export const peopleCollection = new MongoCollection('people', personModel);

import { discussionCollection, peopleCollection } from './collection.data';
import { createModel } from './model';

interface IDiscussion {
  author: string | IPerson;
  title: string;
}

export const discussionModel = createModel<IDiscussion>({
  author: {type: 'reference', collection: peopleCollection},
  title: {type: 'string'},
});

interface IPerson {
  name: string;
}

export const personModel = createModel<IPerson>({
  name: {type: 'string', collection: discussionCollection},
});

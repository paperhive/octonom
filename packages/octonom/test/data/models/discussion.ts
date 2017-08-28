import { Model, utils } from '../../../lib/main';

import { collections } from '../collections';
import { IPerson, PersonModel } from './person';

export interface IDiscussion {
  id: string;
  author: string | IPerson;
  title: string;
}

export class DiscussionModel extends Model<IDiscussion> {
  @Model.PropertySchema({type: 'string', default: utils.generateId})
  public id: string;

  @Model.PropertySchema({type: 'reference', collection: () => collections.people})
  public author: string | PersonModel;

  @Model.PropertySchema({type: 'string'})
  public title: string;
}

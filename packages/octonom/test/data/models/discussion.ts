import { Model, utils } from '../../../lib/main';

import { collections } from '../collections';
import { PersonModel } from './person';

export class DiscussionModel extends Model<DiscussionModel> {
  @Model.PropertySchema({type: 'string', default: utils.generateId})
  public id: string;

  @Model.PropertySchema({type: 'reference', collection: () => collections.people})
  public author: string | Partial<PersonModel>;

  @Model.PropertySchema({type: 'string'})
  public title: string;
}

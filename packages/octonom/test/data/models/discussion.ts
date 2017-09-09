import { Model, utils } from '../../../lib/main';

import { collections } from '../collections';
import { PersonModel } from './person';

export class DiscussionModel extends Model {
  @Model.Property({type: 'string', default: utils.generateId})
  public id: string;

  @Model.Property({type: 'reference', collection: () => collections.people})
  public author: string | Partial<PersonModel>;

  @Model.Property({type: 'string'})
  public title: string;

  constructor(data?: Partial<DiscussionModel>) {
    super(data);
  }
}

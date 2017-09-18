import { Model, Property, utils } from '../../../lib/main';

import { collections } from '../collections';
import { PersonModel } from './person';

export class DiscussionModel extends Model {
  @Property.String({default: utils.generateId})
  public id: string;

  @Property.Reference({collection: () => collections.people})
  public author: string | Partial<PersonModel>;

  @Property.String()
  public title: string;

  constructor(data?: Partial<DiscussionModel>) {
    super(data);
  }
}

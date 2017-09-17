import { Model, ReferenceProperty, StringProperty, utils } from '../../../lib/main';

import { collections } from '../collections';
import { PersonModel } from './person';

export class DiscussionModel extends Model {
  @StringProperty({default: utils.generateId})
  public id: string;

  @ReferenceProperty({collection: () => collections.people})
  public author: string | Partial<PersonModel>;

  @StringProperty()
  public title: string;

  constructor(data?: Partial<DiscussionModel>) {
    super(data);
  }
}

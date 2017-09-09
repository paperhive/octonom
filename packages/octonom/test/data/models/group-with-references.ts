import { Model, utils } from '../../../lib/main';

import { collections } from '../collections';
import { PersonModel } from './person';

export class GroupWithReferencesModel extends Model {
  @Model.Property({type: 'string', default: utils.generateId})
  public id: string;

  @Model.Property({type: 'array', definition: {type: 'reference', collection: () => collections.people}})
  public members: Array<string | PersonModel>;

  constructor(data?: Partial<GroupWithReferencesModel>) {
    super(data);
  }
}

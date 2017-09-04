import { Model, utils } from '../../../lib/main';

import { collections } from '../collections';
import { PersonModel } from './person';

export class GroupWithReferencesModel extends Model<GroupWithReferencesModel> {
  @Model.PropertySchema({type: 'string', default: utils.generateId})
  public id: string;

  @Model.PropertySchema({type: 'array', definition: {type: 'reference', collection: () => collections.people}})
  public members: Array<string | PersonModel>;
}

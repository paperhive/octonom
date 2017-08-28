import { Model, utils } from '../../../lib/main';

import { collections } from '../collections';
import { IPerson, PersonModel } from './person';

export interface IGroupWithReferences {
  id: string;
  members: Array<string | PersonModel>;
}

export class GroupWithReferencesModel extends Model<IGroupWithReferences> {
  @Model.PropertySchema({type: 'string', default: utils.generateId})
  public id: string;

  @Model.PropertySchema({type: 'array', definition: {type: 'reference', collection: () => collections.people}})
  public members: Array<string | PersonModel>;
}

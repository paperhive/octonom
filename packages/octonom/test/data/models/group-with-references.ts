import { Model, utils } from '../../../lib/main';

import { PersonModel } from './person';

export interface IGroupWithReferences {
  id: string;
  members: Array<string | PersonModel>;
}

@Model.Options({primaryIdProperty: 'id'})
export class GroupWithReferencesModel extends Model<IGroupWithReferences> {
  @Model.PropertySchema({type: 'string', default: utils.generateId})
  public id: string;

  @Model.PropertySchema({type: 'array', definition: {type: 'reference', model: PersonModel, collectionName: 'people'}})
  public members: Array<string | PersonModel>;
}

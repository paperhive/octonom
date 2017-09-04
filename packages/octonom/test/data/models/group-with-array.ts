import { Model, ModelArray, utils } from '../../../lib/main';

import { PersonModel } from './person';

export class GroupWithArrayModel extends Model<GroupWithArrayModel> {
  @Model.PropertySchema({type: 'string', default: utils.generateId})
  public id: string;

  @Model.PropertySchema({type: 'array', definition: {type: 'model', model: PersonModel}})
  public members: ModelArray<PersonModel> | Array<Partial<PersonModel>>;
}

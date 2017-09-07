import { Model, ModelArray, utils } from '../../../lib/main';

import { PersonModel } from './person';

export class GroupWithArrayModel extends Model {
  @Model.Property({type: 'string', default: utils.generateId})
  public id: string;

  @Model.Property({type: 'array', definition: {type: 'model', model: PersonModel}})
  public members: ModelArray<PersonModel> | Array<Partial<PersonModel>>;
}

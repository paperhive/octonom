import { Model, ModelArray, utils } from '../../../lib/main';

import { IPerson, PersonModel } from './person';

export interface IGroupWithArray {
  id: string;
  members: ModelArray<IPerson, PersonModel> | Array<Partial<IPerson> | PersonModel>;
}

export class GroupWithArrayModel extends Model<IGroupWithArray> {
  @Model.PropertySchema({type: 'string', default: utils.generateId})
  public id: string;

  @Model.PropertySchema({type: 'array', definition: {type: 'model', model: PersonModel}})
  public members: ModelArray<IPerson, PersonModel> | Array<Partial<IPerson> | PersonModel>;
}

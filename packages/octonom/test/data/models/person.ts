import { Model, utils } from '../../../lib/main';

import { PersonAccountModel } from './person-account';

export class PersonModel extends Model<PersonModel> {
  @Model.PropertySchema({type: 'string', default: utils.generateId})
  public id: string;

  @Model.PropertySchema({type: 'string'})
  public name: string;

  @Model.PropertySchema({type: 'model', model: PersonAccountModel})
  public account?: Partial<PersonAccountModel>;
}

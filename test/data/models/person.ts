import { Model, utils } from '../../../lib/main';

import { IPersonAccount, PersonAccountModel } from './person-account';

export interface IPerson {
  id: string;
  name: string;
  account?: IPersonAccount;
}

export class PersonModel extends Model<IPerson> {
  @Model.PropertySchema({type: 'string', default: utils.generateId})
  public id: string;

  @Model.PropertySchema({type: 'string'})
  public name: string;

  @Model.PropertySchema({type: 'model', model: PersonAccountModel})
  public account?: PersonAccountModel | IPersonAccount;
}

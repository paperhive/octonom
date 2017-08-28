import { Model } from '../../../lib/main';

export interface IPersonAccount {
  username: string;
}

export class PersonAccountModel extends Model<IPersonAccount> {
  @Model.PropertySchema({type: 'string'})
  public username: string;
}

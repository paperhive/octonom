import { Model, StringProperty } from '../../../lib/main';

export class PersonAccountModel extends Model {
  @StringProperty()
  public username: string;

  constructor(data?: Partial<PersonAccountModel>) {
    super(data);
  }
}

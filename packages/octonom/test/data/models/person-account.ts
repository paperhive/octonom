import { Model, Property } from '../../../lib/main';

export class PersonAccountModel extends Model {
  @Property.String()
  public username: string;

  constructor(data?: Partial<PersonAccountModel>) {
    super(data);
  }
}

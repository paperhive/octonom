import { Model, Property, Schema, utils } from '../../../lib/main';

import { PersonModel } from './person';

export class GroupWithArrayModel extends Model {
  @Property.String({default: utils.generateId})
  public id: string;

  @Property.Array({elementSchema: new Schema.Model({model: PersonModel})})
  public members: Array<Partial<PersonModel>>;

  constructor(data?: Partial<GroupWithArrayModel>) {
    super(data);
  }
}

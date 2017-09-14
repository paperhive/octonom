import { ArrayProperty, Model, ModelArray, ModelSchema, StringProperty, utils } from '../../../lib/main';

import { PersonModel } from './person';

export class GroupWithArrayModel extends Model {
  @StringProperty({default: utils.generateId})
  public id: string;

  @ArrayProperty({elementSchema: new ModelSchema({model: PersonModel})})
  public members: ModelArray<PersonModel> | Array<Partial<PersonModel>>;

  constructor(data?: Partial<GroupWithArrayModel>) {
    super(data);
  }
}

import { Model, utils } from '../../../lib/main';

import { IPerson, PersonModel } from './person';

export interface IDiscussion {
  id: string;
  author: string | IPerson;
  title: string;
}

@Model.Options({primaryIdProperty: 'id'})
export class DiscussionModel extends Model<IDiscussion> {
  @Model.PropertySchema({type: 'string', default: utils.generateId})
  public id: string;

  @Model.PropertySchema({type: 'reference', model: PersonModel, collectionName: 'people'})
  public author: string | PersonModel;

  @Model.PropertySchema({type: 'string'})
  public title: string;
}

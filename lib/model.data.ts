import { Model } from './model';
import { ModelArray } from './model-array';
import { generateId } from './utils';

export interface ICat {
  id: string;
  name: string;
}

export class CatModel extends Model<ICat> {
  @Model.PropertySchema({type: 'string', default: generateId})
  public id: string;

  @Model.PropertySchema({type: 'string'})
  public name: string;

  public nonSchemaProperty: string;
}

export interface IPersonAccount {
  username: string;
}

export class PersonAccountModel extends Model<IPersonAccount> {
  @Model.PropertySchema({type: 'string'})
  public username: string;
}

export interface IPerson {
  id: string;
  name: string;
  account?: IPersonAccount;
}

export class PersonModel extends Model<IPerson> {
  @Model.PropertySchema({type: 'string', default: generateId})
  public id: string;

  @Model.PropertySchema({type: 'string'})
  public name: string;

  @Model.PropertySchema({type: 'model', model: PersonAccountModel})
  public account?: PersonAccountModel | IPersonAccount;
}

export interface IGroup {
  id: string;
  members: Array<Partial<IPerson> | PersonModel>;
}

export class GroupModel extends Model<IGroup> {
  @Model.PropertySchema({type: 'string', default: generateId})
  public id: string;

  @Model.PropertySchema({type: 'array', definition: {type: 'model', model: PersonModel}})
  public members: ModelArray<PersonModel> | Array<Partial<IPerson> | PersonModel>;
}

export interface IDiscussion {
  id: string;
  author: string | IPerson;
  title: string;
}

export class DiscussionModel extends Model<IDiscussion> {
  @Model.PropertySchema({type: 'string', default: generateId})
  public id: string;

  @Model.PropertySchema({type: 'reference', collection: undefined}) // TODO
  public author: string | PersonModel;

  @Model.PropertySchema({type: 'string'})
  public title: string;

  // public participants: string[] | PersonModel[];
}

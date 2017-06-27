import { Model } from './model';

interface IPersonAccount {
  username: string;
}

export class PersonAccountModel extends Model<IPersonAccount> {
  @Model.PropertySchema({type: 'string'})
  public username: string;
}

export interface IPerson {
  name: string;
  account?: IPersonAccount;
}

export class PersonModel extends Model<IPerson> {
  @Model.PropertySchema({type: 'string'})
  public name: string;

  @Model.PropertySchema({type: 'model', model: PersonAccountModel})
  public account?: PersonAccountModel | IPersonAccount;
}

export interface IDiscussion {
  author: string | IPerson;
  title: string;
}

export class DiscussionModel extends Model<IDiscussion> {
  @Model.PropertySchema({type: 'reference', collection: undefined}) // TODO
  public author: string | PersonModel;

  @Model.PropertySchema({type: 'string'})
  public title: string;

  // public participants: string[] | PersonModel[];
}

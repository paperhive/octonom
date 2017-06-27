import { CollectionModel } from './collection-model';
import { Model } from './model';
import { generateId } from './utils';

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

export class PersonModel extends CollectionModel<IPerson> {
  @CollectionModel.PropertySchema({type: 'string', default: generateId})
  public id: string;

  @CollectionModel.PropertySchema({type: 'string'})
  public name: string;

  @CollectionModel.PropertySchema({type: 'model', model: PersonAccountModel})
  public account?: PersonAccountModel | IPersonAccount;

  public getId() {
    return this.id;
  }
}

export interface IDiscussion {
  author: string | IPerson;
  title: string;
}

export class DiscussionModel extends CollectionModel<IDiscussion> {
  @CollectionModel.PropertySchema({type: 'string', default: generateId})
  public id: string;

  @Model.PropertySchema({type: 'reference', collection: undefined}) // TODO
  public author: string | PersonModel;

  @Model.PropertySchema({type: 'string'})
  public title: string;

  // public participants: string[] | PersonModel[];

  public getId() {
    return this.id;
  }
}

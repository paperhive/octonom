import { CollectionModel } from './collection-model';
import { generateId } from './utils';

export interface ICat {
  _id: string;
  name: string;
}

export class CatModel extends CollectionModel<ICat> {
  @CollectionModel.PropertySchema({type: 'string', default: generateId})
  public _id: string;

  @CollectionModel.PropertySchema({type: 'string'})
  public name: string;

  public getId() {
    return this._id;
  }
}

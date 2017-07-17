import { Collection } from './collection';
import { Model } from './model';

export class ReferenceArray<T extends object, TModel extends Model<T>> extends Array<TModel | string> {
  constructor(
    protected collection: Collection<T, TModel>,
    data: Array<TModel | string> = [],
  ) {
    super();
    data.forEach(element => this.push(element));
  }

  public populate() {
    // TODO
  }
}

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

  // TODO: what do we do with undefined? do we overwrite ids with undefined?
  public async populate() {
    const fetchModels = [];
    this.forEach((element, index) => {
      // already populated?
      if (element instanceof this.collection.model) {
        return;
      }

      fetchModels.push({index, id: element});
    });

    // fetch models
    const models = await this.collection.findByIds(fetchModels.map(fetchModel => fetchModel.id));

    // sort models into array
    fetchModels.forEach((fetchModel, index) => {
      this[fetchModel.index] = models[index];
    });
  }
}

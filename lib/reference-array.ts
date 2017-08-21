import { Collection } from './collection';
import { Model } from './model';

export class ReferenceArray<T extends object, TModel extends Model<T>> extends Array<TModel | string> {
  constructor(
    public readonly collection: Collection<T, TModel>,
    data: Array<TModel | string> = [],
  ) {
    super();
    data.forEach(element => this.push(element));
  }

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

    // throw if an id wasn't found
    // reason: otherwise we'd replace the id with undefined and this may get persisted to the db
    fetchModels.forEach((fetchModel, index) => {
      if (!models[index]) {
        throw new Error(`id ${fetchModel.id} not found`);
      }
    });

    // sort models into array
    fetchModels.forEach((fetchModel, index) => {
      this[fetchModel.index] = models[index];
    });
  }
}

export type ReferenceArrayProperty<I extends object, T extends Model<I>> = ReferenceArray<I, T> | Array<string | T>;

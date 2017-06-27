import { Model } from './model';

export abstract class CollectionModel<T> extends Model<T> {
  public abstract getId(): string;
}

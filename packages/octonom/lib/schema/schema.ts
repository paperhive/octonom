import { ValidationError } from '../errors';
import { IHooks } from '../hooks';
import { Model } from '../model';

export type Path = Array<string | number>;

export type PopulateReference = IPopulateMap | true;

export interface IPopulateMap {
  [k: string]: PopulateReference;
}

export interface IPopulateOptions {
  populateReference: PopulateReference;
}

export interface ISanitizeOptions {
  /** Set undefined values to defaults (if configured). Default is false. */
  defaults?: boolean;
  /** Unset all properties that are not provided in the data. Default is false. */
  replace?: boolean;
  /** Parent schema node */
  parent?: IParent;
}

export interface IToObjectOptions {
  /** Turn populated references into references */
  unpopulate?: boolean;
}

export interface IParent<T = any> {
  metaValue: MetaValue<any>;
  path: string | number;
}

export interface ISchemaOptions<TSchema> {
  required?: boolean;
  validate?(schema: TSchema): Promise<void>;
}

export interface IMetaValueConstructor<TSchema extends MetaValue<any> = MetaValue<any>> {
  new (value: any, schemaOptions: ISchemaOptions<TSchema>, sanitizeOptions: ISanitizeOptions): TSchema;
}

export type MetaValueFactory<TMetaValue extends MetaValue<any> = MetaValue<any>> =
  (value: any, sanitizeOptions: ISanitizeOptions) => TMetaValue;

export abstract class MetaValue<T> {
  public parent: IParent;

  constructor(
    public value: T,
    public schemaOptions: ISchemaOptions<MetaValue<T>>,
    sanitizeOptions: ISanitizeOptions,
  ) {
    this.parent = sanitizeOptions.parent;
  }

  /** Populate a value (possibly nested) */
  public async populate(options: IPopulateOptions): Promise<T> {
    throw new Error(`${this.constructor.name} is not populateable.`);
  }

  /** Create a plain object representation of the value. */
  public toObject(options: IToObjectOptions): T {
    return this.value;
  }

  /** Validate a value (e.g., used before saving an instance in a collection).
   *  The default implementation calls a custom validator if there is one provided in the
   *  schema options. Make sure to call this method in derived MetaValue classes.
   */
  public async validate(): Promise<void> {
    if (!this.schemaOptions.validate) {
      return;
    }

    try {
      await this.schemaOptions.validate(this);
    } catch (error) {
      if (error instanceof ValidationError) {
        error.reason = error.reason || 'custom';
        error.metaValue = this;
        throw error;
      }
      throw error;
    }
  }
}

export interface ISchemaMap {
  [field: string]: MetaValueFactory;
}

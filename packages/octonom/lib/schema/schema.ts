import { ValidationError } from '../errors';

export interface IPopulateMap {
  [k: string]: PopulateReference;
}

export interface ISanitizeOptions {
  /** Set undefined values to defaults (if configured). Default is false. */
  defaults?: boolean;
  /** Unset all properties that are not provided in the data. Default is false. */
  replace?: boolean;
  /** Parent schema node */
  parent?: ISchemaParent;
}

export interface ISchema<T, TSchemaInstance extends ISchemaInstance<T>> {
  options: ISchemaOptions<TSchemaInstance>;
  create(value: any, sanitizeOptions?: ISanitizeOptions): TSchemaInstance;
  populate?(instance: TSchemaInstance, populateReference: PopulateReference): Promise<TSchemaInstance>;
  toObject(instance: TSchemaInstance, toObjectOptions?: IToObjectOptions): T;
  validate(instance: TSchemaInstance): Promise<void>;
}

export interface ISchemaInstance<T = any> {
  parent?: ISchemaParent;
  schema: ISchema<T, ISchemaInstance<T>>;
  value: T;
}

export interface ISchemaOptions<TSchemaInstance extends ISchemaInstance<any>> {
  required?: boolean;
  validate?(instance: TSchemaInstance): Promise<void>;
}

export interface ISchemaParent<T = any> {
  instance: ISchemaParentInstance<T>;
  path: string | number;
}

export interface ISchemaParentInstance<T = any> extends ISchemaInstance<T> {
  beforeChange(path: Path, rawValue: any, oldInstance: ISchemaInstance<T>);
  afterChange(path: Path, rawValue: any, newInstance: ISchemaInstance<T>);
}

export interface IToObjectOptions {
  /** Turn populated references into references */
  unpopulate?: boolean;
}

export type Path = Array<string | number>;

export type PopulateReference = IPopulateMap | true;

export type SchemaInstanceMap<T extends object = object> = {[key in keyof T]?: ISchemaInstance};

export type SchemaMap<T extends object = object> = {[key in keyof T]: ISchema<any, any>};

export async function validate<TSchemaInstance extends ISchemaInstance>(
  schemaOptions: ISchemaOptions<TSchemaInstance>,
  instance: TSchemaInstance,
): Promise<void> {
  if (!schemaOptions.validate) {
    return;
  }

  try {
    await schemaOptions.validate(instance);
  } catch (error) {
    if (error instanceof ValidationError) {
      error.reason = error.reason || 'custom';
      error.parent = instance.parent;
      throw error;
    }
    throw error;
  }
}

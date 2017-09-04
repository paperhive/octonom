import { IModelConstructor, Model } from './model';

export interface ISchemaValueBase {
  type: string;
  required?: boolean;
}

export interface ISchemaValueAny extends ISchemaValueBase {
  type: 'any';
  default?: () => any;
  validate?(value: any, path: Array<string | number>, instance: Model<any>): Promise<void>;
}

export interface ISchemaValueArray extends ISchemaValueBase {
  type: 'array';
  definition: SchemaValue;
  minLength?: number;
  maxLength?: number;
  validate?(value: any[], path: Array<string | number>, instance: Model<any>): Promise<void>;
}

export interface ISchemaValueBoolean extends ISchemaValueBase {
  type: 'boolean';
  default?: boolean | (() => boolean);
  validate?(value: boolean, path: Array<string | number>, instance: Model<any>): Promise<void>;
}

export interface ISchemaValueDate extends ISchemaValueBase {
  type: 'date';
  default?: Date | (() => Date);
  min?: Date;
  max?: Date;
  validate?(value: Date, path: Array<string | number>, instance: Model<any>): Promise<void>;
}

export interface ISchemaValueModel extends ISchemaValueBase {
  type: 'model';
  model: IModelConstructor<Model<object>>;
  validate?(value: Model<object>, path: Array<string | number>, instance: Model<any>): Promise<void>;
}

export interface ISchemaValueNumber extends ISchemaValueBase {
  type: 'number';
  default?: number | (() => number);
  min?: number;
  max?: number;
  integer?: boolean;
  validate?(value: number, path: Array<string | number>, instance: Model<any>): Promise<void>;
}

export interface ISchemaValueObject extends ISchemaValueBase {
  type: 'object';
  definition: ISchemaMap;
  validate?(value: object, path: Array<string | number>, instance: Model<any>): Promise<void>;
}

export interface ISchemaValueReference extends ISchemaValueBase {
  type: 'reference';
  collection: () => any; // TODO
  validate?(value: any, path: Array<string | number>, instance: Model<any>): Promise<void>;
}

export interface ISchemaValueString extends ISchemaValueBase {
  type: 'string';
  default?: string | (() => string);
  enum?: string[];
  min?: number;
  max?: number;
  regex?: RegExp;
  validate?(value: string, path: Array<string | number>, instance: Model<any>): Promise<void>;
}

export type SchemaValue = ISchemaValueAny | ISchemaValueArray | ISchemaValueBoolean |
  ISchemaValueDate | ISchemaValueModel | ISchemaValueNumber | ISchemaValueObject |
  ISchemaValueReference | ISchemaValueString;

export interface ISchemaMap {
  [field: string]: SchemaValue;
}

export type SchemaMap = ISchemaMap;

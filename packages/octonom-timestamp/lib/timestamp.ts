import { Hooks, Model } from 'octonom';

export type Constructor<T = {}> = new (...args: any[]) => T;

// TODO: remove the interface wizardry when https://github.com/Microsoft/TypeScript/pull/15932
//       landed in a typescript release
export interface ITimestamp {
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimestampStatic {
  new (...args: any[]): ITimestamp;
}

export function Timestamp<T extends Constructor<Model>>(base: T): ITimestampStatic & T {
  const newClass = class extends base {
    public createdAt: Date;
    public updatedAt: Date;
  };

  // ideally we'd use the decorator on the property as usual but
  // typescript doesn't like this yet, see
  // https://github.com/Microsoft/TypeScript/issues/7342
  Model.Property({type: 'date'})(newClass.prototype, 'createdAt');
  Model.Property({type: 'date'})(newClass.prototype, 'updatedAt');
  Hooks<ITimestamp & Model>({
    afterSet: (instance: any, data) => {
      console.log('afterSet', instance, data)
      const date = new Date();

      const properties: {createdAt?: Date, updatedAt?: Date} = {};

      if (!instance.createdAt) {
        properties.createdAt = date;
      }

      // update if updatedAt isn't set or if the provided data doesn't set it
      if (!instance.updatedAt || Object.keys(data).indexOf('updatedAt') === -1) {
        properties.updatedAt = date;
      }

      if (instance.name !== 'lol') {
        instance.name = 'lol';
      }

      Object.assign(instance, properties);
    },
  })(newClass as any);

  return newClass;
}

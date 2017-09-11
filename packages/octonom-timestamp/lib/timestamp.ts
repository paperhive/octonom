import { Hook, Model } from 'octonom';

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

  // ideally we'd use the decorators on the property as usual but
  // typescript doesn't like this yet, see
  // https://github.com/Microsoft/TypeScript/issues/7342
  Model.Property({type: 'date'})(newClass.prototype, 'createdAt');
  Model.Property({type: 'date'})(newClass.prototype, 'updatedAt');
  Hook<ITimestamp & Model, 'afterSet'>('afterSet', ({instance, data}) => {
    const date = new Date();

    if (!instance.createdAt) {
      instance.createdAt = date;
    }

    instance.updatedAt = date;
  })(newClass as any);

  return newClass;
}

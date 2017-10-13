import { Hook, Model, Property } from 'octonom';

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
  Property.Date()(newClass.prototype, 'createdAt');
  Property.Date()(newClass.prototype, 'updatedAt');
  Hook<ITimestamp & Model, 'afterChange'>('afterChange', ({modelInstance, path, value}) => {
    const date = new Date();

    if (!modelInstance.createdAt) {
      modelInstance.set({createdAt: date}, {}, false);
    }

    if ((path.length !== 1 || path[0] !== 'updatedAt') &&
        (path.length > 0 || typeof value !== 'object' || value.updatedAt === undefined)
    ) {
      modelInstance.set({updatedAt: date}, {}, false);
    }
  })(newClass as any);

  return newClass;
}

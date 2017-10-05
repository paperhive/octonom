import { spy } from 'sinon';

import { CatModel } from '../test/data/models/cat';
import { Hooks, IChangeHookOptions } from './hooks';
import { StringSchema } from './schema/string';

describe('Hooks', () => {
  const cat = new CatModel();
  it('should copy handlers in the constructor', () => {
    const hooks = new Hooks<CatModel>();
    const handler = (options: IChangeHookOptions<CatModel>) => undefined;
    hooks.register('beforeChange', handler);
    const newHooks = new Hooks<CatModel>(hooks);
    expect((newHooks as any).handlers.beforeChange).to.eql([handler]);
  });

  it('should register and run a handler', () => {
    const hooks = new Hooks<CatModel>();
    const handler = spy();
    hooks.register('beforeChange', handler);
    const stringSchema = new StringSchema();
    const options: IChangeHookOptions<CatModel> = {
      path: ['name'],
      value: 'Yllim',
      modelInstance: cat,
      schemaInstance: stringSchema.create('name'),
    };
    hooks.run('beforeChange', options);
    expect(handler).to.be.calledOnce.and.calledWith(options);
  });
});

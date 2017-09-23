import { spy } from 'sinon';

import { CatModel } from '../test/data/models/cat';
import { Hooks, ISetHookOptions } from './hooks';

describe('Hooks', () => {
  const cat = new CatModel();
  it('should copy handlers in the constructor', () => {
    const hooks = new Hooks<CatModel>();
    const handler = (options: ISetHookOptions<CatModel>) => undefined;
    hooks.register('beforeSet', handler);
    const newHooks = new Hooks<CatModel>(hooks);
    expect((newHooks as any).handlers.beforeSet).to.eql([handler]);
  });

  it('should register and run a handler', () => {
    const hooks = new Hooks<CatModel>();
    const handler = spy();
    hooks.register('beforeSet', handler);
    const options = {instance: cat, path: [], data: {name: 'Yllim'}};
    hooks.run('beforeSet', options);
    expect(handler).to.be.calledOnce.and.calledWith(options);
  });
});

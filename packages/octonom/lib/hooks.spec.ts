import { spy } from 'sinon';

import { CatModel } from '../test/data/models/cat';
import { Hooks, IChangeHookOptions } from './hooks';

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
    const options = {modelPath: {instance: cat, path: ['name']}, data: 'Yllim'};
    hooks.run('beforeChange', options);
    expect(handler).to.be.calledOnce.and.calledWith(options);
  });
});

import compose from "./compose";
import { Middleware, MiddlewareAPI } from "./types/middleware";
import { AnyAction } from "./types/actions";
import { StoreEnhancer, StoreCreator, Dispatch } from "./types/store";
import { Reducer } from "./types/reducers";

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * 创建一个store增强器，应用中间件到redux store 中到dispatch方法
 * 这对各种任务都很方便，如用简单都方式表达异步action，或者在打印每次action的载体
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * redux-thunk 包就是redux中间件的一个例子
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * 因为中间件是潜在的异步，所以它应该在调用链的第一个store增强器
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * 每个中间件都会给dispatch和getState函数作为命名参数
 *
 * @param middlewares The middleware chain to be applied.
 * @returns A store enhancer applying the middleware.
 *
 * @template Ext Dispatch signature added by a middleware.
 * @template S The type of the state supported by a middleware.
 */
export default function applyMiddleware(): StoreEnhancer;
export default function applyMiddleware<Ext1, S>(
  middleware1: Middleware<Ext1, S, any>
): StoreEnhancer<{ dispatch: Ext1 }>;
export default function applyMiddleware<Ext1, Ext2, S>(
  middleware1: Middleware<Ext1, S, any>,
  middleware2: Middleware<Ext2, S, any>
): StoreEnhancer<{ dispatch: Ext1 & Ext2 }>;
export default function applyMiddleware<Ext1, Ext2, Ext3, S>(
  middleware1: Middleware<Ext1, S, any>,
  middleware2: Middleware<Ext2, S, any>,
  middleware3: Middleware<Ext3, S, any>
): StoreEnhancer<{ dispatch: Ext1 & Ext2 & Ext3 }>;
export default function applyMiddleware<Ext1, Ext2, Ext3, Ext4, S>(
  middleware1: Middleware<Ext1, S, any>,
  middleware2: Middleware<Ext2, S, any>,
  middleware3: Middleware<Ext3, S, any>,
  middleware4: Middleware<Ext4, S, any>
): StoreEnhancer<{ dispatch: Ext1 & Ext2 & Ext3 & Ext4 }>;
export default function applyMiddleware<Ext1, Ext2, Ext3, Ext4, Ext5, S>(
  middleware1: Middleware<Ext1, S, any>,
  middleware2: Middleware<Ext2, S, any>,
  middleware3: Middleware<Ext3, S, any>,
  middleware4: Middleware<Ext4, S, any>,
  middleware5: Middleware<Ext5, S, any>
): StoreEnhancer<{ dispatch: Ext1 & Ext2 & Ext3 & Ext4 & Ext5 }>;
export default function applyMiddleware<Ext, S = any>(
  ...middlewares: Middleware<any, S, any>[]
): StoreEnhancer<{ dispatch: Ext }>;
/**
 * applyMiddleware函数接收middleware为参数
 * 返回另一个函数，这个函数需要接收createStore为函数，这个处理是在createStore中进行的
 *
 * 这里是使用接收当createStore函数，把store创建出来
 * 然后把dispatch和getStore传给中间件函数
 * 使用compose把已经有dispatch和getStore方法当中间件组合后，将dispatch传入，得到一个新的dispatch
 * 新的dispatch是经过了中间件的dispatch
 *
 */
export default function applyMiddleware(
  ...middlewares: Middleware[]
): StoreEnhancer<any> {
  return (createStore: StoreCreator) => <S, A extends AnyAction>(
    reducer: Reducer<S, A>,
    ...args: any[]
  ) => {
    const store = createStore(reducer, ...args);
    // 这里做一个错误处理
    // 如果在绑定中间件的时候调用dispatch会报错
    let dispatch: Dispatch = () => {
      throw new Error(
        "Dispatching while constructing your middleware is not allowed. " +
          "Other middleware would not be applied to this dispatch."
      );
    };

    const middlewareAPI: MiddlewareAPI = {
      getState: store.getState,
      dispatch: (action, ...args) => dispatch(action, ...args)
    };
    // 将dispatch和getStore方法传入中间件，得到新的数组
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    // 将新的数组用compose绑定起来，再把store.dispatch传入，得到新的dispatch
    dispatch = compose<typeof dispatch>(...chain)(store.dispatch);
    // 返回新的dispatch，这个dispatch会触发中间件
    return {
      ...store,
      dispatch
    };
  };
}

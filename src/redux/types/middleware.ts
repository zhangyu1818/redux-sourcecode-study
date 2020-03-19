import { Dispatch } from "./store";

export interface MiddlewareAPI<D extends Dispatch = Dispatch, S = any> {
  dispatch: D;
  getState(): S;
}

/**
 * A middleware is a higher-order function that composes a dispatch function
 * to return a new dispatch function. It often turns async actions into
 * actions.
 *
 * 中间件是一个高阶函数，组合一个dispatch函数，返回一个新的dispatch函数
 * 通常将异步的actions转为actions
 *
 * Middleware is composable using function composition. It is useful for
 * logging actions, performing side effects like routing, or turning an
 * asynchronous API call into a series of synchronous actions.
 *
 * 中间件是通过函数组合的，它用于进行action的log，执行副作用像是路由，或者将一个异步调用的api转为同步action
 *
 * @template DispatchExt Extra Dispatch signature added by this middleware.
 * @template S The type of the state supported by this middleware.
 * @template D The type of Dispatch of the store where this middleware is
 *   installed.
 *
 *   中间件函数首先会接收dispatch和getStore方法，然后返回一个新的函数
 *   这时候新的函数是能够使用dispatch和个体Store函数的，这个函数才是真正的中间件处理函数
 */
export interface Middleware<
  _DispatchExt = {}, // TODO: remove unused component (breaking change)
  S = any,
  D extends Dispatch = Dispatch
> {
  (api: MiddlewareAPI<D, S>): (
    next: D
  ) => (action: D extends Dispatch<infer A> ? A : never) => any;
}

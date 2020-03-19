/**
 * An *action* is a plain object that represents an intention to change the
 * state. Actions are the only way to get data into the store. Any data,
 * whether from UI events, network callbacks, or other sources such as
 * WebSockets needs to eventually be dispatched as actions.
 *
 * 一个action是一个字面量对象，意思是代表改变state
 * actions是将值放入store的唯一方法
 * 任何数据，无论是来自ui events，network callbacks，或者是其他来源像是 WebSockets
 * 都需要dispatch一个action
 *
 * Actions must have a `type` field that indicates the type of action being
 * performed. Types can be defined as constants and imported from another
 * module. It's better to use strings for `type` than Symbols because strings
 * are serializable.
 *
 * action必须有一个`type`字段代表这个type的action将要被执行
 * types可以被定义为常量并且从另外一个模块引入
 * 用string类型来做type比symbols更好，因为string可以被序列化
 *
 * Other than `type`, the structure of an action object is really up to you.
 * If you're interested, check out Flux Standard Action for recommendations on
 * how actions should be constructed.
 *
 * 除了type，action对象的结构取决于你
 *
 * @template T the type of the action's `type` tag.
 */
export interface Action<T = any> {
  type: T;
}

/**
 * An Action type which accepts any other properties.
 * This is mainly for the use of the `Reducer` type.
 * This is not part of `Action` itself to prevent types that extend `Action` from
 * having an index signature.
 *
 * 接受任何属性action的类型
 * 主要用于reducer的类型
 *
 */
export interface AnyAction extends Action {
  // Allows any extra properties to be defined in an action.
  [extraProps: string]: any;
}

/* action creators */

/**
 * An *action creator* is, quite simply, a function that creates an action. Do
 * not confuse the two terms—again, an action is a payload of information, and
 * an action creator is a factory that creates an action.
 *
 * 一个 action creator是一个非常简单的函数，用来创建action
 * 不要混淆了这两个概念
 * 一个action是信息的载体，一个action creator是一个创造action的工厂
 *
 * action
 * { type: "add" }
 *
 * action creator
 * const addAction = () => ({ type: "add" })
 *
 *
 * Calling an action creator only produces an action, but does not dispatch
 * it. You need to call the store's `dispatch` function to actually cause the
 * mutation. Sometimes we say *bound action creators* to mean functions that
 * call an action creator and immediately dispatch its result to a specific
 * store instance.
 *
 * 调用 action creator 只会产生一个action，你需要调用store的dispatch方法来改变
 * 有时候我们说 bound action creators
 * 意思是一个调用 action creator 并且将它的返回值通过dispatch调用的特殊函数
 *
 * If an action creator needs to read the current state, perform an API call,
 * or cause a side effect, like a routing transition, it should return an
 * async action instead of an action.
 *
 * 如果一个action creator需要读取当前的state，执行一个api调用或者是其他副作用
 * 比如路由过渡，它需要返回异步action而不是一个action
 *
 * @template A Returned action type.
 */
export interface ActionCreator<A> {
  (...args: any[]): A;
}

/**
 * Object whose values are action creator functions.
 */
export interface ActionCreatorsMapObject<A = any> {
  [key: string]: ActionCreator<A>;
}

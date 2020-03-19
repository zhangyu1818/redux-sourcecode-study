import $$observable from "./utils/symbol-observable";

import {
  Store,
  PreloadedState,
  StoreEnhancer,
  Dispatch,
  Observer,
  ExtendState
} from "./types/store";
import { Action } from "./types/actions";
import { Reducer } from "./types/reducers";
import ActionTypes from "./utils/actionTypes";
import isPlainObject from "./utils/isPlainObject";

/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * 创建一个redux store来保持state tree，改变store里数据的唯一方式是调用dispatch()函数
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * 在你的app里应该只有一个store，要指定state tree响应不同的actions
 * 你需要将多个reducers函数使用combineReducers方法来组合为一个reducer函数
 *
 * @param reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * 参数 reducer 是一个函数，给定当前的state tree和一个action，返回下一个state tree
 *
 * @param preloadedState The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * 参数 preloadedState 是初始值，这是可选参数。它可以在ssr时从服务器同构state（也许是这个意思，看不太懂）
 * 或者是还原上一次序列化的用户会话
 *
 * @param enhancer The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 *
 * 参数 enhancer是store的增强器，可选参数。
 * 它可以使用第三方功能增强store，比如middleware中间件，时间旅行等等…
 * redux唯一自带的store增强器是applyMiddleware()，它可以增强dispatch的功能
 *
 * @returns A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 *
 * 返回值 是一个Redux store，它允许你读取state，dispatch actions，订阅state的改变
 */
// ts的重载
export default function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext;
export default function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext;
export default function createStore<
  S,
  A extends Action,
  Ext = {},
  StateExt = never
>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S> | StoreEnhancer<Ext, StateExt>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext {
  if (
    (typeof preloadedState === "function" && typeof enhancer === "function") ||
    (typeof enhancer === "function" && typeof arguments[3] === "function")
  ) {
    // 也许传入了多个store增强器，这是不支持的，应该把它们组合到一个函数
    throw new Error(
      "It looks like you are passing several store enhancers to " +
        "createStore(). This is not supported. Instead, compose them " +
        "together to a single function."
    );
  }

  if (typeof preloadedState === "function" && typeof enhancer === "undefined") {
    // 这是没有传入preloadedState，但是传入了enhancer的情况
    enhancer = preloadedState as StoreEnhancer<Ext, StateExt>;
    preloadedState = undefined;
  }

  // 如果传入了enhancer
  if (typeof enhancer !== "undefined") {
    if (typeof enhancer !== "function") {
      // 但是类型不对
      throw new Error("Expected the enhancer to be a function.");
    }

    // 将createStore交给增强器enhancer处理
    return enhancer(createStore)(
      reducer,
      preloadedState as PreloadedState<S>
    ) as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext;
  }

  // reducer必须是一个函数
  if (typeof reducer !== "function") {
    throw new Error("Expected the reducer to be a function.");
  }

  // 当前的reducer
  let currentReducer = reducer;
  // 当前的state
  let currentState = preloadedState as S;
  // 当前的listeners
  let currentListeners: (() => void)[] | null = [];
  // 下一次的listeners
  let nextListeners = currentListeners;
  // 标示是否正在进行dispatch
  let isDispatching = false;

  /**
   * This makes a shallow copy of currentListeners so we can use
   * nextListeners as a temporary list while dispatching.
   *
   * 这是一个对currentListeners的浅复制，所以我们可以将nextListeners当作一个临时的list在dispatch的过程中使用
   *
   * This prevents any bugs around consumers calling
   * subscribe/unsubscribe in the middle of a dispatch.
   *
   * 这样做的目的是可以防止在dispatch调用过程中
   * 调用subscribe/unsubscribe产生错误
   */
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      // 浅复制
      nextListeners = currentListeners.slice();
    }
  }

  /**
   * Reads the state tree managed by the store.
   *
   * 获取state tree
   *
   * @returns The current state tree of your application.
   */
  function getState(): S {
    // 在dispatch过程中不能调用getState
    if (isDispatching) {
      throw new Error(
        "You may not call store.getState() while the reducer is executing. " +
          "The reducer has already received the state as an argument. " +
          "Pass it down from the top reducer instead of reading it from the store."
      );
    }

    return currentState as S;
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * 添加一个state change的监听，它会在每次dispatch调用结束后并且一部分state tree可能被改变时调用
   * 你可以在这个callback里调用getState()来获取当前的state tree
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   *
   * 你也可以在change监听里调用dispatch()，不过需要注意
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 1. subscriptions只是每次调用dispatch()之前的快照，所以如果你在listeners被调用时
   * 进行subscribe或者unsubscribe操作都不会对当前正在进行的dispatch产生任何的副作用
   * 但是，下一次不管有没有嵌套调用dispatch()，都会使用最新的subscription的快照
   * （也就是说在listener里退订，不会对当前dispatch的订阅列表造成影响，只会对下一次dispatch的订阅列表作出改变）
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   *
   * todo 什么意思
   *
   * @param listener A callback to be invoked on every dispatch.
   *
   * 参数 listener 是一个回调函数，每次dispatch的时候都会被调用
   *
   * @returns A function to remove this change listener.
   *
   * 返回值是一个函数，用来退订
   */
  function subscribe(listener: () => void) {
    // 不是函数报错
    if (typeof listener !== "function") {
      throw new Error("Expected the listener to be a function.");
    }

    // 不能在dispatch的过程中添加订阅
    if (isDispatching) {
      throw new Error(
        "You may not call store.subscribe() while the reducer is executing. " +
          "If you would like to be notified after the store has been updated, subscribe from a " +
          "component and invoke store.getState() in the callback to access the latest state. " +
          "See https://redux.js.org/api-reference/store#subscribelistener for more details."
      );
    }
    // 标志已经被订阅
    let isSubscribed = true;

    // 浅复制一次listeners
    // 也就是currentListeners复制到nextListeners
    ensureCanMutateNextListeners();
    // 添加进nextListeners
    nextListeners.push(listener);

    // 返回的退订函数
    return function unsubscribe() {
      // 如果已经退订了，就return
      // 防止多次调用函数
      if (!isSubscribed) {
        return;
      }

      // 在dispatch过程中不能退订
      if (isDispatching) {
        throw new Error(
          "You may not unsubscribe from a store listener while the reducer is executing. " +
            "See https://redux.js.org/api-reference/store#subscribelistener for more details."
        );
      }
      // 已经退订
      isSubscribed = false;
      // 浅复制一次
      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      // 删除掉订阅的函数
      nextListeners.splice(index, 1);
      // currentListeners设置为null的原因
      // 见https://github.com/reduxjs/redux/issues/3474
      // todo 还是没看懂
      currentListeners = null;
    };
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * dispatch一个action，这是触发state改变的唯一方式
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * reducer函数，用来创建一个store，调用时接收当前的state tree和action，返回下一个state tree
   * 同时会通知所有的change listeners
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * 它只实现了基础的字面量对象action操作，如果你想要dispatch一个Promise、Observable、thunk获取其他的
   * 你需要将创建store的函数放进响应的中间件，比如redux-thunk包
   *
   * @param action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * 参数 action 是一个字面量对象，表示"想要改变"，保持actions序列化可以记录或重播用户会话
   * 或者使用redux-devtools来进行时间旅行，一个action必须有不为undefined的type属性
   *
   * @returns For convenience, the same action object you dispatched.
   *
   * 返回值 为了方便返回相同的action对象
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   *
   * 如果你使用来自定义的中间件，可能会返回其他的东西，比如Promise
   */
  function dispatch(action: A) {
    // action必须是字面量对象
    if (!isPlainObject(action)) {
      throw new Error(
        "Actions must be plain objects. " +
          "Use custom middleware for async actions."
      );
    }

    // action 必须有type
    if (typeof action.type === "undefined") {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
          "Have you misspelled a constant?"
      );
    }

    // reducer不能调用dispatch
    if (isDispatching) {
      throw new Error("Reducers may not dispatch actions.");
    }

    try {
      isDispatching = true;
      // 通过reducer获取下一个state
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    // 通知所有listeners
    const listeners = (currentListeners = nextListeners);
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }

    return action;
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * 替换store当前使用的reducer来计算state
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * 如果你的app实现了代码分割，并且你想动态的加载某些reducers，或者实现来redux的热重载，就需要这个方法
   *
   * @param nextReducer The reducer for the store to use instead.
   *
   * 参数 nextReducer 新的reducer
   *
   * @returns The same store instance with a new reducer in place.
   *
   * 返回替换来reducer的相同store实例
   */
  function replaceReducer<NewState, NewActions extends A>(
    nextReducer: Reducer<NewState, NewActions>
  ): Store<ExtendState<NewState, StateExt>, NewActions, StateExt, Ext> & Ext {
    // 必须是一个函数
    if (typeof nextReducer !== "function") {
      throw new Error("Expected the nextReducer to be a function.");
    }

    // TODO: do this more elegantly
    ((currentReducer as unknown) as Reducer<
      NewState,
      NewActions
    >) = nextReducer;

    // This action has a similar effect to ActionTypes.INIT.
    // Any reducers that existed in both the new and old rootReducer
    // will receive the previous state. This effectively populates
    // the new state tree with any relevant data from the old one.
    //
    // 这个action和ActionTypes.INIT有相同的作用
    // 任何存在的reducers不管新的旧的都会接收上一次的state
    // 这将有效的将旧state tree里的数据填充到新的里面
    dispatch({ type: ActionTypes.REPLACE } as A);
    // change the type of the store by casting it to the new store
    return (store as unknown) as Store<
      ExtendState<NewState, StateExt>,
      NewActions,
      StateExt,
      Ext
    > &
      Ext;
  }

  /**
   * Interoperability point for observable/reactive libraries.
   * 提供给observable/reactive库的接口
   * @returns A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/tc39/proposal-observable
   */
  function observable() {
    const outerSubscribe = subscribe;
    return {
      /**
       * The minimal observable subscription method.
       * @param observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe(observer: unknown) {
        if (typeof observer !== "object" || observer === null) {
          throw new TypeError("Expected the observer to be an object.");
        }

        function observeState() {
          const observerAsObserver = observer as Observer<S>;
          if (observerAsObserver.next) {
            observerAsObserver.next(getState());
          }
        }

        observeState();
        const unsubscribe = outerSubscribe(observeState);
        return { unsubscribe };
      },

      [$$observable]() {
        return this;
      }
    };
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  // 当store创建好了，会派发一个INIT的action，这样所有的reducer都会返回它们的初始值
  // 有效填充了初始的state tree
  dispatch({ type: ActionTypes.INIT } as A);

  const store = ({
    dispatch: dispatch as Dispatch<A>,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  } as unknown) as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext;
  // 返回store
  return store;
}

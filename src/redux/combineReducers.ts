import { Reducer } from "./types/reducers";
import { AnyAction, Action } from "./types/actions";
import ActionTypes from "./utils/actionTypes";
import warning from "./utils/warning";
import isPlainObject from "./utils/isPlainObject";
import {
  ReducersMapObject,
  StateFromReducersMapObject,
  ActionFromReducersMapObject
} from "./types/reducers";
import { CombinedState } from "./types/store";

// 如果reducer返回了undefined
function getUndefinedStateErrorMessage(key: string, action: Action) {
  const actionType = action && action.type;
  const actionDescription =
    (actionType && `action "${String(actionType)}"`) || "an action";

  return (
    `Given ${actionDescription}, reducer "${key}" returned undefined. ` +
    `To ignore an action, you must explicitly return the previous state. ` +
    `If you want this reducer to hold no value, you can return null instead of undefined.`
  );
}

function getUnexpectedStateShapeWarningMessage(
  inputState: object,
  reducers: ReducersMapObject,
  action: Action,
  unexpectedKeyCache: { [key: string]: true }
) {
  const reducerKeys = Object.keys(reducers);
  // 判断当前的state是初始化的还是上一次的
  const argumentName =
    action && action.type === ActionTypes.INIT
      ? "preloadedState argument passed to createStore"
      : "previous state received by the reducer";

  // 如果reducer对象是空的
  if (reducerKeys.length === 0) {
    return (
      "Store does not have a valid reducer. Make sure the argument passed " +
      "to combineReducers is an object whose values are reducers."
    );
  }

  // 判断是不是字面量对象
  if (!isPlainObject(inputState)) {
    const match = Object.prototype.toString
      .call(inputState)
      .match(/\s([a-z|A-Z]+)/);
    const matchType = match ? match[1] : "";
    return (
      `The ${argumentName} has unexpected type of "` +
      matchType +
      `". Expected argument to be an object with the following ` +
      `keys: "${reducerKeys.join('", "')}"`
    );
  }

  const unexpectedKeys = Object.keys(inputState).filter(
    key => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]
  );

  unexpectedKeys.forEach(key => {
    unexpectedKeyCache[key] = true;
  });

  // 在replace reducers的时候可能会出现key和state对应不上的情况，所以return
  if (action && action.type === ActionTypes.REPLACE) return;

  if (unexpectedKeys.length > 0) {
    return (
      `Unexpected ${unexpectedKeys.length > 1 ? "keys" : "key"} ` +
      `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
      `Expected to find one of the known reducer keys instead: ` +
      `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
    );
  }
}

/**
 * 这个函数用来检测每一个reducer函数是否符合要求
 * 1. 传入redux的init type 需要返回正确的初始值
 * 2. 传入未知的type，不能返回undefined
 *
 * 如果出现错误会抛出异常，会被外层的try catch捕获
 * @param reducers
 */
function assertReducerShape(reducers: ReducersMapObject) {
  // 循环每一个键
  Object.keys(reducers).forEach(key => {
    // 当前键名的reducer函数
    const reducer = reducers[key];
    // 获取初始化的state
    const initialState = reducer(undefined, { type: ActionTypes.INIT });

    // 如果没有传入初始state就报错
    if (typeof initialState === "undefined") {
      throw new Error(
        `Reducer "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      );
    }

    // 用来判断传入未知的type会不会返回undefined
    if (
      typeof reducer(undefined, {
        type: ActionTypes.PROBE_UNKNOWN_ACTION()
      }) === "undefined"
    ) {
      throw new Error(
        `Reducer "${key}" returned undefined when probed with a random type. ` +
          `Don't try to handle ${ActionTypes.INIT} or other actions in "redux/*" ` +
          `namespace. They are considered private. Instead, you must return the ` +
          `current state for any unknown actions, unless it is undefined, ` +
          `in which case you must return the initial state, regardless of the ` +
          `action type. The initial state may not be undefined, but can be null.`
      );
    }
  });
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * 将值是不同reducer函数的对象转换为一个reducer函数，它会调用每个reducer，并且将它们返回
 * 的结果放入一个state对象，这个对象的key和传入的reducer函数对象的key是对应的
 *
 * @template S Combined state object type.
 *
 * @param reducers An object whose values correspond to different reducer
 *   functions that need to be combined into one. One handy way to obtain it
 *   is to use ES6 `import * as reducers` syntax. The reducers may never
 *   return undefined for any action. Instead, they should return their
 *   initial state if the state passed to them was undefined, and the current
 *   state for any unrecognized action.
 *
 *   参数 reducers 一个需要组合为一个的值对应不同reducer函数的对象，一种方便的方法是使用
 *   ES6的import * as reducers语法，reducers在传入任何action的情况下都不应该返回undefined
 *   相反，如果传给它们的state是undefined，它们需要返回它们的初始state，对于任何无法识别的
 *   action都应该返回它们当前的state
 *
 * @returns A reducer function that invokes every reducer inside the passed
 *   object, and builds a state object with the same shape.
 *
 *   返回值 一个reducer函数，它会调用传入对象的每个reducer函数，并且创建一个有相同key结构的state对象
 */
export default function combineReducers<S>(
  reducers: ReducersMapObject<S, any>
): Reducer<CombinedState<S>>;
export default function combineReducers<S, A extends Action = AnyAction>(
  reducers: ReducersMapObject<S, A>
): Reducer<CombinedState<S>, A>;
export default function combineReducers<M extends ReducersMapObject<any, any>>(
  reducers: M
): Reducer<
  CombinedState<StateFromReducersMapObject<M>>,
  ActionFromReducersMapObject<M>
>;
export default function combineReducers(reducers: ReducersMapObject) {
  // 获取传入的reducers对象的keys
  const reducerKeys = Object.keys(reducers);
  // 实际使用的reducers对象
  const finalReducers: ReducersMapObject = {};
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i];

    if (process.env.NODE_ENV !== "production") {
      // 判断每个key有没有对应的值
      if (typeof reducers[key] === "undefined") {
        warning(`No reducer provided for key "${key}"`);
      }
    }

    // 会清除掉无关紧要的不是undefined，也不是函数的值

    // key对应的值需要是reducer函数
    if (typeof reducers[key] === "function") {
      // 做一层浅拷贝
      finalReducers[key] = reducers[key];
    }
  }
  // 获取reducers的key
  const finalReducerKeys = Object.keys(finalReducers);

  // This is used to make sure we don't warn about the same
  // keys multiple times.
  // 确保不会对相同的key发出多次警告
  let unexpectedKeyCache: { [key: string]: true };
  if (process.env.NODE_ENV !== "production") {
    unexpectedKeyCache = {};
  }

  let shapeAssertionError: Error;
  // 判断reducer是否符合要求
  try {
    assertReducerShape(finalReducers);
  } catch (e) {
    shapeAssertionError = e;
  }

  // 返回的合并为一个的reducer函数
  return function combination(
    state: StateFromReducersMapObject<typeof reducers> = {},
    action: AnyAction
  ) {
    // 如果reducer不符合要求，抛出异常
    // 上面不写try catch就抛出了，在下面抛出的意义难道是调用时才报错？
    if (shapeAssertionError) {
      throw shapeAssertionError;
    }

    if (process.env.NODE_ENV !== "production") {
      // 检查state
      const warningMessage = getUnexpectedStateShapeWarningMessage(
        state,
        finalReducers,
        action,
        unexpectedKeyCache
      );
      if (warningMessage) {
        warning(warningMessage);
      }
    }

    // 标示state有没有改变
    let hasChanged = false;
    // 经过reducer处理的下一次state
    const nextState: StateFromReducersMapObject<typeof reducers> = {};
    // 循环调用每一个reducer函数
    for (let i = 0; i < finalReducerKeys.length; i++) {
      // 当前reducer的key
      const key = finalReducerKeys[i];
      // 当前reducer的函数
      const reducer = finalReducers[key];
      // 当前key对应的state的值
      const previousStateForKey = state[key];
      // 经过reducer函数后的下一此state值
      const nextStateForKey = reducer(previousStateForKey, action);
      // reducer不能返回undefined
      if (typeof nextStateForKey === "undefined") {
        const errorMessage = getUndefinedStateErrorMessage(key, action);
        throw new Error(errorMessage);
      }
      // 当前key的值赋值给state对象
      nextState[key] = nextStateForKey;
      // 如果当前key的state和上一次的state不同，说明state就已经改变了
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    // 如果replace了reducers，可能会需要判断key的length
    // https://github.com/reduxjs/redux/issues/3488
    hasChanged =
      hasChanged || finalReducerKeys.length !== Object.keys(state).length;
    return hasChanged ? nextState : state;
  };
}

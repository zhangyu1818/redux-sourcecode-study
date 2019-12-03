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
  // 当前的state是哪里来的
  const argumentName =
    action && action.type === ActionTypes.INIT
      ? "preloadedState argument passed to createStore"
      : "previous state received by the reducer";

  // todo 为什么不在[assertReducerShape]函数判断reducerObject是不是空的？
  if (reducerKeys.length === 0) {
    return (
      "Store does not have a valid reducer. Make sure the argument passed " +
      "to combineReducers is an object whose values are reducers."
    );
  }

  // 判断是不是字面量对象
  // 如果传入了preloadedState不是字面量，会报错
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
 * 将一个值是不同reducer函数的对象转为单个reducer函数
 * 它会调用每个子reducer，并且把值聚集到一个state对象里，这个对象的键对应reducer函数的键
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
 *  将一个值对应不同的reducer函数的对象，将它合并成一个reducers
 *  reducers永远不会的对任何action返回undefined
 *  它会返回初始state如果state是undefined，对于无法识别的action会返回当前的state
 *
 * @returns A reducer function that invokes every reducer inside the passed
 *   object, and builds a state object with the same shape.
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
  // 先获取reducers对象的键名
  const reducerKeys = Object.keys(reducers);
  const finalReducers: ReducersMapObject = {};
  for (let i = 0; i < reducerKeys.length; i++) {
    // 当前键名
    const key = reducerKeys[i];

    if (process.env.NODE_ENV !== "production") {
      if (typeof reducers[key] === "undefined") {
        warning(`No reducer provided for key "${key}"`);
      }
    }

    // 浅拷贝一次reducers对象
    // 防止修改了reducers后引用也改变了
    if (typeof reducers[key] === "function") {
      finalReducers[key] = reducers[key];
    }
  }
  const finalReducerKeys = Object.keys(finalReducers);

  // This is used to make sure we don't warn about the same
  // keys multiple times.
  // 用来记录重复的键，确保不会重复输出相同的键名的提醒
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
  return function combination(
    state: StateFromReducersMapObject<typeof reducers> = {},
    action: AnyAction
  ) {
    // 如果reducer不符合要求，抛出异常
    // todo 为什么要在下面抛出异常？
    if (shapeAssertionError) {
      throw shapeAssertionError;
    }

    // 如果state的键和reducers的键对不上，会报错
    if (process.env.NODE_ENV !== "production") {
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
    // 标识state是否改变，改变了就返回新的state，否则返回传入的state
    let hasChanged = false;
    const nextState: StateFromReducersMapObject<typeof reducers> = {};
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i];
      // 当前key对应的reducer函数
      const reducer = finalReducers[key];
      // 上一次state对应的key的值
      const previousStateForKey = state[key];
      // 用reducer函数和action得到下一次state的值
      const nextStateForKey = reducer(previousStateForKey, action);
      // 当前key对应的state通过reducer后是undefined的时候报错
      if (typeof nextStateForKey === "undefined") {
        const errorMessage = getUndefinedStateErrorMessage(key, action);
        throw new Error(errorMessage);
      }
      // 把值赋给nextState
      nextState[key] = nextStateForKey;
      // nextStateForKey和previousStateForKey的值正常应该不想等
      // 所以hasChanged = true
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    hasChanged =
      hasChanged || finalReducerKeys.length !== Object.keys(state).length;
    return hasChanged ? nextState : state;
  };
}

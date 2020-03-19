import { Dispatch } from "./types/store";
import {
  AnyAction,
  ActionCreator,
  ActionCreatorsMapObject
} from "./types/actions";

function bindActionCreator<A extends AnyAction = AnyAction>(
  actionCreator: ActionCreator<A>,
  dispatch: Dispatch
) {
  return function(this: any, ...args: any[]) {
    return dispatch(actionCreator.apply(this, args));
  };
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 *
 * 将一个值是action creators的对象转为另一个有相同的键名的新对象
 * 这个新对象的action creators会包含在dispatch里，所以你可以直接调用
 * 这只是一个简便方法，你也可以像`store.dispatch(MyActionCreators.doSomething())`一样调用
 *
 * For convenience, you can also pass an action creator as the first argument,
 * and get a dispatch wrapped function in return.
 *
 * 为了方便，你也可以直接将一个action creator函数作为第一个参数
 *
 * @param actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 *
 * @param dispatch The `dispatch` function available on your Redux
 * store.
 *
 * @returns The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 *
 * 返回一个和原来对象相似的对象，但是每一个action creator都会包在dispatch里
 * 如果你传入的是一个函数，那么返回值同样是一个函数
 */
export default function bindActionCreators<A, C extends ActionCreator<A>>(
  actionCreator: C,
  dispatch: Dispatch
): C;

export default function bindActionCreators<
  A extends ActionCreator<any>,
  B extends ActionCreator<any>
>(actionCreator: A, dispatch: Dispatch): B;

export default function bindActionCreators<
  A,
  M extends ActionCreatorsMapObject<A>
>(actionCreators: M, dispatch: Dispatch): M;
export default function bindActionCreators<
  M extends ActionCreatorsMapObject<any>,
  N extends ActionCreatorsMapObject<any>
>(actionCreators: M, dispatch: Dispatch): N;

export default function bindActionCreators(
  actionCreators: ActionCreator<any> | ActionCreatorsMapObject,
  dispatch: Dispatch
) {
  // 只有一个函数的情况
  if (typeof actionCreators === "function") {
    return bindActionCreator(actionCreators, dispatch);
  }

  // 没传参报错
  if (typeof actionCreators !== "object" || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, instead received ${
        actionCreators === null ? "null" : typeof actionCreators
      }. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    );
  }

  const boundActionCreators: ActionCreatorsMapObject = {};
  // 循环绑定
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key];
    if (typeof actionCreator === "function") {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }
  return boundActionCreators;
}

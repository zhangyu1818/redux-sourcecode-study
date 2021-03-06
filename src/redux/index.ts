// functions
import createStore from "./createStore";
import combineReducers from "./combineReducers";
import bindActionCreators from "./bindActionCreators";
import applyMiddleware from "./applyMiddleware";
import compose from "./compose";
import warning from "./utils/warning";
import __DO_NOT_USE__ActionTypes from "./utils/actionTypes";

// types
// store的type
// store
export {
  CombinedState,
  PreloadedState,
  Dispatch,
  Unsubscribe,
  Observable,
  Observer,
  Store,
  StoreCreator,
  StoreEnhancer,
  StoreEnhancerStoreCreator,
  ExtendState
} from "./types/store";
// reducers
// reducers的type
export {
  Reducer,
  ReducerFromReducersMapObject,
  ReducersMapObject,
  StateFromReducersMapObject,
  ActionFromReducer,
  ActionFromReducersMapObject
} from "./types/reducers";
// action creators
// action的type
export { ActionCreator, ActionCreatorsMapObject } from "./types/actions";
// middleware
// middleware的type
export { MiddlewareAPI, Middleware } from "./types/middleware";
// actions
// actions的type
export { Action, AnyAction } from "./types/actions";

/*
 * This is a dummy function to check if the function name has been altered by minification.
 * If the function has been minified and NODE_ENV !== 'production', warn the user.
 * 根据这个函数的名字有没有被压缩来判断是否在开发环境中使用来压缩版本
 */
function isCrushed() {}

if (
  process.env.NODE_ENV !== "production" &&
  typeof isCrushed.name === "string" &&
  isCrushed.name !== "isCrushed"
) {
  warning(
    'You are currently using minified code outside of NODE_ENV === "production". ' +
      "This means that you are running a slower development build of Redux. " +
      "You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify " +
      "or setting mode to production in webpack (https://webpack.js.org/concepts/mode/) " +
      "to ensure you have the correct code for your production build."
  );
}

export {
  createStore,
  combineReducers,
  bindActionCreators,
  applyMiddleware,
  compose,
  __DO_NOT_USE__ActionTypes
};

// @ts-nocheck
import { compose } from "./redux";

const reducer = (state = 0, action) => {
  switch (action.type) {
    case "INCREASE_NUMBER":
      return state + 1;
    case "MINUS_NUMBER":
      return state - 1;
    default:
      return state;
  }
};

const applyMiddleWare = (...middleWares) => createStore => (...args) => {
  const store = createStore(...args);
  let dispatch;
  const middleWareApi = { dispatch: (...args) => dispatch(...args) };
  const chain = middleWares.map(middleWare => middleWare(middleWareApi));
  dispatch = compose(...chain)(store.dispatch);
  return {
    ...store,
    dispatch
  };
};

const createStore = (reducer, enhancer) => {
  let store;
  const dispatch = action => {
    store = reducer(store, action);
    console.log("state:", store);
  };
  const getState = () => store;
  if (enhancer) {
    return enhancer(createStore)(reducer);
  }
  dispatch({ type: "INIT" });
  return {
    dispatch,
    getState
  };
};

const doNothingMiddleware = () => next => action => next(action);
const thunk = middlewareApi => next => action => {
  if (typeof action === "function") return action(middlewareApi);
  return next(action);
};
const logger = () => next => action => {
  console.log("before dispatch");
  console.log(action);
  const result = next(action);
  console.log("after dispatch");
  return result;
};

const store = createStore(
  reducer,
  applyMiddleWare(doNothingMiddleware, thunk, logger)
);
store.dispatch({ type: "INCREASE_NUMBER" });

store.dispatch(({ dispatch }) => {
  setTimeout(() => {
    console.log("async action");
    dispatch({ type: "MINUS_NUMBER" });
  }, 2000);
});

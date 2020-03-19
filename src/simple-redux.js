// 自己实现一个redux

const compose = (...fn) => {
  if (fn.length === 0) return args => args;
  else if (fn.length === 1) return fn[0];
  return fn.reduce((a, b) => (...args) => a(b(...args)));
};

const applyMiddleware = (...middlewares) => createStore => reducers => {
  const store = createStore(reducers);
  if (!middlewares) return store;
  let dispatch = () => {};
  const middlewareAPI = {
    getState: store.getState,
    dispatch: (...args) => dispatch(...args)
  };
  const chins = middlewares.map(fn => fn(middlewareAPI));
  dispatch = compose(...chins)(store.dispatch);
  return {
    ...store,
    dispatch
  };
};

const createStore = (reducers, middlewares) => {
  if (middlewares)
    return applyMiddleware(...middlewares)(createStore)(reducers);
  let currentReducers = reducers;
  let currentState;
  let currentListeners, nextListeners;
  currentListeners = nextListeners = [];

  const getState = () => currentState;

  const dispatch = action => {
    currentState = currentReducers(currentState, action);
    currentListeners = [...nextListeners];
    for (const listener of currentListeners) listener();
    return action;
  };

  const subscribe = callback => {
    let isSubscribe = true;
    nextListeners.push(callback);
    return () => {
      if (!isSubscribe) return;
      isSubscribe = false;
      const index = nextListeners.indexOf(callback);
      nextListeners.splice(index, 1);
    };
  };

  dispatch({ type: Symbol("SIMPLE_REDUX_INIT") });

  return {
    getState,
    dispatch,
    subscribe
  };
};

const reducer = (state = { count: 0 }, action) => {
  switch (action.type) {
    case "INCREASE":
      return { ...state, count: state.count + 1 };
    case "DECREASE":
      return { ...state, count: state.count - 1 };
    default:
      return state;
  }
};

const logger = ({ getState }) => next => action => {
  console.log("before dispatch=>", getState());
  const result = next(action);
  console.log("after dispatch=>", getState());
  return result;
};

const asyncMiddleware = () => next => action => Promise.resolve(next(action));

const store = createStore(reducer, [asyncMiddleware, logger]);

store.subscribe(() => console.log(store.getState()));

store.dispatch({ type: "INCREASE" });
store.dispatch({ type: "DECREASE" }).then(() => {
  console.log("dispatch completed");
});

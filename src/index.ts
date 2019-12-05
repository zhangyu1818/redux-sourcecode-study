import {
  createStore,
  applyMiddleware,
  combineReducers,
  bindActionCreators,
  Reducer,
  Middleware
} from "./redux";

// middleware
import logger from "redux-logger";
import { composeWithDevTools } from "redux-devtools-extension";

// count initial value
const countInitialValue = {
  count: 0
};

// count action types
type CountActionType = { type: "INCREASE_NUMBER" } | { type: "MINUS_NUMBER" };

// count reducer
const countReducer: Reducer<typeof countInitialValue, CountActionType> = (
  state = countInitialValue,
  action
) => {
  switch (action.type) {
    case "INCREASE_NUMBER":
      return { count: state.count + 1 };
    case "MINUS_NUMBER":
      return { count: state.count - 1 };
    default:
      return state;
  }
};

// name initial value
const nameInitialValue = {
  name: ""
};

// name action types
type NameActionType =
  | { type: "SET_NAME"; name: string }
  | { type: "CLEAR_NAME" };

// name reducer
const nameReducer: Reducer<typeof nameInitialValue, NameActionType> = (
  state = nameInitialValue,
  action
) => {
  switch (action.type) {
    case "SET_NAME":
      return { name: action.name };
    case "CLEAR_NAME":
      return { name: "" };
    default:
      return state;
  }
};

// root state type
type rootState = {
  count: typeof countInitialValue;
  name: typeof nameInitialValue;
};

// combine reducers
const reducers = combineReducers<rootState>({
  count: countReducer,
  name: nameReducer
});

// custom middleware
const doNothingMiddleware: Middleware = middlewareApi => next => action =>
  next(action);

// store
const store = createStore(
  reducers,
  // @ts-ignore todo 正确类型
  composeWithDevTools(applyMiddleware(doNothingMiddleware, logger))
);

// subscribe
const unsubscribeHandle = store.subscribe(() => console.log(store.getState()));

// unsubscribe
// unsubscribeHandle()

// 如果action的prototype是null，会报错
// const nullPrototype = Object.create(null);
// nullPrototype.type = "INCREASE_NUMBER";
// store.dispatch(nullPrototype);

// action creators
const minusNumberAction = () => ({
  type: "MINUS_NUMBER"
});

const setNameAction = (name: string) => ({ type: "SET_NAME", name });

store.dispatch({ type: "INCREASE_NUMBER" });
store.dispatch(setNameAction("hello"));

// bind action creators
const actionCreators = bindActionCreators(
  { minusNumberAction, setNameAction },
  store.dispatch
);

actionCreators.minusNumberAction();
actionCreators.setNameAction("hello redux");

import {
  createStore,
  applyMiddleware,
  combineReducers,
  Reducer
} from "./redux";
import { logger } from "redux-logger";

type CountActionType = { type: "INCREASE_NUMBER" } | { type: "MINUS_NUMBER" };

const countInitialValue = {
  count: 0
};

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

type NameActionType =
  | { type: "SET_NAME"; name: string }
  | { type: "CLEAR_NAME" };

const nameInitialValue = {
  name: ""
};

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

type rootState = {
  count: typeof countInitialValue;
  name: typeof nameInitialValue;
};

const reducer = {
  count: countReducer,
  name: nameReducer
};

const reducers = combineReducers<rootState>(reducer);

const store = createStore(reducers, applyMiddleware(logger as any));
const unsubscribeHandle = store.subscribe(() => console.log(store.getState()));

// 如果action的prototype是null，会报错
// const nullPrototype = Object.create(null);
// nullPrototype.type = "INCREASE_NUMBER";
// store.dispatch(nullPrototype);

store.dispatch({ type: "INCREASE_NUMBER" });
store.dispatch({ type: "SET_NAME", name: "hello" });

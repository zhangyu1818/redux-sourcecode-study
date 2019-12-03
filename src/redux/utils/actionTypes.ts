/**
 * These are private action types reserved by Redux.
 * 这些是redux保留的私有action类型
 * For any unknown actions, you must return the current state.
 * 对于未知的action类型，你需要返回当前的state
 * If the current state is undefined, you must return the initial state.
 * 如果当前的state是undefined，你需要返回初始state
 * Do not reference these action types directly in your code.
 * 不要在你的代码中引用这些类型
 */

const randomString = () =>
  Math.random()
    .toString(36)
    .substring(7)
    .split("")
    .join(".");

const ActionTypes = {
  // 初始化action
  INIT: `@@redux/INIT${/* #__PURE__ */ randomString()}`,
  // 热替换action
  REPLACE: `@@redux/REPLACE${/* #__PURE__ */ randomString()}`,
  // 测试未知类型的action
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
};

export default ActionTypes;

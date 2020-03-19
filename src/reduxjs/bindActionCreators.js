function bindActionCreator(actionCreator, dispatch) {
    return function (...args) {
        return dispatch(actionCreator.apply(this, args));
    };
}
export default function bindActionCreators(actionCreators, dispatch) {
    // 只有一个函数的情况
    if (typeof actionCreators === "function") {
        return bindActionCreator(actionCreators, dispatch);
    }
    // 没传参报错
    if (typeof actionCreators !== "object" || actionCreators === null) {
        throw new Error(`bindActionCreators expected an object or a function, instead received ${actionCreators === null ? "null" : typeof actionCreators}. ` +
            `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`);
    }
    const boundActionCreators = {};
    // 循环绑定
    for (const key in actionCreators) {
        const actionCreator = actionCreators[key];
        if (typeof actionCreator === "function") {
            boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
        }
    }
    return boundActionCreators;
}

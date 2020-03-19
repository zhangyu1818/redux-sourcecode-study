import compose from "./compose";
/**
 * applyMiddleware函数接收middleware为参数
 * 返回另一个函数，这个函数需要接收createStore为函数，这个处理是在createStore中进行的
 *
 * 这里是使用接收的createStore函数，把store创建出来
 * 然后把dispatch和getStore传给中间件函数
 * 使用compose把已经有dispatch和getStore方法当中间件组合后，将dispatch传入，得到一个新的dispatch
 * 新的dispatch是经过了中间件的dispatch
 *
 */
export default function applyMiddleware(...middlewares) {
    return (createStore) => (reducer, ...args) => {
        const store = createStore(reducer, ...args);
        // 这里做一个错误处理
        // 如果在绑定中间件的时候调用dispatch会报错
        let dispatch = () => {
            throw new Error("Dispatching while constructing your middleware is not allowed. " +
                "Other middleware would not be applied to this dispatch.");
        };
        const middlewareAPI = {
            getState: store.getState,
            dispatch: (action, ...args) => dispatch(action, ...args)
        };
        // 将dispatch和getStore方法传入中间件，得到新的数组
        const chain = middlewares.map(middleware => middleware(middlewareAPI));
        // 将新的数组用compose绑定起来，再把store.dispatch传入，得到新的dispatch
        dispatch = compose(...chain)(store.dispatch);
        return {
            ...store,
            dispatch
        };
    };
}

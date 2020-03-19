`redux`的源码相对来说比较简单，因为它仅仅是一个`js`库，不包含框架相关的知识，在去年其实就看过源码了，但是最近回想起来感觉都忘了，所以写一篇笔记记录

这里的`redux`版本是最新的v4.0.5

## 原理简析

先简单叙述一下部分的实现原理

### createStore

```javascript
createStore(reducer, preloadedState, enhancer)
```



调用`createStore`有2种情况，传入了增强器`enhancer`时，会将`createStore`传入`enhancer`，也就是在`enhancer`里创建了`store`后，把`store`的方法增强后再返回，代码来看就是

```javascript
enhancer(createStore)(reducer, preloadedState)
```



另一种就是忽略掉了`enhancer`，直接创建`store`

在创建完`store`后，内部会`dispatch`一个` type: ActionTypes.INIT `的`action`，因为我们的`reducer`不会有这个`type`的，所以会返回初始值，这一步就是给整个`state tree`赋初始值了

通常，我们都不会只有一个`reducer`，所以需要使用`redux`提供的合并`reducer`的函数`combineReducers`

### combineReducers

`combineReducers`的原理就是依次调用传入对象的值的`reducer`函数

```javascript
combineReducers(reducers)
```



简单来理解伪代码可以是这样

```javascript
// 传入
const reducers = {
  count: state => state,
  string: state => state
};

// 函数里处理

const keys = ["count", "string"];
// 新state
const state = {};
for (const key of keys) {
  // 通过上一次key对应的state，调用对应的reducer函数，得到新的state
  state[key]=reducers[key](prevKeyState)
}
return state;
```

### applyMiddleware

`applyMiddleware`是`redux`自带的增强器，主要是用来增强`dispatch`函数的功能，也就是提供了`dispatch`函数的中间件

之前有讲，如果传入了`enhancer`，会将`createStore`交给增强器来办，比如使用的`applyMiddleware`，流程大概就是这样

```javascript
// createStore将自己交给了增强器
applyMiddleware(增强器A,增强器B)(createStore)(reducers,preloadedState)

// 函数声明大概就是这样
function applyMiddleware(增强器A,增强器B) {
  return function (createStore) {
    return function (reducers,preloadedState) {
        const state = createStore(reducers,preloadedState);
        // 取出dispatch 使用接收的增强器对他进行增强
        ...
    }
  }
}
```

接下来就直接铺上源码

## 源码分析

以下`tsc`转出的`JavaScript`版，并且我人为的***省略***掉了一些类型判断和抛出错误

本文详细代码见我的[github仓库](https://github.com/zhangyu1818/redux-sourcecode-study.git)

### createStore

```javascript
import $$observable from "./utils/symbol-observable";
import ActionTypes from "./utils/actionTypes";

export default function createStore(reducer, preloadedState, enhancer) {  
  	// 如果有增强器
  	if (typeof enhancer !== "undefined"){
    	return enhancer(createStore)(reducer, preloadedState);
    }

    // 当前的reducer
    let currentReducer = reducer;
    // 当前的state
    let currentState = preloadedState;
    // 当前的listeners
    let currentListeners = [];
    // 下一次的listeners
    let nextListeners = currentListeners;
    // 标示是否正在进行dispatch
    let isDispatching = false;

     // 这是一个对currentListeners的浅复制，所以我们可以将nextListeners当作一个临时的list在dispatch的过程中使用
     // 这样做的目的是可以防止在dispatch调用过程中，调用subscribe/unsubscribe产生错误
    function ensureCanMutateNextListeners() {
        if (nextListeners === currentListeners) {
            // 浅复制
            nextListeners = currentListeners.slice();
        }
    }


    // 用来获取state tree
    function getState() {
        return currentState;
    }
    
  	// 添加一个state change的监听，它会在每次dispatch调用结束后并且一部分state tree可能被改变时调用
  	// 你可以在这个callback里调用getState()来获取当前的state tree
  	// 返回值是一个函数，用来退订
    function subscribe(listener) {
        // 标志已经被订阅
        let isSubscribed = true;
        // 浅复制一次listeners
        // 也就是currentListeners复制到nextListeners
        ensureCanMutateNextListeners();
        // 添加进nextListeners
        nextListeners.push(listener);
        // 返回的退订函数
        return function unsubscribe() {
            // 如果已经退订了，就return
            // 防止多次调用函数
            if (!isSubscribed) {
                return;
            }
            // 已经退订
            isSubscribed = false;
            // 浅复制一次
            ensureCanMutateNextListeners();
            const index = nextListeners.indexOf(listener);
            // 删除掉订阅的函数
            nextListeners.splice(index, 1);
            // currentListeners设置为null的原因是防止内存泄露
            // 见https://github.com/reduxjs/redux/issues/3474
            currentListeners = null;
        };
    }

     // dispatch一个action，这是触发state改变的唯一方式
     // 它只实现了基础的字面量对象action操作，如果你想要dispatch一个Promise、Observable、thunk获取其他的，你需要将创建store的函数放进响应的中间件，比如redux-thunk包
     // 为了方便返回值为相同的action对象
     // 如果你使用来自定义的中间件，可能会返回其他的东西，比如Promise
    function dispatch(action) {
        try {
            isDispatching = true;
            // 通过reducer获取下一个state
            currentState = currentReducer(currentState, action);
        }
        finally {
            isDispatching = false;
        }
        // 通知所有listeners
        const listeners = (currentListeners = nextListeners);
        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            listener();
        }
        return action;
    }
    
     // 替换store当前使用的reducer来计算state
     // 如果你的app实现了代码分割，并且你想动态的加载某些reducers，或者实现来redux的热重载，就需要这个方法
    function replaceReducer(nextReducer) {
      // ...
    }
    
    // 提供给observable/reactive库的接口
    function observable() {
      // ...
    }

    // 当store创建好了，会派发一个INIT的action，这样所有的reducer都会返回它们的初始值
    // 有效填充了初始的state tree
    dispatch({ type: ActionTypes.INIT });
    const store = {
        dispatch: dispatch,
        subscribe,
        getState,
        replaceReducer,
        [$$observable]: observable
    };
    // 返回store
    return store;
}

```

###  combineReducers

`combineReducers`的作用就是将多个`reducer`合并为一个

```javascript
import ActionTypes from "./utils/actionTypes";

export default function combineReducers(reducers) {
    // 获取传入的reducers对象的keys
    const reducerKeys = Object.keys(reducers);
    // 实际使用的reducers对象
    const finalReducers = {};
    for (let i = 0; i < reducerKeys.length; i++) {
        const key = reducerKeys[i];
        finalReducers[key] = reducers[key];
    }
    // 获取reducers的key
    const finalReducerKeys = Object.keys(finalReducers);
    // 返回的合并为一个的reducer函数
    return function combination(state = {}, action) {
        // 标示state有没有改变
        let hasChanged = false;
        // 经过reducer处理的下一次state
        const nextState = {};
        // 循环调用每一个reducer函数
        for (let i = 0; i < finalReducerKeys.length; i++) {
            // 当前reducer的key
            const key = finalReducerKeys[i];
            // 当前reducer的函数
            const reducer = finalReducers[key];
            // 当前key对应的state的值
            const previousStateForKey = state[key];
            // 经过reducer函数后的下一此state值
            const nextStateForKey = reducer(previousStateForKey, action);
            // 当前key的值赋值给state对象
            nextState[key] = nextStateForKey;
            // 如果当前key的state和上一次的state不同，说明state就已经改变了
            hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
        }
        // 如果replace了reducers，可能会需要判断key的length
        // 见https://github.com/reduxjs/redux/issues/3488
        hasChanged =
            hasChanged || finalReducerKeys.length !== Object.keys(state).length;
        return hasChanged ? nextState : state;
    };
}
```

### bindActionCreators

`bindActionCreators`的作用是简化操作，可以把`dispatch`包装进我们的`action creator`函数

```javascript
// 绑定
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
    const boundActionCreators = {};
    // 循环绑定
    for (const key in actionCreators) {
        const actionCreator = actionCreators[key];
        boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
    return boundActionCreators;
}

```

### compose

`compose`函数是中间件`applyMiddleware`的核心功能，能将多个单参数函数从右到左嵌套调用

它的调用形式如下

```javascript
const a = a => a + "A";
const b = b => b + "B";
const c = c => c + "C";

const composed = compose(a,b,c);

composed("args"); // => argsCBA
```

源码如下

```javascript
export default function compose(...funcs) {
  	// 参数为0个
    if (funcs.length === 0) {
        return (arg) => arg;
    }
  	// 参数为1个
    if (funcs.length === 1) {
        return funcs[0];
    }
    return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

```

### applyMiddleware

`applyMiddleware`是`redux`自带的增强器，用来增强`dispatch功能`

```javascript
import compose from "./compose";
/**
 * applyMiddleware函数接收middleware为参数
 * 返回另一个函数，这个函数需要接收createStore为函数，这个处理是在createStore中进行的
 *
 * 这里是使用接收的createStore函数，把store创建出来
 * 然后把dispatch和getStore传给中间件函数
 * 使用compose把已经有dispatch和getStore方法当中间件组合后，将dispatch传入，得到一个新的dispatch
 * 新的dispatch是经过了中间件的dispatch
 */
export default function applyMiddleware(...middlewares) {
    return (createStore) => (reducer, ...args) => {
        const store = createStore(reducer, ...args);
        // 这里做一个错误处理
        // 如果在绑定中间件的时候调用dispatch会报错
        let dispatch = () => {
            throw new Error("...");
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
```

---

阅读完源码后，我最大的感慨还是`redux`的闭包运用，基本处处都是闭包

其中觉得最精妙的部分是`applyMiddleware`，感觉好像很多地方都能用上这个概念



import {isObject} from "@vue/shared";
import {mutableHandlers, ReactiveFlags} from "./baseHandler";


const reactiveMap = new WeakMap()

export function isReactive(value) {
    return !!(value && value[ReactiveFlags.IS_REACTIVE])
}

export function reactive(target) {
    if (!isObject(target)) {
        return
    }

    if (target[ReactiveFlags.IS_REACTIVE]) {
        return target
    }

    let existingProxy = reactiveMap.get(target);
    if (existingProxy) {
        return existingProxy;
    }

    const proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, proxy);
    return proxy;
}
import {activeEffect, track, trigger} from "./effect";
import {isObject} from "@vue/shared";
import {reactive} from "./reactive";

export const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive"
}

export const mutableHandlers = {
    get(target, key, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true;
        }

        track(target, 'get', key)

        let res = Reflect.get(target, key, receiver);
        if (isObject(res)) {
            return reactive(res);
        }
        return res
    },
    set(target, key, value, receiver) {
        let oldValue = target[key];
        let result = Reflect.set(target, key, value, receiver);
        if (oldValue !== value) {
            trigger(target, 'set', key, value, oldValue)
        }
        return result;
    }
}
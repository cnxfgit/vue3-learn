import {hasOwn, isFunction} from "@vue/shared";
import {initProps} from "./componentProps";
import {reactive} from "@vue/reactivity";

export function createComponentInstance(vnode) {
    let instance = {
        data: null,
        vnode,
        subTree: null,
        isMounted: false,
        update: null,
        propsOptions: vnode.type.props,
        props: {},
        attrs: {},
        proxy: null,
        render: null,
    }

    return instance;
}

const publicPropertiesMap = {
    $attrs: i => i.attrs,
    $props: i => i.props,
    $el: i => i.el,
    $slots: i => i.slots,
}

const publicInstanceProxy = {
    get(target, key) {
        const {props, data} = target;
        if (data && hasOwn(data, key)) {
            return data[key];
        } else if (props && hasOwn(props, key)) {
            return props[key];
        }

        let getter = publicPropertiesMap[key];
        if (getter) {
            return getter(target);
        }
    },
    set(target, key, value) {
        const {props, data} = target;
        if (data && hasOwn(data, key)) {
            data[key] = value;
            return true;
        } else if (props && hasOwn(props, key)) {
            console.warn(`attempting to mutate prop ` + (key as string));
            return false;
        }
        return true;
    }
}


export function setupComponent(instance) {
    let {props, type} = instance.vnode

    initProps(instance, props);

    instance.proxy = new Proxy(instance, publicInstanceProxy)

    let data = type.data;

    if (data) {
        if (!isFunction(data)) {
            console.warn('data options must be a function')
        }
        instance.data = reactive(data.call(instance.proxy));
    }

    instance.render = type.render;
}
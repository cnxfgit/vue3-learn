import {hasOwn, isFunction, isObject, ShapeFlags} from "@vue/shared";
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
        setupState: {},
        slots: {},
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
        const {props, data, setupState} = target;
        if (data && hasOwn(data, key)) {
            return data[key];
        } else if (hasOwn(setupState, key)) {
            return setupState[key];
        } else if (props && hasOwn(props, key)) {
            return props[key];
        }

        let getter = publicPropertiesMap[key];
        if (getter) {
            return getter(target);
        }
    },
    set(target, key, value) {
        const {props, data, setupState} = target;
        if (data && hasOwn(data, key)) {
            data[key] = value;
            return true;
        } else if (hasOwn(setupState, key)) {
            setupState[key] = value;
        } else if (props && hasOwn(props, key)) {
            console.warn(`attempting to mutate prop ` + (key as string));
            return false;
        }
        return true;
    }
}

function initSlots(instance, children) {
    if (instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
        instance.slots = children;
    }
}

export function setupComponent(instance) {
    let {props, type, children} = instance.vnode

    initProps(instance, props);
    initSlots(instance, children);

    instance.proxy = new Proxy(instance, publicInstanceProxy)

    let data = type.data;

    if (data) {
        if (!isFunction(data)) {
            console.warn('data options must be a function')
        }
        instance.data = reactive(data.call(instance.proxy));
    }

    let {setup} = type;
    if (setup) {
        const setupContext = {
            emit: (event, ...args) => {
                const eventName = `on${event[0].toUpperCase()}${event.slice(1)}`;
                const handler = instance.vnode.props[eventName];
                handler && handler(...args);
            },
            attrs: instance.attrs,
            slots: instance.slots,
        }
        const setupResult = setup(instance.props, setupContext);

        if (isFunction(setupResult)) {
            instance.render = setupResult;
        } else if (isObject(setupResult)) {
            instance.setupState = setupResult;
        }
    }
    if (!instance.render) {
        instance.render = type.render;
    }
}
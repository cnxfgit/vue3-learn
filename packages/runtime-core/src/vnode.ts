import {isArray, isString, ShapeFlags} from "@vue/shared";

export const Text = Symbol('Text');
export function isVnode(value) {
    return !!(value && value.__v_isVnode);
}

export function createVnode(type, props, children = null) {
    let shapeFlag =  isString(type) ? ShapeFlags.ELEMENT : 0;
    const vnode = {
        type,
        props,
        children,
        el: null,
        key: props?.key,
        __v_isVnode: true,
        shapeFlag,
    }

    if (children) {
        let type = 0;
        if (isArray(children)) {
            type = ShapeFlags.ARRAY_CHILDREN;
        } else {
            children = String(children);
            type = ShapeFlags.TEXT_CHILDREN;
        }
        vnode.shapeFlag |= type;
    }

    return vnode;
}
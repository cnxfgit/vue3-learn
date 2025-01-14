import {isString, ShapeFlags} from "@vue/shared";
import {createVnode, isSameVnode, Text} from "./vnode";

export function createRenderer(renderOptions) {
    let {
        insert: hostInsert,
        remove: hostRemove,
        setElementText: hostSetElementText,
        setText: hostSetText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
        createElement: hostCreateElement,
        createText: hostCreateText,
        patchProp: hostPatchProp,
    } = renderOptions;

    const normalize = (child) => {
        return isString(child) ? createVnode(Text, null, child) : child;
    }

    const mountChildren = (children, container) => {
        for (let i = 0; i < children.length; i++) {
            let child = normalize(children[i]);
            patch(null, child, container);
        }
    }

    const mountElement = (vnode, container) => {
        const {type, props, children, shapeFlag} = vnode;
        const el = vnode.el = hostCreateElement(type);
        if (props) {
            for (const key in props) {
                hostPatchProp(el, key, null, props[key]);
            }
        }
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(el, children);
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el);
        }

        hostInsert(el, container);
    }

    const processText = (n1, n2, container) => {
        if (n1 === null) {
            hostInsert((n2.el = hostCreateText(n2.children)), container);
        } else {
            const el = n2.el = n1.el;
            if (n2.children !== n1.children) {
                hostSetText(el, n2.children);
            }
        }
    }

    const patchProps = (oldProps, newProps, el) => {
        for (const key in newProps) {
            hostPatchProp(el, key, oldProps[key], newProps[key]);
        }

        for (const key in oldProps) {
            if (newProps[key] == null) {
                hostPatchProp(el, key, oldProps[key], null);
            }
        }
    }

    const patchChildren = (n1, n2, el) => {
        const c1 = n1.children;
        const c2 = n2.children;


    }

    const patchElement = (n1, n2) => {
        const el = n2.el = n1.el;
        const oldProps = n1.props || {};
        const newProps = n2.props || {};

        patchProps(oldProps, newProps, el);
        patchChildren(n1, n2, el);
    }

    const processElement = (n1, n2, container) => {
        if (n1 === null) {
            mountElement(n2, container);
        } else {
            patchElement(n1, n2);
        }
    }

    const patch = (n1, n2, container) => {
        if (n1 === n2) return;

        if (n1 && !isSameVnode(n1, n2)) {
            unmount(n1);
            n1 = null;
        }

        const {type, shapeFlag} = n2;

        switch (type) {
            case Text:
                processText(n1, n2, container);
                break
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container);
                }
        }
    }

    const unmount = (vnode) => {
        hostRemove(vnode.el);
    }

    const render = (vnode, container) => {
        if (vnode == null) {
            if (container._vnode) {
                unmount(container._vnode);
            }
        } else {
            patch(container._vnode || null, vnode, container)
        }
        container._vnode = vnode;
    }
    return {
        render
    }
}
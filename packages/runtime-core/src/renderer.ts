import {isString, ShapeFlags} from "@vue/shared";
import {createVnode, Text} from "./vnode";

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

    const patch = (n1, n2, container) => {
        if (n1 === n2) return;

        const {type, shapeFlag} = n2;
        if (n1 === null) {
            switch (type) {
                case Text:
                    processText(n1, n2, container);
                    break
                default:
                    if (shapeFlag & ShapeFlags.ELEMENT) {
                        mountElement(n2, container);
                    }
            }
        } else {
            const {shapeFlag} = n2;
            // if (shapeFlag & 1) {
            //     processElement(n1, n2, container);
            // } else if (shapeFlag & 4) {
            //     processText(n1, n2, container);
            // }
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
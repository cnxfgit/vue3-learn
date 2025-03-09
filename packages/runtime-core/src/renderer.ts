import {isString, ShapeFlags} from "@vue/shared";
import {createVnode, Fragment, isSameVnode, Text} from "./vnode";
import {getSequence} from "./sequence";
import {ReactiveEffect} from "@vue/reactivity";
import {queueJob} from "./scheduler";
import {createComponentInstance, setupComponent} from "./component";

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

    const normalize = (children, i) => {
        if (isString(children[i])) {
            let vnode = createVnode(Text, null, children[i]);
            children[i] = vnode;
        }
        return children[i];
    }

    const mountChildren = (children, container) => {
        for (let i = 0; i < children.length; i++) {
            let child = normalize(children, i);
            patch(null, child, container);
        }
    }

    const mountElement = (vnode, container, anchor) => {
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

        hostInsert(el, container, anchor);
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
                hostPatchProp(el, key, oldProps[key], undefined);
            }
        }
    }

    const unmountChildren = (children) => {
        for (let i = 0; i < children.length; i++) {
            unmount(children[i]);
        }
    }

    const patchKeyedChildren = (c1, c2, el) => {
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;

        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVnode(n1, n2)) {
                patch(n1, n2, el);
            } else {
                break
            }
            i++;
        }
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVnode(n1, n2)) {
                patch(n1, n2, el);
            } else {
                break
            }
            e1--;
            e2--;
        }

        if (i > e1) {
            if (i <= e2) {
                while (i <= e2) {
                    const nextPos = e2 + 1;
                    const anchor = nextPos < c2.length ? c2[nextPos].el : null;
                    patch(null, c2[i], el, anchor);
                    i++;
                }
            }
        } else if (i > e2) {
            while (i <= e1) {
                unmount(c1[i]);
                i++;
            }
        }

        let s1 = i;
        let s2 = i;
        const keyToNewIndexMap = new Map();
        for (let i = s2; i <= e2; i++) {
            const nextChild = c2[i];
            keyToNewIndexMap.set(nextChild.key, i);
        }

        const toBePatched = e2 - s2 + 1;
        const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

        for (let i = s1; i <= e1; i++) {
            const oldChild = c1[i];
            const newIndex = keyToNewIndexMap.get(oldChild.key);
            if (newIndex === undefined) {
                unmount(oldChild);
            } else {
                newIndexToOldIndexMap[newIndex - s2] = i + 1;
                patch(oldChild, c2[newIndex], el);
            }
        }

        const increment = getSequence(newIndexToOldIndexMap)
        let j = increment.length - 1;
        for (let i = toBePatched - 1; i >= 0; i--) {
            let index = i + s2;
            let current = c2[index];
            let anchor = index + 1 < c2.length ? c2[index + 1].el : null;
            if (newIndexToOldIndexMap[i] === 0) {
                patch(null, current, el, anchor);
            } else {
                if (i !== increment[j]) {
                    hostInsert(current.el, el, anchor);
                } else {
                    j--;
                }
            }
        }
    }

    const patchChildren = (n1, n2, el) => {
        const c1 = n1.children;
        const c2 = n2.children;
        const preShapeFlag = n1.shapeFlag
        const shapeFlag = n2.shapeFlag
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                unmountChildren(c1);
            }
            if (c1 !== c2) {
                hostSetElementText(el, c2);
            }
        } else {
            if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    patchKeyedChildren(c1, c2, el);
                } else {
                    unmountChildren(c1)
                }
            } else {
                if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                    hostSetElementText(el, '')
                }
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    mountChildren(c2, el);
                }
            }
        }

    }

    const patchElement = (n1, n2) => {
        const el = n2.el = n1.el;
        const oldProps = n1.props || {};
        const newProps = n2.props || {};

        patchProps(oldProps, newProps, el);
        patchChildren(n1, n2, el);
    }

    const processElement = (n1, n2, container, anchor) => {
        if (n1 === null) {
            mountElement(n2, container, anchor);
        } else {
            patchElement(n1, n2);
        }
    }

    const processFragment = (n1, n2, container, anchor) => {
        if (n1 == null) {
            mountChildren(n2.children, container);
        } else {
            patchChildren(n1, n2, container);
        }
    }

    const mountComponent = (vnode, container, anchor) => {
        let instance = vnode.component = createComponentInstance(vnode);

        setupComponent(instance);

        setupRenderEffect(instance, container, anchor);
    }

    const setupRenderEffect = (instance, container, anchor) => {
        const {render} = instance;
        const componentUpdateFn = () => {
            if (!instance.isMounted) {
                const subTree = render.call(instance.proxy);
                patch(null, subTree, container, anchor);
                instance.subTree = subTree;
                instance.isMounted = true;
            } else {
                const subTree = render.call(instance.proxy);
                patch(instance.subTree, subTree, container, anchor);
                instance.subTree = subTree;
            }
        }

        const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update));
        let update = instance.update = effect.run.bind(effect);
        update();
    }

    const patchComponent = (n1, n2) => {

    }

    const processComponent = (n1, n2, container, anchor) => {
        if (n1 === null) {
            mountComponent(n2, container, anchor);
        } else {
            patchComponent(n1, n2);
        }
    }

    const patch = (n1, n2, container, anchor = null) => {
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
            case Fragment:
                processFragment(n1, n2, container, anchor);
                break
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, anchor);
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    processComponent(n1, n2, container, anchor);
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
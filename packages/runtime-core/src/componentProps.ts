import {hasOwn} from "@vue/shared";
import {reactive} from "@vue/reactivity";

export function initProps(instance, rawProps) {
    const props = {};
    const attrs = {};

    const options = instance.propsOptions || {};

    if (rawProps) {
        for (let key in rawProps) {
            const value = rawProps[key];
            if (hasOwn(options, key)) {
                props[key] = value;
            } else {
                attrs[key] = value;
            }
        }
    }

    instance.props = reactive(props);
    instance.attrs = attrs;
}
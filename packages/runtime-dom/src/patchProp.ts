import {patchClass} from "./modules/class";
import {patchStyle} from "./modules/style";
import {patchEvent} from "./modules/event";
import {patchAttr} from "./modules/attr";

export function patchProp(el, key, prevValue, nextValue) {
    if (key === 'class') {
        patchClass(el, nextValue)
    } else if (key === 'style') {
        patchStyle(el, prevValue, nextValue)
    } else if (/^on[^a-z]/.test(key)) {
        patchEvent(el, key, nextValue)
    } else {
        patchAttr(el, key, nextValue)
    }
}
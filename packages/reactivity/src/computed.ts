import {isFunction} from "@vue/shared";
import {ReactiveEffect, track, trackEffects, triggerEffects} from "./effect"

class ComputedRefImpl {
    public effect
    public _dirty = true
    public __v_isReadonly = true
    public __v_isRef = true
    public _value
    public dep = new Set()
    constructor(public getter, public setter) {
        this.effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) {
                this._dirty = true;
                triggerEffects(this.dep);
            }
        });
    }

    get value() {
        trackEffects(this.dep);
        if (this._dirty) {
            this._dirty = false;
            this._value = this.effect.run();
        }
        return this._value
    }

    set value(newValue) {
        this.setter(newValue)
    }
}

export const computed = (getterOrOptions) => {
    let onlyGetter = isFunction(getterOrOptions)
    let getter;
    let setter;
    if (onlyGetter) {
        getter = onlyGetter
        setter = () => {
            console.warn("no set")
        }
    } else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }

    return new ComputedRefImpl(getter, setter)
}
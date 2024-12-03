export let activeEffect = undefined;

class ReactiveEffect {
    public parent = null
    public deps = []
    public active = true

    constructor(public fn) {
    }

    run() {
        if (!this.active) {
            return this.fn()
        }

        try {
            this.parent = activeEffect;
            activeEffect = this;
            return this.fn()
        } finally {
            activeEffect = this.parent;
        }
    }
}

export function effect(fn) {
    const _effect = new ReactiveEffect(fn)

    _effect.run()
}


const targetMap = new WeakMap()

export function track(target, type, key) {
    if (!activeEffect) return

    let depsMap = targetMap.get(target)
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()))
    }

    let dep = depsMap.get(key)
    if (!dep) {
        depsMap.set(key, (dep = new Set()))
    }
    let shouldTrack = !dep.has(activeEffect);
    if (shouldTrack) {
        dep.add(activeEffect)
        activeEffect.deps.push(dep)
    }
}


export function trigger(target, type, key, value, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return

    const effects = depsMap.get(key)
    effects && effects.forEach(effect => {
        if (activeEffect !== effect) effect.run()
    });
}
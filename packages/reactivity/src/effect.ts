export let activeEffect = undefined;

function cleanupEffect(effect) {
    const {deps} = effect;

    for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effect)
    }
    effect.deps.length = 0;
}

export class ReactiveEffect {
    public parent = null
    public deps = []
    public active = true

    constructor(public fn, public scheduler) {
    }

    run() {
        if (!this.active) {
            return this.fn()
        }

        try {
            this.parent = activeEffect;
            activeEffect = this;
            cleanupEffect(this);
            return this.fn()
        } finally {
            activeEffect = this.parent;
        }
    }

    stop() {
        if (this.active) {
            this.active = false;
            cleanupEffect(this)
        }
    }
}

export function effect(fn, options: any = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler)

    _effect.run()

    const runner = _effect.run.bind(_effect)
    runner.effect = _effect
    return runner
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

    let effects = depsMap.get(key)
    if (effects) {
        effects = new Set(effects);
        effects.forEach(effect => {
            if (activeEffect !== effect) {
                if (effect.scheduler) {
                    effect.scheduler()
                } else {
                    effect.run()
                }
            }
        });
    }
}
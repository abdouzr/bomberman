import { __Element } from "./virtual_element.mjs";

class __V_Dom {
    constructor(...elements) {
        this.elements = elements;
        this.keys = 1
        this.state = new Map();
        this.rootElement = null;
    }

    createElement(tag, attrs = {}, children = []) {
        return new __Element(tag, attrs, children, this);
    }

    setElements(...elements) {
        this.elements = elements;
        return this
    }

    render(container) {
        if (!container) {
            return;
        }
        container.innerHTML = '';
        this.elements.forEach(elem => {
            const domElement = elem.render();
            container.appendChild(domElement);
        });
        this.rootElement = container;
        return this;
    }

    reRender(id_compo) {
        const compo = document.querySelector(`#${id_compo}`)
        if (!compo) {
            return;
        }

        const existKey = (elems, key) => {
            for (let i = 0; i < elems.length; i++) {
                if (elems[i].key == key) {
                    return true
                }
            }
            return false
        }

        const key = compo.getAttribute('key')
        const vCompo = this.findElementByDom(key)
        const state_Compo = this.state.get(id_compo)

        vCompo.children = (Array.isArray(state_Compo)) ? [...state_Compo] : [state_Compo];
        if (Array.isArray(state_Compo)) {
            state_Compo.forEach(elem => {
                if (compo.querySelector(`[key="${elem.key}"]`) === null) {
                    compo.appendChild(elem.render());
                }
            });

            Array.from(compo.children).forEach(child => {
                if (!existKey(state_Compo, child.getAttribute('key'))) {
                    compo.removeChild(child);
                }
            });
        } else if (typeof state_Compo !== "object") {
            compo.innerHTML = state_Compo;
        }
    }

    findElementByDom(key) {
        if (!key) {
            throw new Error("Error no key found in this element");
        }
        const search = (elem) => {
            const elemKey = elem.attrs?.key;
            if (elemKey == key || elem.key == key) {
                return elem;
            }

            if (Array.isArray(elem.children)) {
                for (const child of elem.children) {
                    const found = search(child);
                    if (found) return found;
                }
            }

            return null;
        }

        for (const elem of this.elements) {
            const found = search(elem);
            if (found) return found;
        }

        return null;
    }

    getKey() {
        let key = this.keys;
        this.keys++;
        return key;
    }

    selectElement(query) {
        const element = document.querySelector(query);
        if (element) {
            const Velem = this.findElementByDom(element.getAttribute('key'));
            return Velem
        }
        return null
    }

    useState(name, val) {
        this.state.set(name, val)
    }

    getState(key) {
        const current = this.state.get(key);
        return (current === undefined) ? [] : current;
    }

    setState(key, value) {
        this.state.set(key, value);

        if (this.rootElement) {
            this.reRender(key);
        }
    }

    renderToString() {
        return this.elements.map(elem => elem.renderToString()).join('');
    }
}

function createComponent(...elements) {
    return new __V_Dom(...elements);
}

export { __V_Dom, createComponent }

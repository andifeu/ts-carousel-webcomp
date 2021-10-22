var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class Component extends HTMLElement {
    constructor() {
        super();
        this._dom = null;
        this.templateCode = null;
        this.template = document.createElement('template');
        this.params = this.attributes;
        loadTemplate(this).then(tpl => {
            this.templateCode = tpl;
            this.afterTemplateLoaded();
        });
    }
    getClassName() {
        throw new Error('getClassName() not implemented');
    }
    afterTemplateLoaded() {
        // @ts-ignore
        for (let param of this.params) {
            const regex = new RegExp(`{{${param.name}}}`, 'g');
            this.templateCode = this.templateCode.replace(regex, param.value);
        }
        this.template.innerHTML = this.templateCode;
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(this.template.content.cloneNode(true));
        this._dom = this.shadowRoot.querySelector('.crsl_widget');
        this.afterRender();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'data':
                const data = JSON.parse(newValue);
                this.afterSlideDataChanged(data);
                break;
            case 'beforeimagechangelistener':
                const callback = new Function('return ' + newValue)();
                this.afterCallbackChanged(callback);
        }
    }
    afterRender() { }
    afterSlideDataChanged(slides) { }
    afterCallbackChanged(beforeImageChangeListener) { }
}
function loadTemplate(component) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(`src/template/${component.getClassName()}.html`, {
            method: 'GET',
            headers: {
                'Content-Type': 'text/plain'
            }
        });
        return yield response.text();
    });
}

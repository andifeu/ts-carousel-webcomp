export interface ImageSlide {
    fgImage: string;
    bgImage?: string;
}

export type CallbackFunction = ((
    animate:() => void, 
    currentSlideIndex:number,
    targetSlideIndex:number
) => void) | null;

export default class Component extends HTMLElement {

    protected _dom: HTMLElement | null = null;

    private params: NamedNodeMap;

    private templateCode: string | null = null;

    private template: HTMLTemplateElement;

    constructor() {
        super();
        this.template = document.createElement('template');
        this.params = this.attributes;
        loadTemplate(this).then(tpl => {
            this.templateCode = tpl;
            this.afterTemplateLoaded();
        });
    }

    public getClassName() {
        throw new Error('getClassName() not implemented');
    }

    private afterTemplateLoaded() {
        // @ts-ignore
        for (let param of this.params) {
            const regex = new RegExp(`{{${param.name}}}`, 'g');
            this.templateCode = this.templateCode!.replace(regex, param.value);
        }

        this.template.innerHTML = this.templateCode!;

        this.attachShadow({ mode: 'open' });
        this.shadowRoot!.appendChild(this.template.content.cloneNode(true));
        this._dom = this.shadowRoot!.querySelector('.crsl_widget');
        this.afterRender();
    }

    
    private attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        switch (name) {
            case 'data': 
                const data = JSON.parse(newValue);
                this.afterSlideDataChanged(data);
                break;

            case  'beforeimagechangelistener':
                const callback = new Function('return ' + newValue)();
                this.afterCallbackChanged(callback);
        }

    }
    
    protected afterRender() {}

    protected afterSlideDataChanged(slides: ImageSlide[]) {}

    protected afterCallbackChanged(beforeImageChangeListener: CallbackFunction) {}
}

async function loadTemplate(component: Component) {
    const response = await fetch(`src/template/${component.getClassName()}.html`, {
        method: 'GET',
        headers: {
            'Content-Type': 'text/plain'
        }
    });

    return await response.text();
}

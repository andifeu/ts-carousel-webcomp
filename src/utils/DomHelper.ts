import Toolkit from './Toolkit.js';

export default class DomHelper {

    static createContainer(className?: string, content?: string): HTMLDivElement {
        return this.createElement('div', className, content) as HTMLDivElement;
    }

    static createElement(elementType = 'div', className?: string, content?: string): HTMLElement {
        const element = document.createElement(elementType);
        if (className) {
            element.className = className;
        }
        if (content) {
            element.textContent = content;
        }
        return element;
    }

    static createImage(src: string, className?: string, alt?: string): HTMLImageElement {
        let image = document.createElement('img');
        if (alt) {
            image.setAttribute('alt', alt);
        }
        if (className) {
            image.className = className;
        }
        if (src) {
            image.src = src;
        }
        return image;
    }

    static appendSVG(
        fileName: string,
        domNode: HTMLElement,
        onLoadCallback?: () => void,
        onErrorCallback?: (error: string) => void
    ): void {

        Toolkit.httpGETRequest(
            'src/icons/' + fileName,
            (svgData) => {
                let svgContainer = DomHelper.createContainer('crsl_icon');
                svgContainer.innerHTML = svgData;
                domNode.appendChild(svgContainer);
                if (onLoadCallback) {
                    onLoadCallback();
                }
            },
            (error) => {
                if (onErrorCallback) {
                    onErrorCallback(error);
                }
            }
        );
    }


}
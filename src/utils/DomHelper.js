import Toolkit from './Toolkit.js';
export default class DomHelper {
    static createContainer(className, content) {
        return this.createElement('div', className, content);
    }
    static createElement(elementType = 'div', className, content) {
        const element = document.createElement(elementType);
        if (className) {
            element.className = className;
        }
        if (content) {
            element.textContent = content;
        }
        return element;
    }
    static createImage(src, className, alt) {
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
    static appendSVG(fileName, domNode, onLoadCallback, onErrorCallback) {
        Toolkit.httpGETRequest('/src/icons/' + fileName, (svgData) => {
            let svgContainer = DomHelper.createContainer('crsl_icon');
            svgContainer.innerHTML = svgData;
            domNode.appendChild(svgContainer);
            if (onLoadCallback) {
                onLoadCallback();
            }
        }, (error) => {
            if (onErrorCallback) {
                onErrorCallback(error);
            }
        });
    }
}

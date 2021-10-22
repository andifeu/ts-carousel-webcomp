type ContentType = 'json' | 'text';

export default class Toolkit {

    static delayedExecution(functionToCall: () => void, delay: number = 0, timer?: number | null): number {
        if (timer) {
            clearTimeout(timer);
        }
        return window.setTimeout(functionToCall, delay);
    }


    static httpGETRequest(
        url: string,
        onLoadCallback: (svgData: string) => void,
        onErrorCallback?: (error: string) => void,
        contentType: ContentType = 'text'
    ): void {
        fetch(url)
        .then(response => {
            if (contentType == 'json') {
                return response.json();
            }
            return response.text();
        })
        .then(data => onLoadCallback(data))
        .catch(error => {
            if (onErrorCallback) {
                onErrorCallback(error);
            }
        });
    }

    static addClickEvent(domNode: HTMLElement, listener:() => void, useCapture: boolean = false):void {
        domNode.addEventListener('click', listener, useCapture);
    }
    

}
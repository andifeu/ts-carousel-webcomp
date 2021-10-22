export default class Toolkit {
    static delayedExecution(functionToCall, delay = 0, timer) {
        if (timer) {
            clearTimeout(timer);
        }
        return window.setTimeout(functionToCall, delay);
    }
    static httpGETRequest(url, onLoadCallback, onErrorCallback, contentType = 'text') {
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
    static addClickEvent(domNode, listener, useCapture = false) {
        domNode.addEventListener('click', listener, useCapture);
    }
}

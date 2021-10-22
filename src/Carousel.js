import DomHelper from './utils/DomHelper.js';
import Toolkit from './utils/Toolkit.js';
import Component from './Component.js';
const ANIMATION_DURATION = 400;
const ACTIVE_IMAGE_WIDTH = 62;
export default class Carousel extends Component {
    constructor() {
        super();
        this._carouselContainer = null;
        this._imageWrapperDom = null;
        this._bgContainer = null;
        this._domSlides = [];
        this._domBgImages = [];
        this._imagePath = [];
        this._slideWidth = 0;
        this._useWebAnimationsAPI = true;
        this._resizeTimer = null;
        this._beforeImageChangeListener = null;
        this.numImages = 0;
        this.currentSlideNumber = 1;
    }
    static get observedAttributes() {
        return [
            'data',
            'beforeimagechangelistener'
        ];
    }
    getClassName() {
        return 'Carousel';
    }
    afterRender() {
        if (this._imagePath.length === 0) {
            return;
        }
        this._connectDom();
        this.setImageSlides(this._imagePath);
        if (this._imageWrapperDom &&
            typeof this._imageWrapperDom.animate === 'function') {
            this._useWebAnimationsAPI = true;
        }
        this._setPrevNextSlide();
        this._setEvents();
        this._toggleNavigationStatus();
        this.resize();
    }
    afterSlideDataChanged(slides) {
        this._imagePath = slides;
        /**
         * @todo: DOM update
         */
    }
    afterCallbackChanged(beforeImageChangeListener) {
        this.setBeforeImageChangeListener(beforeImageChangeListener);
    }
    getDom() {
        return this._dom;
    }
    setBeforeImageChangeListener(beforeImageChangeListener = null) {
        this._beforeImageChangeListener = beforeImageChangeListener;
    }
    setImageSlides(images) {
        this._imagePath = [];
        this._domSlides = [];
        if (!Array.isArray(images) || images.length === 0) {
            throw new Error('The parameter "imagePath" must be an array with image URLs');
        }
        this._buildNavigationDom();
        this._imagePath = [];
        this.numImages = images.length;
        for (let i = 0; i < images.length; i++) {
            this._setupSlide(images[i], i);
        }
    }
    getSlideDom(imageIndex = 0) {
        return this._domSlides[imageIndex] || null;
    }
    getBgImageDom(slideIndex) {
        return this._domBgImages[slideIndex] || null;
    }
    resize() {
        this._resizeTimer = Toolkit.delayedExecution(() => {
            this._setSlideWidth();
            this._setLeftPositions();
        }, 100, this._resizeTimer);
    }
    showPreviousImage() {
        return this.showImage(this.currentSlideNumber - 1);
    }
    showNextImage() {
        return this.showImage(this.currentSlideNumber + 1);
    }
    showImage(imageNumber) {
        const oldGalleryImageNumber = this.currentSlideNumber;
        if (typeof imageNumber !== 'number' || this.numImages < imageNumber || imageNumber < 1) {
            return false;
        }
        this._beforeImageChanged(oldGalleryImageNumber, imageNumber, () => {
            this._imageChange(imageNumber);
        });
        return true;
    }
    _beforeImageChanged(currentSlide, nextSlide, runImageChange) {
        if (typeof this._beforeImageChangeListener === 'function') {
            this._beforeImageChangeListener(() => {
                runImageChange();
                this._animate(nextSlide);
            }, currentSlide - 1, nextSlide - 1);
        }
        else {
            runImageChange();
            this._animate(nextSlide);
        }
    }
    _imageChange(imageNumber) {
        const newActive = this.getSlideDom(imageNumber - 1), oldActive = this.getSlideDom(this.currentSlideNumber - 1), newBgActive = this.getBgImageDom(imageNumber - 1), oldBgActive = this.getBgImageDom(this.currentSlideNumber - 1);
        if (!newActive) {
            return false;
        }
        oldBgActive === null || oldBgActive === void 0 ? void 0 : oldBgActive.classList.remove('crsl_active');
        newBgActive === null || newBgActive === void 0 ? void 0 : newBgActive.classList.add('crsl_active');
        oldActive === null || oldActive === void 0 ? void 0 : oldActive.classList.remove('crsl_active');
        newActive === null || newActive === void 0 ? void 0 : newActive.classList.add('crsl_active');
        this.currentSlideNumber = imageNumber;
        this._toggleNavigationStatus();
        this._setPrevNextSlide();
        return true;
    }
    _setEvents() {
        window.addEventListener('resize', () => {
            this.resize();
        }, true);
    }
    _toggleNavigationStatus() {
        let arrowPrev = this._dom.getElementsByClassName('crsl_navi_prev')[0], arrowNext = this._dom.getElementsByClassName('crsl_navi_next')[0];
        function enableNavigationButton(element) {
            element.classList.remove('crsl_disabled');
            // element.firstChild.removeAttribute('arial-disabled');
        }
        function disableNavigationButton(element) {
            element.classList.add('crsl_disabled');
            // element.firstChild.setAttribute('arial-disabled', 'true');
        }
        // erstes Bild wird angezeigt => previous deaktivieren
        if (this.currentSlideNumber === 1) {
            disableNavigationButton(arrowPrev);
        }
        else {
            enableNavigationButton(arrowPrev);
        }
        // letztes Bild wird angezeigt => next deaktivieren
        if (this.currentSlideNumber === this.numImages) {
            disableNavigationButton(arrowNext);
        }
        else {
            enableNavigationButton(arrowNext);
        }
    }
    _setPrevNextSlide() {
        const prevDom = this.getSlideDom(this.currentSlideNumber - 2), nextDom = this.getSlideDom(this.currentSlideNumber);
        let setClass = (el, className) => {
            var _a;
            let prevEl = (_a = this._imageWrapperDom) === null || _a === void 0 ? void 0 : _a.getElementsByClassName(className);
            if (prevEl && prevEl.length > 0) {
                prevEl[0].classList.remove(className);
            }
            el === null || el === void 0 ? void 0 : el.classList.add(className);
        };
        setClass(prevDom, 'crsl_slide_prev');
        setClass(nextDom, 'crsl_slide_next');
    }
    _setupSlide(slide, imageIndex, onLoadCallback) {
        var _a, _b;
        let slideDom = this.getSlideDom(imageIndex), imageDom, bgImageDom = null;
        this._imagePath.push(slide);
        if (!slideDom) {
            slideDom = DomHelper.createContainer('crsl_slide');
            imageDom = DomHelper.createImage(slide.fgImage, 'crsl_image');
            slideDom.appendChild(imageDom);
            (_a = this._imageWrapperDom) === null || _a === void 0 ? void 0 : _a.appendChild(slideDom);
        }
        else {
            imageDom = slideDom.firstChild;
        }
        this._domSlides[imageIndex] = slideDom;
        if (slide.bgImage) {
            bgImageDom = this.getBgImageDom(imageIndex);
            if (!bgImageDom) {
                bgImageDom = DomHelper.createContainer('crsl_bg_image');
                (_b = this._bgContainer) === null || _b === void 0 ? void 0 : _b.appendChild(bgImageDom);
            }
            bgImageDom.style.backgroundImage = 'url(' + slide.bgImage + ')';
            this._domBgImages[imageIndex] = bgImageDom;
        }
        this._loadImage(imageDom, slide.fgImage, function (e) {
            console.log('loaded', e);
        }, function (e) {
            console.log('error', e);
        });
        if (this.currentSlideNumber === imageIndex + 1) {
            slideDom.classList.add('crsl_active');
            slideDom.classList.add('crsl_active');
            bgImageDom === null || bgImageDom === void 0 ? void 0 : bgImageDom.classList.add('crsl_active');
        }
    }
    _loadImage(imgDom, path, onLoadCallback, onErrorCallback) {
        function loadCallback(event) {
            var _a, _b;
            (_a = event.target) === null || _a === void 0 ? void 0 : _a.removeEventListener('load', loadCallback);
            (_b = event.target) === null || _b === void 0 ? void 0 : _b.removeEventListener('error', errorCallback);
            onLoadCallback(event);
        }
        function errorCallback(event) {
            var _a, _b;
            (_a = event.target) === null || _a === void 0 ? void 0 : _a.removeEventListener('load', loadCallback);
            (_b = event.target) === null || _b === void 0 ? void 0 : _b.removeEventListener('error', errorCallback);
        }
        imgDom.addEventListener('load', loadCallback);
        imgDom.addEventListener('error', errorCallback);
        imgDom.src = path;
    }
    _connectDom() {
        this._carouselContainer = this._dom.querySelector('.crsl_container');
        this._bgContainer = this._dom.querySelector('.crsl_bg_container');
        this._imageWrapperDom = this._dom.querySelector('.crsl_image_wrapper');
    }
    _buildNavigationDom() {
        let btnNavigationPrev, btnNavigationNext, slideIndicator, i, dotIndicators, numberIndicator;
        function addNavigationIcon(iconName, domNode) {
            const iconFile = iconName + '.svg';
            DomHelper.appendSVG(iconFile, domNode, () => {
                console.log('[+] ' + iconFile + ' loaded successfully');
            }, (error) => {
                console.error(error);
            });
        }
        const addNavigationEventHandler = (domNode, type) => {
            Toolkit.addClickEvent(domNode, () => {
                if (type === 'prev') {
                    this.showPreviousImage();
                }
                else if (type === 'next') {
                    this.showNextImage();
                }
            });
        };
        /**
         * Closures für navigation events
         */
        let createSlideIndicatorListener = (j) => () => {
            this.showImage(j + 1);
        };
        btnNavigationPrev = DomHelper.createContainer('crsl_navigation crsl_navi_prev');
        addNavigationIcon('prev', btnNavigationPrev);
        this._dom.appendChild(btnNavigationPrev);
        addNavigationEventHandler(btnNavigationPrev, 'prev');
        btnNavigationNext = DomHelper.createContainer('crsl_navigation crsl_navi_next');
        addNavigationIcon('next', btnNavigationNext);
        this._dom.appendChild(btnNavigationNext);
        addNavigationEventHandler(btnNavigationNext, 'next');
    }
    _setLeftPositions() {
        const left = (this.numImages - 1) / 2 * this._slideWidth - (this.currentSlideNumber - 1) * this._slideWidth;
        if (this._imageWrapperDom) {
            this._imageWrapperDom.style.left = left + 'px';
        }
        if (this._useWebAnimationsAPI) {
            this._animate(this.currentSlideNumber);
        }
    }
    _setSlideWidth() {
        let width;
        const mobileOffset = 64;
        width = this._carouselContainer.offsetWidth * ACTIVE_IMAGE_WIDTH / 100;
        this._slideWidth = width;
        for (let slideDom of this._domSlides) {
            slideDom.style.width = width + 'px';
        }
    }
    _animate(toSlide) {
        const newLeftVal = (this.numImages - 1) / 2 * this._slideWidth - this._slideWidth * (toSlide - 1);
        let startTime, animation, currentLeftVal;
        const cssLeft = this._imageWrapperDom.style.left.replace('px', '');
        currentLeftVal = parseInt(cssLeft, 10);
        function animationStep(timestamp, el, startVal, distance, duration) {
            let leftVal, runtime, progress;
            timestamp = timestamp || new Date().getTime();
            runtime = timestamp - startTime;
            progress = runtime / duration;
            progress = Math.min(progress, 1);
            leftVal = startVal - distance * progress;
            el.style.left = leftVal.toFixed(2) + 'px';
            if (runtime < duration) {
                requestAnimationFrame((ts) => animationStep(ts, el, startVal, distance, duration));
            }
        }
        // Web Animations API bietet flüssigere und performantere Animation wenn verfügbar
        if (this._useWebAnimationsAPI) {
            animation = this._imageWrapperDom.animate([
                { left: currentLeftVal + 'px' },
                { left: newLeftVal + 'px' }
            ], {
                duration: ANIMATION_DURATION,
                fill: 'forwards'
            });
            animation.addEventListener('finish', () => {
                this._imageWrapperDom.style.left = newLeftVal + 'px';
            });
        }
        else {
            requestAnimationFrame((timestamp) => {
                startTime = timestamp || new Date().getTime();
                animationStep(timestamp, this._imageWrapperDom, currentLeftVal, currentLeftVal - newLeftVal, ANIMATION_DURATION);
            });
        }
    }
}
customElements.define('image-carousel', Carousel);

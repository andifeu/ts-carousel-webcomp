import DomHelper from './utils/DomHelper.js';
import Toolkit from './utils/Toolkit.js';
import Component from './Component.js';

import type { ImageSlide, CallbackFunction } from './Component.js'

const ANIMATION_DURATION = 400;
const ACTIVE_IMAGE_WIDTH = 62;

type Attribute = ImageSlide[] | CallbackFunction;

export default class Carousel extends Component {

    private _carouselContainer:HTMLElement | null = null;

    private _imageWrapperDom:HTMLElement | null = null;

    private _bgContainer:HTMLElement | null = null;

    private _domSlides:HTMLElement[] = [];

    private _domBgImages:HTMLElement[] = [];

    private _imagePath:ImageSlide[] = [];

    private _slideWidth = 0;

    private _useWebAnimationsAPI: boolean = true;

    private _resizeTimer: number | null = null;      
    
    private _beforeImageChangeListener:CallbackFunction = null;

    public numImages = 0;

    public currentSlideNumber = 1;

    static get observedAttributes() {
        return [
            'data',
            'beforeimagechangelistener'
        ];
    }

    constructor() {
        super();
    }

    public getClassName() {
        return 'Carousel';
    }

    protected afterRender() {
        if (this._imagePath.length === 0) {
            return;
        }

        this._connectDom();
        this.setImageSlides(this._imagePath);

        if (
            this._imageWrapperDom && 
            typeof this._imageWrapperDom.animate === 'function'
        ) {
            this._useWebAnimationsAPI = true;
        }

        this._setPrevNextSlide();
        this._setEvents();
        this._toggleNavigationStatus();
        this.resize();
    }

    protected afterSlideDataChanged(slides: ImageSlide[]) {
        this._imagePath = slides;
        /**
         * @todo: DOM update
         */
    }

    protected afterCallbackChanged(beforeImageChangeListener: CallbackFunction) {
        this.setBeforeImageChangeListener(beforeImageChangeListener);
    }

    public getDom(): HTMLElement | null {
        return this._dom;
    }

    public setBeforeImageChangeListener(beforeImageChangeListener:CallbackFunction = null) {
        this._beforeImageChangeListener = beforeImageChangeListener;
    }

    public setImageSlides(images: ImageSlide[]): void {
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

    public getSlideDom(imageIndex = 0): HTMLElement {
        return this._domSlides[imageIndex] || null;
    }

    public getBgImageDom(slideIndex:number):HTMLElement {
        return this._domBgImages[slideIndex] || null;
    }

    public resize(): void {
        this._resizeTimer = Toolkit.delayedExecution(() => {
            this._setSlideWidth();
            this._setLeftPositions();
        }, 100, this._resizeTimer);
    }

    public showPreviousImage():boolean {
        return this.showImage(this.currentSlideNumber - 1);
    }


    public showNextImage():boolean {
        return this.showImage(this.currentSlideNumber + 1);
    }


    public showImage(imageNumber:number):boolean {
        const oldGalleryImageNumber = this.currentSlideNumber;

        if (typeof imageNumber !== 'number' || this.numImages < imageNumber || imageNumber < 1) {
            return false;
        }

        this._beforeImageChanged(oldGalleryImageNumber, imageNumber, () => {
            this._imageChange(imageNumber);
        });
        return true;
    }

    
    private _beforeImageChanged(currentSlide:number, nextSlide:number, runImageChange:() => void) {
        if (typeof this._beforeImageChangeListener === 'function') {
            this._beforeImageChangeListener(() => {
                runImageChange();
                this._animate(nextSlide);
            }, currentSlide - 1, nextSlide - 1);
        } else {
            runImageChange();
            this._animate(nextSlide);
        }
    }


    private _imageChange(imageNumber:number):boolean {
        const newActive = this.getSlideDom(imageNumber - 1),
              oldActive = this.getSlideDom(this.currentSlideNumber - 1),
              newBgActive = this.getBgImageDom(imageNumber - 1),
              oldBgActive = this.getBgImageDom(this.currentSlideNumber - 1);

        if (!newActive) {
            return false;
        }

        oldBgActive?.classList.remove('crsl_active');
        newBgActive?.classList.add('crsl_active');

        oldActive?.classList.remove('crsl_active');
        newActive?.classList.add('crsl_active');

        this.currentSlideNumber = imageNumber;
        this._toggleNavigationStatus();

        this._setPrevNextSlide();
        return true;
    }


    private _setEvents() {
        window.addEventListener('resize', () => {
            this.resize();
        }, true);
    }


    private _toggleNavigationStatus():void {
        let arrowPrev = this._dom!.getElementsByClassName('crsl_navi_prev')[0],
            arrowNext = this._dom!.getElementsByClassName('crsl_navi_next')[0];

        function enableNavigationButton(element:Element):void {
            element.classList.remove('crsl_disabled');
            // element.firstChild.removeAttribute('arial-disabled');
        }
    
        function disableNavigationButton(element:Element):void {
            element.classList.add('crsl_disabled');
            // element.firstChild.setAttribute('arial-disabled', 'true');
        }

        // erstes Bild wird angezeigt => previous deaktivieren
        if (this.currentSlideNumber === 1) {
            disableNavigationButton(arrowPrev);
        } else {
            enableNavigationButton(arrowPrev);
        }

        // letztes Bild wird angezeigt => next deaktivieren
        if (this.currentSlideNumber === this.numImages) {
            disableNavigationButton(arrowNext);
        } else {
            enableNavigationButton(arrowNext);
        }
    }

    private _setPrevNextSlide():void {
        const prevDom = this.getSlideDom(this.currentSlideNumber - 2),
            nextDom = this.getSlideDom(this.currentSlideNumber);
    
        let setClass = (el: HTMLElement, className: string):void => {
            let prevEl = this._imageWrapperDom?.getElementsByClassName(className);
            if (prevEl && prevEl.length > 0) {
                prevEl[0].classList.remove(className);
            }
            el?.classList.add(className);
        };

        setClass(prevDom, 'crsl_slide_prev');
        setClass(nextDom, 'crsl_slide_next');
    }

    private _setupSlide(slide:ImageSlide, imageIndex:number, onLoadCallback?:() => void):void {
        let slideDom = this.getSlideDom(imageIndex),
            imageDom:HTMLImageElement,
            bgImageDom:HTMLElement | null = null;
    
        this._imagePath.push(slide);

        if (!slideDom) {
            slideDom = DomHelper.createContainer('crsl_slide');
            imageDom = DomHelper.createImage(slide.fgImage, 'crsl_image');
            slideDom.appendChild(imageDom);
    
            this._imageWrapperDom?.appendChild(slideDom);
        } else {
            imageDom = slideDom.firstChild as HTMLImageElement;
        }

        this._domSlides[imageIndex] = slideDom;

        if (slide.bgImage) {
            bgImageDom = this.getBgImageDom(imageIndex);
            if (!bgImageDom) {
                bgImageDom = DomHelper.createContainer('crsl_bg_image');
                this._bgContainer?.appendChild(bgImageDom);
            }
            bgImageDom.style.backgroundImage = 'url(' + slide.bgImage + ')';
            this._domBgImages[imageIndex] = bgImageDom;
        }
    
        this._loadImage(imageDom, slide.fgImage, function (e) {
            console.log('loaded', e);
        }, function(e) {
            console.log('error', e);
        });
    
        if (this.currentSlideNumber === imageIndex + 1) {
            slideDom.classList.add('crsl_active');
            slideDom.classList.add('crsl_active');
            bgImageDom?.classList.add('crsl_active');
        }
    }

    private _loadImage (
        imgDom: HTMLImageElement, 
        path: string, 
        onLoadCallback: (event: Event) => void,
        onErrorCallback: (event: Event) => void,
    ) : void {
    
        function loadCallback(event: Event): void {
            event.target?.removeEventListener('load', loadCallback);
            event.target?.removeEventListener('error', errorCallback);
            onLoadCallback(event);
        }
    
        function errorCallback(event: Event): void {
            event.target?.removeEventListener('load', loadCallback);
            event.target?.removeEventListener('error', errorCallback);
        }
    
        imgDom.addEventListener('load', loadCallback);
        imgDom.addEventListener('error', errorCallback);
        imgDom.src = path;
    }


    private _connectDom() {
        this._carouselContainer = this._dom!.querySelector('.crsl_container');
        this._bgContainer = this._dom!.querySelector('.crsl_bg_container');
        this._imageWrapperDom = this._dom!.querySelector('.crsl_image_wrapper');
    }


    private _buildNavigationDom(): void {
        let btnNavigationPrev, btnNavigationNext, slideIndicator, i, dotIndicators, numberIndicator;


        function addNavigationIcon(iconName: string, domNode: HTMLElement): void {
            const iconFile = iconName + '.svg';
            DomHelper.appendSVG(iconFile, domNode, () => {
                console.log('[+] ' + iconFile + ' loaded successfully');
            }, (error) => {
                console.error(error);
            });
        }

        const addNavigationEventHandler = (domNode: HTMLElement, type: 'prev' | 'next'):void => {
            Toolkit.addClickEvent(domNode, () => {
                if (type === 'prev') {
                    this.showPreviousImage();
                } else if (type === 'next') {
                    this.showNextImage();
                }
            });
        }
            

        /**
         * Closures für navigation events
         */
        let createSlideIndicatorListener = (j:number) => () => {
            this.showImage(j + 1);
        };

        btnNavigationPrev = DomHelper.createContainer('crsl_navigation crsl_navi_prev');
        addNavigationIcon('prev', btnNavigationPrev);
        this._dom!.appendChild(btnNavigationPrev);
        addNavigationEventHandler(btnNavigationPrev, 'prev');

        btnNavigationNext = DomHelper.createContainer('crsl_navigation crsl_navi_next');
        addNavigationIcon('next', btnNavigationNext);
        this._dom!.appendChild(btnNavigationNext);
        addNavigationEventHandler(btnNavigationNext, 'next');
    }


    private _setLeftPositions(): void {
        const left = (this.numImages - 1) / 2 * this._slideWidth - (this.currentSlideNumber - 1) * this._slideWidth;
        if (this._imageWrapperDom) {
            this._imageWrapperDom.style.left = left + 'px';
        }
        if (this._useWebAnimationsAPI) {
            this._animate(this.currentSlideNumber);
        }
    }


    private _setSlideWidth(): void {
        let width: number;
        const mobileOffset = 64;

        width = this._carouselContainer!.offsetWidth * ACTIVE_IMAGE_WIDTH / 100;
        this._slideWidth = width;

        for (let slideDom of this._domSlides) {
            (<HTMLElement>slideDom).style.width = width + 'px';
        }
    }


    private _animate(toSlide: number) {
        const newLeftVal = (this.numImages - 1) / 2 * this._slideWidth - this._slideWidth * (toSlide - 1);
        let startTime: number, animation: Animation | null, currentLeftVal: number;
        const cssLeft = this._imageWrapperDom!.style.left.replace('px', '');
        currentLeftVal = parseInt(cssLeft, 10);

        function animationStep(timestamp:number, el:HTMLElement, startVal:number, distance:number, duration:number){
            let leftVal: number, runtime: number, progress: number;

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
            animation = this._imageWrapperDom!.animate([
                {left: currentLeftVal + 'px'},
                {left: newLeftVal + 'px'}
            ],{
                duration: ANIMATION_DURATION,
                fill: 'forwards'
            });
            animation.addEventListener('finish', () => {
                this._imageWrapperDom!.style.left = newLeftVal + 'px';
            });
        } else {
            requestAnimationFrame((timestamp) => {
                startTime = timestamp || new Date().getTime();
                animationStep(
                    timestamp,
                    this._imageWrapperDom!,
                    currentLeftVal,
                    currentLeftVal - newLeftVal,
                    ANIMATION_DURATION
                );
            });
        }
    }
}

customElements.define('image-carousel', Carousel);
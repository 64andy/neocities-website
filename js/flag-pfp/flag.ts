import { ProfileImageRenderer } from "./renderer.js";
import { ImgDataHelper, getCanvas2dContext } from "../img-helpers.js";

const R = new ProfileImageRenderer();

var lock_isInitialized = false;
var lock_isRendering = false;

const mainCanvas = document.querySelector("canvas#result") as HTMLCanvasElement;

function panic(info: string): never {
    console.error(info);
    alert(info);
    throw new Error(info);
}


// The elements i'd need to access
const elems = {
    leftFlagUpload: document.querySelector('input#left-flag') as HTMLInputElement,
    rightFlagUpload: document.querySelector('input#right-flag') as HTMLInputElement,
    pfpUpload: document.querySelector('input#pfp') as HTMLInputElement,
    radiusSlider: document.querySelector('input#radius') as HTMLInputElement,
    radiusDisplay: document.querySelector('label#radius-display') as HTMLLabelElement,
    strengthSlider: document.querySelector('input#strength') as HTMLInputElement,
    strengthDisplay: document.querySelector('label#strength-display') as HTMLLabelElement,
    cropCheckbox: document.querySelector('input#cropped') as HTMLInputElement,
    angleSlider: document.querySelector('input#angle') as HTMLInputElement,
    angleDisplay: document.querySelector('label#angle-display') as HTMLLabelElement,
}

/**
 * Turns the file into an image, and saves it to
 * the global `Images` object with a key of imgName.
 */
async function _fileToImage(file: File | undefined, imgName: 'leftFlag' | 'rightFlag' | 'pfp', imageSmoothing = true, width?: number, height?: number) {
    let img;
    if (file != undefined) {
        img = await ImgDataHelper.fromFile(file, imageSmoothing, width, height);
    }
    switch (imgName) {
        case 'leftFlag':
            R.leftFlagLayer = img;
            break;
        case 'rightFlag':
            R.rightFlagLayer = img;
            break;
        case 'pfp':
            R.pfpLayer = img;
            break;
    }
    if (lock_isInitialized) renderPfp(mainCanvas);
}

// Method namespace: Contains events bound to the form
const formEvents = {
    async applyPfp(clear=false) {
        const files = elems.pfpUpload.files || panic("pfp isn't a file upload input; site's broken!");
        const file = (clear ? undefined : files[0]);
        await _fileToImage(file, 'pfp', true, mainCanvas.width, mainCanvas.height);
    },
    async applyLeftFlag(clear=false) {
        const files = elems.leftFlagUpload.files || panic("left-flag isn't a file upload input; site's broken!");
        const file = (clear ? undefined : files[0])
        await _fileToImage(file, 'leftFlag', false, mainCanvas.width, mainCanvas.width);
    },
    async applyRightFlag(clear=false) {
        const files = elems.rightFlagUpload.files || panic("right-flag isn't a file upload input; site's broken!");
        const file = (clear ? undefined : files[0])
        await _fileToImage(file, 'rightFlag', false, mainCanvas.width, mainCanvas.height);
    },

    async updateRadiusDisplay() {
        elems.radiusDisplay.innerText = `${elems.radiusSlider.value}%`;
    },

    async updateRadius() {
        await formEvents.updateRadiusDisplay();
        const radius = parseInt(elems.radiusSlider.value) / 100;
        R.radius = radius;
        if (lock_isInitialized) renderPfp(mainCanvas);
    },
    async updateFlagCrop() {
        R.isCropped = elems.cropCheckbox.checked
        if (lock_isInitialized) renderPfp(mainCanvas);
    },

    async updateStrengthDisplay() {
        elems.strengthDisplay.innerText = `${elems.strengthSlider.value}%`;
    },

    async updateStrength() {
        const warpStrength = parseInt(elems.strengthSlider.value) / 100;
        R.warpStrength = warpStrength;
        await formEvents.updateStrengthDisplay();
        if (lock_isInitialized) renderPfp(mainCanvas);
    },
    async updateAngleDisplay() {
        elems.angleDisplay.innerHTML = `${elems.angleSlider.value}&deg;`;
    },
    async updateAngle() {
        const angle = parseInt(elems.angleSlider.value);
        R.angle = angle;
        await formEvents.updateAngleDisplay();
        if (lock_isInitialized) renderPfp(mainCanvas);
    }
}


function clearCanvas(canvas: HTMLCanvasElement) {
    getCanvas2dContext(canvas).clearRect(0, 0, canvas.width, canvas.height);
}


function renderPfp(canvas: HTMLCanvasElement) {
    if (!lock_isInitialized) {
        console.warn("Won't render, not initialized yet");
        return;
    }
    // * Only one render can happen at a time
    if (lock_isRendering) {
        console.warn("Already rendering...");
        return;
    }
    lock_isRendering = true;

    clearCanvas(canvas);

    // * Get the images from the renderer
    let backgroundImg = R.renderBackground(canvas.width, canvas.height);
    let foregroundImg = R.renderForeground(canvas.width, canvas.height);
    
    // * Paint them on
    if (backgroundImg) backgroundImg.drawOntoCanvas(canvas);
    if (foregroundImg) foregroundImg.drawOntoCanvas(canvas);
    // If we can't render any layer, put a lil' message in
    if (!backgroundImg && !foregroundImg) {
        const ctx = getCanvas2dContext(canvas);
        ctx.font = "italic small-caps 30px Comic Sans MS";
        const no = ctx.measureText('no');
        const images = ctx.measureText('images');
        const added = ctx.measureText('added');
        const textHeight = no.actualBoundingBoxAscent + no.actualBoundingBoxDescent;
        ctx.fillStyle = "#D60270";
        ctx.fillText(
            "no",
            (canvas.width / 2) - (no.width/2),
            (canvas.height + textHeight) / 2 - 30
        );
        ctx.fillStyle = "#9B4F96";
        ctx.fillText(
            "images", 
            (canvas.width - images.width) / 2, 
            (canvas.height + textHeight) / 2
        );
        ctx.fillStyle = "#0038A8";
        ctx.fillText(
            "added", 
            (canvas.width / 2) - (added.width/2), 
            (canvas.height + textHeight) / 2 + 30
        );
    }

    // * Release the lock
    lock_isRendering = false;
}



function init() {
    // Trigger the events on the forms because browsers can remember on refresh
    Object.entries(formEvents).forEach(([funcName, func]) => {
        func().catch(console.error);
    });
    lock_isInitialized = true;
    renderPfp(mainCanvas);
}

// Make things accessible to the HTML
window.onload = init;
(<any>window).formEvents = formEvents;
(<any>window).elems = elems;
import { ImgDataHelper, ImageManipulations } from "./modules/img-helpers.js";

var ready = false;

const mainCanvas = document.getElementById("result");

const imageSettings = {
    radius: 0,
    isCropped: true,
    warpStrength: 1.0,
}

// Images
const Images = {
    /** @type {ImgDataHelper?} */
    leftFlag: null,
    /** @type {ImgDataHelper?} */
    rightFlag: null,
    /** @type {ImgDataHelper?} */
    pfp: null,
}

// The elements i'd need to access
var elems = {
    leftFlagUpload: document.getElementById('left-flag'),
    rightFlagUpload: document.getElementById('right-flag'),
    pfpUpload: document.getElementById('pfp'),
    radiusSlider: document.getElementById('radius'),
    radiusDisplay: document.getElementById('radius-display'),
    strengthSlider: document.getElementById('strength'),
    strengthDisplay: document.getElementById('strength-display'),
    cropCheckbox: document.getElementById('cropped'),
}

// Method namespace: Contains events bound to the form
var formEvents = {
    // Methods
    /**
     * Turns the file into an image, and saves it to
     * the global `Images` object with a key of imgName.
     */
    async _fileToImage(file, imgName, imageSmoothing = true, width = undefined, height = undefined) {
        if (file === undefined) {
            console.warn(`${imgName}: No pic uploaded yet`);
            return;
        }
        Images[imgName] = await ImgDataHelper.fromFile(file, imageSmoothing, width, height);
        if (ready) renderPfp(mainCanvas);
    },
    async applyPfp() {
        await formEvents._fileToImage(elems.pfpUpload.files[0], 'pfp', true, mainCanvas.width, mainCanvas.height);
    },
    async applyLeftFlag() {
        await formEvents._fileToImage(elems.leftFlagUpload.files[0], 'leftFlag', false, mainCanvas.width, mainCanvas.width);
    },
    async applyRightFlag() {
        await formEvents._fileToImage(elems.rightFlagUpload.files[0], 'rightFlag', false, mainCanvas.width, mainCanvas.height);

    },

    async updateRadiusDisplay() {
        elems.radiusDisplay.innerText = `${elems.radiusSlider.value}%`;
    },

    async updateRadius() {
        await formEvents.updateRadiusDisplay();
        imageSettings.radius = elems.radiusSlider.value / 100;
        if (ready) renderPfp(mainCanvas);
    },
    async updateFlagCrop() {
        imageSettings.isCropped = elems.cropCheckbox.checked;
        if (ready) renderPfp(mainCanvas);
    },

    async updateStrengthDisplay() {
        elems.strengthDisplay.innerText = `${elems.strengthSlider.value}%`;
    },

    async updateStrength() {
        await formEvents.updateStrengthDisplay();
        imageSettings.warpStrength = elems.strengthSlider.value / 100;
        if (ready) renderPfp(mainCanvas);
    }
}


/**
 * 
 * @param {CanvasRenderingContext2D} canvas 
 */
function clearCanvas(canvas) {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    // OK restore doesn't work so uhhh HACK TIME
    // Hey if anyone knows how to delete the clip then tell me
    // canvas.width--; canvas.width++;
}

function renderPfp(canvas) {
    if (!ready) {
        console.warn("Won't render, not properly initialized");
        return;
    }

    clearCanvas(canvas);

    let ctx = canvas.getContext('2d');
    ctx.font = "italic small-caps 30px Comic Sans MS";
    ctx.fillStyle = "pink";
    ctx.fillText("Sup\n>:)", 150, 200);
    ctx.fillText("Add something", 90, 250);

    let backgroundImg = null;
    let foregroundImg = null;
    // * Draw the underlying flag
    if (Images.leftFlag && Images.rightFlag) {
        // If both exist, show half the left and half the right
        backgroundImg = ImageManipulations.splitImageOverlay(Images.leftFlag, Images.rightFlag, canvas.width, canvas.height);
        backgroundImg = ImageManipulations.roundedWarp(backgroundImg, imageSettings.warpStrength);
    } else if (Images.leftFlag || Images.rightFlag) {
        // If one exists, stretch that one
        let existingFlag = (Images.leftFlag || Images.rightFlag);
        backgroundImg = ImageManipulations.roundedWarp(existingFlag, imageSettings.warpStrength);
    }
    // * If applicible, apply a circular crop to the background
    if (backgroundImg && imageSettings.isCropped) {
        backgroundImg = ImageManipulations.roundedCrop(backgroundImg);
    }
    // * Now, crop the foreground
    if (Images.pfp) {
        foregroundImg = ImageManipulations.roundedCrop(Images.pfp, imageSettings.radius);
    }
    // * Finally, paint them on
    if (backgroundImg) backgroundImg.drawOntoCanvas(canvas);
    if (foregroundImg) foregroundImg.drawOntoCanvas(canvas);
}


async function init() {
    // Trigger the events on the forms because browsers can remember on refresh
    for (const name in formEvents) {
        if (!name.startsWith('_')){
            console.log(`Calling formEvents.${name}();`);
            await formEvents[name]?.call();
        }
    }
    ready = true;
    renderPfp(mainCanvas);
}

// Make things accessible to the HTML
window.formEvents = formEvents;
window.onload = init;
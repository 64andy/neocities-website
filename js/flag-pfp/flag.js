import { Renderer } from "./renderer.js";
import { ImgDataHelper } from "../img-helpers.js";

const R = new Renderer();

var ready = false;

const mainCanvas = document.getElementById("result");



// The elements i'd need to access
const elems = {
    leftFlagUpload: document.getElementById('left-flag'),
    rightFlagUpload: document.getElementById('right-flag'),
    pfpUpload: document.getElementById('pfp'),
    radiusSlider: document.getElementById('radius'),
    radiusDisplay: document.getElementById('radius-display'),
    strengthSlider: document.getElementById('strength'),
    strengthDisplay: document.getElementById('strength-display'),
    cropCheckbox: document.getElementById('cropped'),
    angleSlider: document.getElementById('angle'),
    angleDisplay: document.getElementById('angle-display'),
}

// Method namespace: Contains events bound to the form
const formEvents = {
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
        const img = await ImgDataHelper.fromFile(file, imageSmoothing, width, height);
        R.setImage(imgName, img);
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
        const radius = elems.radiusSlider.value / 100;
        R.setImageSetting('radius', radius);
        if (ready) renderPfp(mainCanvas);
    },
    async updateFlagCrop() {
        R.setImageSetting('isCropped', elems.cropCheckbox.checked);
        if (ready) renderPfp(mainCanvas);
    },

    async updateStrengthDisplay() {
        elems.strengthDisplay.innerText = `${elems.strengthSlider.value}%`;
    },

    async updateStrength() {
        await formEvents.updateStrengthDisplay();
        const warpStrength = elems.strengthSlider.value / 100;
        R.setImageSetting('warpStrength', warpStrength);
        if (ready) renderPfp(mainCanvas);
    },
    async updateAngleDisplay() {
        elems.angleDisplay.innerText = elems.angleSlider.value;
    },
    async updateAngle() {
        await formEvents.updateAngleDisplay();
        const angle = elems.angleSlider.value;
        R.setImageSetting('angle', angle);
        if (ready) renderPfp(mainCanvas);
    }
}


/**
 * 
 * @param {CanvasRenderingContext2D} canvas 
 */
function clearCanvas(canvas) {
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}


function renderPfp(canvas) {
    if (!ready) {
        console.warn("Won't render, not properly initialized");
        return;
    }
    // * Only one render can happen at a time
    if (renderPfp.locked) {
        console.warn("Already rendering...");
        return;
    }
    renderPfp.locked = true;

    clearCanvas(canvas);

    let ctx = canvas.getContext('2d');
    ctx.font = "italic small-caps 30px Comic Sans MS";
    ctx.fillStyle = "pink";
    ctx.fillText("Sup >:)", 150, 200);
    ctx.fillStyle = "#903"
    ctx.fillText("Add something", 90, 250);

    // * Get the images from the renderer
    let backgroundImg = R.renderBackground(canvas.width, canvas.height);
    let foregroundImg = R.renderForeground(canvas.width, canvas.height);
    
    // * Paint them on
    if (backgroundImg) backgroundImg.drawOntoCanvas(canvas);
    if (foregroundImg) foregroundImg.drawOntoCanvas(canvas);

    // * Release the lock
    renderPfp.locked = false;
}



function init() {
    // Trigger the events on the forms because browsers can remember on refresh
    for (const name in formEvents) {
        if (!name.startsWith('_')) {
            formEvents[name]?.call().catch(err => console.error(err));
        }
    }
    ready = true;
    renderPfp(mainCanvas);
}

// Make things accessible to the HTML
window.formEvents = formEvents;
window.onload = init;
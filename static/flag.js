const mainCanvas = document.getElementById("yes");
/** @type {CanvasRenderingContext2D} */
const mainCtx = mainCanvas.getContext("2d");


const width = mainCanvas.getAttribute("width");
const height = mainCanvas.getAttribute("height");
var radius = 0;
var isCropped = true;

// Images
/** @type {HTMLCanvasElement} */
const flag = document.createElement('canvas');
flag.width = width;
flag.height = height;

/** @type {CanvasRenderingContext2D} */
const flagCtx = flag.getContext('2d');
flagCtx.imageSmoothingEnabled = false;  // GL_LINEAR


/** @type {HTMLCanvasElement} */
const pfp = document.createElement('canvas');
pfp.width = width;
pfp.height = height;

/** @type {CanvasRenderingContext2D} */
const pfpCtx = pfp.getContext('2d');

function init() {
    console.log("init()");
    // Save the initial context state because clips can't be removed otherwise
    mainCtx.save();
    // Reset the form because my browser doesn't on F5
    document.querySelector('form').reset();

    // Event handlers //
    let flagUpload = document.getElementById('flag');
    flagUpload.addEventListener('change', (e) => {
        readImage(e.target.files[0])
        .then((flagImg) => {
            return stretchFlagForCircles(flagImg);
        })
        .catch((err) => {
            console.error("Error reading the flag image:", err);
        })
        .then((newFlagImg) => {
            flagCtx.drawImage(newFlagImg, 0, 0, width, height);
            renderPfp(mainCanvas);
        })
    });

    let pfpUpload = document.getElementById('pfp');
    pfpUpload.addEventListener('change', (e) => {
        readImage(e.target.files[0])
        .then((pfpImg) => {
            pfpCtx.drawImage(pfpImg, 0, 0, width, height);
            renderPfp(mainCanvas);
        })
        .catch((err) => {
            console.error("Error reading the profile pic:", err);
        });
    });

    let radiusChange = document.getElementById('radius');
    radiusChange.addEventListener("change", (e) => {
        updateRadius(e.target.value);
        renderPfp(mainCanvas);
    });
    updateRadius(radiusChange.value);

    let cropCheckbox = document.getElementById('cropped');
    cropCheckbox.addEventListener("change", (e) => {
        let shouldCrop = e.target.checked;
        isCropped = shouldCrop;
        renderPfp(mainCanvas);
    })
}
/**
 * Updates the radius variable & radius display
 * @param {number} rad 
 */
function updateRadius(rad) {
    radius = rad;
    document.getElementById('radius-display').innerText = rad;
}

/** https://stackoverflow.com/a/46568146
 * Reads a file (from a form etc.), and returns it as an &lt; img >
 * @param {File} file The image file
 * @returns {Promise<HTMLImageElement>} 
 */
function readImage(file) {
    return new Promise((resolve, reject) => {
        var fr = new FileReader();  
        fr.onload = () => {
            let image = new Image();
            image.src = fr.result;
            image.onload = () => {
                resolve(image);
            };
            image.onerror = (err) => {
                console.error(err);
                reject("Can't parse image");
            };
        };

        fr.onerror = (err) => {
            console.error(err);
            reject("Can't read image");
        }

        fr.readAsDataURL(file);
      });
}

/**
 * 
 * @param {CanvasRenderingContext2D} canvas 
 */
function clearCanvas(canvas) {
    /** @type {CanvasRenderingContext2D} */
    let ctx = canvas.getContext('2d');
    ctx.restore();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // OK restore doesn't work so uhhh HACK TIME
    // Hey if anyone knows how to delete the clip then tell me
    canvas.width--; canvas.width++;
}

/**
 * Returns an image's pixels as a byte array.
 * It's just the canvas.getImageData function but automated
 * @param {HTMLImageElement} img
 * @returns {ImageData} An object representing the JS
 */
function getImagePixels(img, sx, sy, sw, sh) {
    // This is a hack, javascript is a hack, i hate it here, help
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false; // GL_LINEAR
    ctx.drawImage(img, 0, 0, width, height);

    let data = ctx.getImageData(sx, sy, sw, sh);
    console.log(data);
    return data;
}

/**
 * Stretches an image the closer it is to the edge, this makes it look nicer in a cropped circle
 * @param {HTMLImageElement} img 
 * @returns {HTMLCanvasElement}
 */
async function stretchFlagForCircles(img) {
    console.log("STRETCH STARTEEEEEEDDDDD");
    let w = width;
    let h = height;
    const getPos = (s, t) => {
        // Convert back to integer coords
        let i = Math.floor(s * (w-1));
        let j = Math.floor(t * (h-1));
        return (i*w + j) * 4;
    }
    const getPixel = (src, s, t) => {
        let pos = getPos(s, t);
        let px = src.slice(pos, pos+4);
        return px;
    }
    const writePixel = (src, px, i, j) => {
        let pos = getPos(s, t);
        for (let i = 0; i < px.length; i++) {
            src[pos+i] = px[i];
        }
    }
    
    let oldPixels = getImagePixels(img, 0, 0, w, h).data;
    let newPixels = new Uint8ClampedArray(oldPixels.length);
    let s, t;   // x,y texture coords between [0, 1]
    let sx, tx; // Offset by sin
    for (let i = 0; i < w; i++) {
        s = i/(w-1);    // See? I remember my graphics class
        sx = 0.5+(Math.asin(2*s-1))/Math.PI;
        for (let j = 0; j < h; j++) { 
            t = j/(h-1);
            tx = 0.5+(Math.asin(2*t-1))/Math.PI;
            // console.log(`${i}, ${j} = ${s}, ${t} -> ${(i*w + j)*4}`);
            let pixel = getPixel(oldPixels, sx, tx);
            writePixel(newPixels, pixel, s, t);
        }
    }
    let canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    let ctx = canvas.getContext('2d');
    let imgData = new ImageData(newPixels, w, h);
    ctx.putImageData(imgData, 0, 0);
    console.log("... stretch done");
    return canvas;
}

function renderPfp(canvas) {
    clearCanvas(canvas);

    /** @type {CanvasRenderingContext2D} */
    let ctx = canvas.getContext('2d');
    ctx.font = "italic small-caps 30px Comic Sans MS";
    ctx.fillText("Sup\n>:)", 150, 200);
    ctx.fillText("Add something", 90, 250);

    // Init: An overall circular clip, kinda represents what it looks like
    console.log("isCropped:", isCropped);
    if (isCropped) {
        let flagCropPath = new Path2D();
        flagCropPath.arc(width/2, height/2, height/2, 0, 2*Math.PI);
        ctx.clip(flagCropPath);
    }
    // Step 1: Draw the flag
    ctx.drawImage(flag, 0, 0, width, height);
    
    // Step 2a: Image clip
    let pfpRadiusClip = new Path2D();
    pfpRadiusClip.arc(width/2, height/2, (height/2)-radius, 0, 2*Math.PI);
    ctx.clip(pfpRadiusClip);
    // Step 2b: Draw the PFP
    // let pythag = radius * Math.SQRT1_2
    // TODO: Figure out the mathematics of not making this look shit
    ctx.drawImage(pfp, radius, radius, width-radius/2, height-radius/2);
}





function imSane() {
    mainCtx.fillStyle = "#ff0";
    mainCtx.fillRect(0, 0, 250, 250);
    mainCtx.closePath();
}
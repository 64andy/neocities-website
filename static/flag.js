const cnv = document.getElementById("yes");
/** @type {CanvasRenderingContext2D} */
const ctx = cnv.getContext("2d");


const width = cnv.getAttribute("width");
const height = cnv.getAttribute("height");
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
flagCtx.font = "30px Arial";
flagCtx.fillText("Cum", 10, 50);

/** @type {HTMLCanvasElement} */
const pfp = document.createElement('canvas');
pfp.width = width;
pfp.height = height;

/** @type {CanvasRenderingContext2D} */
const pfpCtx = pfp.getContext('2d');

function init() {
    console.log("init()");
    // Save the initial context state because clips can't be removed otherwise
    ctx.save();
    // Reset the form because my browser doesn't on F5
    document.querySelector('form').reset();

    // Event handlers //
    let flagUpload = document.getElementById('flag');
    flagUpload.addEventListener('change', (e) => {
        readImage(e.target.files[0])
        .then((flagImg) => {
            flagCtx.drawImage(flagImg, 0, 0, width, height);

            renderPfp();
        })
        .catch((err) => {
            console.error("Error in flagUpload's listener", err);

        });
    });

    let radiusChange = document.getElementById('radius');
    radiusChange.addEventListener("change", (e) => {
        updateRadius(e.target.value);
        renderPfp();
    });
    updateRadius(radiusChange.value);

    let cropCheckbox = document.getElementById('cropped');
    cropCheckbox.addEventListener("change", (e) => {
        let shouldCrop = e.target.checked;
        isCropped = shouldCrop;
        renderPfp();
    })
    
    // renderPfp();
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
 * @param {File} file
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

function renderPfp() {
    ctx.restore();
    ctx.clearRect(0, 0, width, height);
    // Init: An overall circular clip, kinda represents what it looks like
    console.log("isCropped:", isCropped);
    if (isCropped) {
        console.log("Setting clip")
        ctx.beginPath();
        ctx.arc(width/2, height/2, Math.min(width, height)/2, 0, 2*Math.PI);
        ctx.clip();
        ctx.closePath
    } else console.log("Not setting clip");
    // Step 1: Draw the flag
    ctx.drawImage(flag, 0, 0, width, height);
    
    // Step 2: Image clip
    // ctx.beginPath();
    // ctx.arc(width/2, height/2, (Math.min(width, height)/2)-radius, 0, 2*Math.PI);
    // ctx.clip();
    // ctx.closePath();
    // Step 3: Draw the PFP
    // ctx.drawImage(pfp, 0, 0, width, height);
}





function imSane() {
    ctx.fillStyle = "#ff0";
    ctx.fillRect(0, 0, 250, 250);
    ctx.closePath();
}
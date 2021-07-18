var cnv = document.getElementById("yes");
/** @type {CanvasRenderingContext2D} */
var ctx = cnv.getContext("2d");

var width = cnv.getAttribute("width");
var height = cnv.getAttribute("height");
var radius = 0;
var isCropped = true;

// Images
/** @type {HTMLCanvasElement} */
var flag = document.createElement('canvas');
flag.width = width;
flag.height = height;

/** @type {CanvasRenderingContext2D} */
var flagCtx = flag.getContext('2d');
flagCtx.imageSmoothingEnabled = false;  // GL_LINEAR
flagCtx.font = "30px Arial";
flagCtx.fillText("Cum", 10, 50);

/** @type {HTMLCanvasElement} */
var pfp = document.createElement('canvas');
pfp.width = width;
pfp.height = height;

/** @type {CanvasRenderingContext2D} */
var pfpCtx = pfp.getContext('2d');

function init() {
    // Reset the form because my browser doesn't on F5
    document.querySelector('form').reset();

    // Event handlers
    let flagUpload = document.getElementById('flag');
    flagUpload.addEventListener('change', (e) => {
        readImage(e.target.files[0])
        .then((flagImg) => {
            console.log(flagImg);
            flagCtx.drawImage(flagImg, 0, 0, width, height);

            console.log("Image added")
            renderPfp();
        })
        .catch((err) => {
            console.error("Error in flagUpload's listener", err);

        });
    });

    let radiusChange = document.getElementById('radius');
    radiusChange.addEventListener("change", (e) => {
        console.log("radius event");
        updateRadius(e.target.value);
        renderPfp();
    });
    updateRadius(radiusChange.value);

    
    renderPfp();
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
    console.log("readImage - START");
    return new Promise((resolve, reject) => {
        var fr = new FileReader();  
        fr.onload = () => {
            let image = new Image();
            image.src = fr.result;
            image.onload = () => {
                console.log("readImage - FINISHED");
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
    console.log("rendering...");
    // ctx.clearRect(0, 0, cnv.width, cnv.height)
    // Init: An overall circular clip, kinda represents what it looks like
    if (isCropped) {
        ctx.beginPath();
        ctx.arc(width/2, height/2, Math.min(width, height)/2, 0, 2*Math.PI);
        ctx.clip();
    }
    // Step 1: Draw the flag
    ctx.drawImage(flag, 0, 0, width, height);

    // Step 2: Image clip
    console.log("... rendered");
}
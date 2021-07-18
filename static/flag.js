var cnv = document.getElementById("yes");
/** @type {CanvasRenderingContext2D} */
var ctx = cnv.getContext("2d");

var width = cnv.getAttribute("width");
var height = cnv.getAttribute("height");
var radius = 0;

// Images
/** @type {HTMLCanvasElement} */
var flag = document.createElement('canvas');
flag.width = width;
flag.height = height;
/** @type {CanvasRenderingContext2D} */
var flagCtx = flag.getContext('2d');
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
    flagUpload.addEventListener('change', async (e) => {
        let flagImg = await readImage(e.target.files[0]);
        flagCtx.drawImage(flagImg, 0, 0, width, height);
        console.log("Image added")
    });

    let radiusChange = document.getElementById('radius');
    radiusChange.addEventListener("change", (e) => {
        updateRadius(e.target.value);
    });
    updateRadius(radiusChange.value);
    // Overall form event so if some shit happens
    //renderPfp();
}
/**
 * Updates the radius variable & radius display
 * @param {number} rad 
 */
function updateRadius(rad) {
    radius = rad;
    document.getElementById('radius-display').innerText = rad;
    console.log(rad);
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
            resolve(image)
        };
        fr.onerror = reject;
        fr.readAsDataURL(file);
      });
}


function renderPfp() {
    // Init: An overall circular clip, kinda represents what it looks like
    ctx.beginPath();
    ctx.arc(width/2, height/2, Math.min(width, height)/2, 0, 2*Math.PI);
    ctx.clip();
    // Step 1: Draw the flag
    ctx.fillStyle = "#f00";
    ctx.fillRect(0, 0, width, height/3);
    ctx.fillStyle = "#0f0";
    ctx.fillRect(0, height/3, width, height/3);
    ctx.fillStyle = "#00f";
    ctx.fillRect(0, 2*height/3, width, height/3);

    // Step 2: Image clip
    
}
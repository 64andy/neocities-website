/**
 * Gives a non-negative remainder
 * @param {number} lhs 
 * @param {number} rhs 
 * @returns {number} The remainder of `lhs / rhs`
 */
function rem(lhs, rhs) {
    return ((lhs % rhs) + rhs) % rhs;
}


/** https://stackoverflow.com/a/46568146
 * Reads a file (from a form etc.), and returns it as an &lt;img>
 * @param {File} file A file of an image 
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
                reject(err);
            };
        };

        fr.onerror = (err) => {
            console.error(err);
            reject(err);
        }

        fr.readAsDataURL(file);
    });
}

/**
 * Doing image manipulation in JS is a nightmare, because you
 * can't modify pixels or even *read* pixels without converting it
 * to a canvas.
 * 
 * This wrapper class allows manipulation of individual pixels.
 */
class ImgDataHelper {
    /** 
     * !!! You probably shouldn't directly call this !!!
     * 
     * Use one of the other constructors, like fromCanvas/fromFile/withSize etc.
    */
    constructor(imgData, imageSmoothing = true) {
        /** @type {ImageData} */
        this.imgData = imgData;
        /** @type {boolean} */
        this.imageSmoothing = imageSmoothing;
    }

    get width() { return this.imgData.width }
    get height() { return this.imgData.height }

    /**
     * Creates a copy of this instance, with the same dimensions
     * but no pixels set.
     * 
     * @returns {ImgDataHelper}
    */
    blankCopy() {
        const data = new ImageData(this.width, this.height);
        return new ImgDataHelper(data, this.imageSmoothing);
    }

    /**
     * Creates a new instance of ImgDataHelper, with the given width
     * and height, but no pixels set (image is transparent)
     * @param {number} width 
     * @param {number} height 
     * @param {boolean} imageSmoothing (Default: true)
     * Does the image blur when scaled
     * @returns {ImgDataHelper}
    */
    static withSize(width, height, imageSmoothing = true) {
        // I'm using a canvas because creating an ImageData
        // give a black image (because data is all 0's)
        const canvas = document.createElement('canvas'); canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').imageSmoothingEnabled = imageSmoothing;
        return ImgDataHelper.fromCanvas(canvas);
    }

    /**
     * Create a new ImgDataHelper from a canvas element.
     * 
     * @param {HTMLCanvasElement} canvas 
     * @returns {ImgDataHelper}
    */
    static fromCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return new ImgDataHelper(data, ctx.imageSmoothingEnabled);
    }

    /**
     * Turn a File object of an image into an ImgDataHelper
     * @param {File} file An image file
     * @param {boolean} imageSmoothing Whether the image will blur instead of
     * pixelating when scaled (Default: true)
     * @param {number?} width The target width.
     * @param {number?} height The target height.
     * @returns {ImgDataHelper} 
     * @throws {string | Event | ProgressEvent<FileReader>}
     * String or Event if the image conversion failed, and ProgressEvent if the file read failed.
    */
    static async fromFile(file, imageSmoothing = true, width = undefined, height = undefined) {
        const img = await readImage(file);
        width = (width === undefined) ? img.width : width;
        height = (height === undefined) ? img.height : height;
        // Pasting the image onto a canvas is the only way to read its pixels.
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = imageSmoothing;
        ctx.drawImage(img, 0, 0, width, height);
        return new ImgDataHelper(ctx.getImageData(0, 0, width, height), imageSmoothing)
    }

    /**
     * Creates a new canvas element from this image
     * 
     * @returns {HTMLCanvasElement} A canvas with this object's image painted on
    */
    toCanvas(width = null, height = null) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = (width !== null) ? width : this.width;
        canvas.height = (height !== null) ? height : this.height;
        ctx.imageSmoothingEnabled = this.imageSmoothing;
        if (canvas.width == this.width && canvas.height == this.height) {
            canvas.getContext('2d').putImageData(this.imgData, 0, 0);
        } else {
            this.drawOntoCanvas(canvas);
        }
        return canvas;
    }
    /**
     * Convert float [0, 1] UV co-ords to int <x, y> co-ords
     * 
     * @returns {[number, number]}
     */
    toXY(u, v) {
        let x = Math.round(u * (this.width - 1));
        let y = Math.round(v * (this.height - 1));
        return [x, y];
    }
    /**
     * Convert int <x, y> co-ords to float [0, 1] UV co-ords
     * 
     * @returns {[number, number]}
     */
    toUV(x, y) {
        let u = x / (this.width - 1);
        let v = y / (this.height - 1);
        return [u, v];
    }
    /**
     * Gets the RGBA pixel at the given position
     * @returns {[number, number, number, number]} An RGBA pixel
     */
    getPixel(x, y) {
        const pos = this._arrayPos(x, y)
        const px = this.imgData.data.slice(pos, pos + 4);
        return px;
    }
    /**
     * Gets the RGBA pixel at the given **UV position**
     * @returns {[number, number, number, number]} An RGBA pixel
     */
    getPixelUV(u, v) {
        const [x, y] = this.toXY(u, v);
        return this.getPixel(x, y);
    }
    /**
     * Writes the RGBA values to a pixel at the given position
     * @param {[number, number, number, number]} px An RGBA pixel
     * @param {number} x 
     * @param {number} y 
     */
    writePixel(px, x, y) {
        let pos = this._arrayPos(x, y);
        for (let i = 0; i < 4; i++) {       // RGBA, 4 bytes per pixel
            this.imgData.data[pos + i] = px[i];
        }
    }

    /**
     * Creates a new instance of this image, with a new size
     * @param {number} newWidth 
     * @param {number} newHeight 
     * @returns {ImgDataHelper}
     */
    resized(newWidth, newHeight) {
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        this.drawOntoCanvas(canvas);
        return ImgDataHelper.fromCanvas(canvas);
    }

    /**
     * Pastes this image onto another canvas.
     * 
     * posArgs are positional args that will get fed into a
     * `CanvasRenderingContext2D.drawImage()` method.
     * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
     * 
     * If left blank, it'll stretch this image across the target canvas.
     * 
     * @param {HTMLCanvasElement} target The canvas which gets drawn onto
     * @param {...number} posArgs Position args fed into drawImage()
    */
    drawOntoCanvas(target, ...posArgs) {
        const thisAsCanvas = this.toCanvas();
        const ctx = target.getContext('2d');
        // Change the base canvas imageSmoothing. We'll revert later
        const oldSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = this.imageSmoothing;
        if (posArgs.length === 0) {
            // Stretch over target
            ctx.drawImage(thisAsCanvas, 0, 0, target.width, target.height);
        } else {
            ctx.drawImage(thisAsCanvas, ...posArgs);
        }
        ctx.imageSmoothingEnabled = oldSmoothing;
    }

    /** @private */
    _arrayPos(x, y) {
        // Wrapping policy - Repeat
        if (!Number.isInteger(x) || !Number.isInteger(y)) alert("FUCK YOU PROVIDE INTS")
        x = rem(x, this.width);
        y = rem(y, this.height);
        return (y * this.width + x) * 4
    }
}

/**
 * A namespace for functions that take images
 */
const ImageManipulations = {
    /**
     * Warps an image, to make flag borders look alright
     * @param {ImgDataHelper} src 
     * @param {number} strength A number from [0, 1], determines the warp strength.
     * 0 means no warp, 1 means full warp.
     * @returns {ImgDataHelper} A new image, freshly warped.
     */
    roundedWarp(src, strength) {
        const _warp = (x) => {
            // The corrective warp algorithm with interpolation.
            const offset = 0.5 + (Math.asin(2 * x - 1)) / Math.PI;
            const lerp = (offset * strength) + (x * (1 - strength));
            return lerp;
        }
        let output = src.blankCopy();
        for (let x = 0; x < src.width; x++) {
            for (let y = 0; y < src.height; y++) {
                let [u, v] = src.toUV(x, y);
                let u_offset = _warp(u);
                let v_offset = _warp(v);
                let px = src.getPixelUV(u_offset, v_offset);
                output.writePixel(px, x, y);
            }
        }
        return output;
    },
    /**
     * Applies an elliptical crop to the image.
     * @param {ImgDataHelper} src 
     * @param {number} size A number from [0, 1], determining the crop radius.
     * 0 touches the edges, shrinking into nothing at 1. (default: 0) 
     * @returns {ImgDataHelper} A new image, freshly cropped.
     */
    roundedCrop(src, size = 0) {
        const output = document.createElement('canvas');
        const ctx = output.getContext('2d')
        output.width = src.width;
        output.height = src.height;
        ctx.imageSmoothingEnabled = src.imageSmoothing
        // Cheating and using canvas clipping
        const circleArc = new Path2D();
        const radiusX = src.width * 0.5 * (1 - size);
        const radiusY = src.height * 0.5 * (1 - size);
        circleArc.ellipse(
            src.width / 2, src.height / 2,  // Centre of circle
            radiusX, radiusY,
            0,                              // Unrotated
            0, 2 * Math.PI                  // Do a full rotation
        )
        ctx.clip(circleArc);
        src.drawOntoCanvas(output)
        return ImgDataHelper.fromCanvas(output);
    },
    /**
     * Outputs a split image with one half on the left, one half on the right
     * @param {ImgDataHelper} leftImg Image put on the left
     * @param {ImgDataHelper} rightImg Image put on the right
     * @param {number} width Output image's width
     * @param {number} height Output image's height
     * @param {number} lineAngle The angle of the split [0, 360]. (Default: 0)
     * @returns {ImgDataHelper} The freshly output image
     */
    splitImageOverlay(leftImg, rightImg, width, height, lineAngle=0) {
        const output = document.createElement('canvas');
        const ctx = output.getContext('2d');
        output.width = width;
        output.height = height;
        lineAngle = lineAngle * Math.PI / 180;
        // Apply the base image
        rightImg.drawOntoCanvas(output);
        // Use a clip for the 2nd image
        ctx.translate(width/2, height/2);
        ctx.rotate(lineAngle);
        ctx.rect(-width/2, -height/2, width/2, height); ctx.clip();
        ctx.rotate(-lineAngle);
        ctx.translate(-width/2, -height/2);
        leftImg.drawOntoCanvas(output);
        // Turn it back into an ImgData
        return ImgDataHelper.fromCanvas(output);
    }
}

export { ImgDataHelper, ImageManipulations };
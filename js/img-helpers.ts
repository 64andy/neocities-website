/**
 * Gives a non-negative remainder
 */
function rem(lhs: number, rhs: number): number {
    return ((lhs % rhs) + rhs) % rhs;
}

function panic(info: string): never {
    console.error(info);
    alert(info);
    throw new Error(info);
}

/**
 * Helper function because canvas.getContext can fail
 * @param canvas The HTML &lt;canvas&gt; element
 * @returns A 2D rendering context, fresh for the drawing.
 */
function getCanvas2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | never {
    const ctx = canvas.getContext('2d')
                || panic("Couldn't get canvas context, your browser's too old!");
    return ctx;
}


/** https://stackoverflow.com/a/46568146
 * Reads a file (from a form etc.), and returns it as a HTML Image element
 * @param {File} file A file of an image 
 */
function readImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        var fr = new FileReader();
        fr.onload = () => {
            let image = new Image();
            // .result's type changes depending on the initiating function.
            // Here, `.readAsDataURL()` ensures it's a string of B64.
            // JS is a silly language :(
            let result = fr.result as string;
            image.src = result;
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

type Pixel = [number, number, number, number];

/**
 * Doing image manipulation in JS is a nightmare, because you
 * can't modify pixels or even *read* pixels without converting it
 * to a canvas.
 * 
 * This wrapper class allows manipulation of individual pixels.
 */
class ImgDataHelper {

    public imgData: ImageData;
    public imageSmoothing: boolean;

    private constructor(imgData: ImageData, imageSmoothing = true) {
        this.imgData = imgData;
        this.imageSmoothing = imageSmoothing;
    }

    get width() { return this.imgData.width }
    get height() { return this.imgData.height }

    /**
     * Creates a new instance, with the same dimensions
     * but completely transparent.
    */
    blankCopy(): ImgDataHelper {
        const data = new ImageData(this.width, this.height);
        return new ImgDataHelper(data, this.imageSmoothing);
    }

    /**
     * Creates a new instance of ImgDataHelper, with the given width
     * and height, but no pixels set (image is transparent)
     * @param imageSmoothing Does the image blur when scaled (Default: true)
    */
    static withSize(width: number, height: number, imageSmoothing: boolean = true): ImgDataHelper {
        // I'm using a canvas because creating an ImageData
        // give a black image (because data is all 0's)
        const canvas = document.createElement('canvas'); canvas.width = width;
        canvas.height = height;
        getCanvas2dContext(canvas).imageSmoothingEnabled = imageSmoothing;
        return ImgDataHelper.fromCanvas(canvas);
    }

    /**
     * Create a new ImgDataHelper from a canvas element.
     * 
     * @param {HTMLCanvasElement} canvas 
     * @returns {ImgDataHelper}
    */
    static fromCanvas(canvas: HTMLCanvasElement): ImgDataHelper {
        const ctx = getCanvas2dContext(canvas);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return new ImgDataHelper(data, ctx.imageSmoothingEnabled);
    }

    /**
     * Turn a File object of an image into an ImgDataHelper
     * @param file An image file
     * @param imageSmoothing Whether the image will blur instead of
     * pixelating when scaled (Default: true)
     * @param width The target width.
     * @param height The target height.
     * @throws {string | Event | ProgressEvent<FileReader>}
     * String or Event if the image conversion failed, and ProgressEvent if the file read failed.
    */
    static async fromFile(file: File, imageSmoothing: boolean = true, width?: number, height?: number): Promise<ImgDataHelper> {
        const img = await readImage(file);
        width = (width === undefined) ? img.width : width;
        height = (height === undefined) ? img.height : height;
        // Pasting the image onto a canvas is the only way to read its pixels.
        const canvas = document.createElement('canvas')
        const ctx = getCanvas2dContext(canvas);
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
    toCanvas(width = null, height = null): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        const ctx = getCanvas2dContext(canvas);
        canvas.width = (width !== null) ? width : this.width;
        canvas.height = (height !== null) ? height : this.height;
        ctx.imageSmoothingEnabled = this.imageSmoothing;
        if (canvas.width == this.width && canvas.height == this.height) {
            ctx.putImageData(this.imgData, 0, 0);
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
    toXY(u: number, v: number): [number, number] {
        let x = Math.round(u * (this.width - 1));
        let y = Math.round(v * (this.height - 1));
        return [x, y];
    }
    /**
     * Convert int <x, y> co-ords to float [0, 1] UV co-ords
     * 
     * @returns {[number, number]}
     */
    toUV(x: number, y: number): [number, number] {
        let u = x / (this.width - 1);
        let v = y / (this.height - 1);
        return [u, v];
    }
    /**
     * Gets the RGBA pixel at the given position
     * @returns {Pixel} An RGBA pixel
     */
    getPixel(x: number, y: number): Pixel {
        const pos = this._arrayPos(x, y)
        const data = this.imgData.data;
        return [data[pos+0], data[pos+1], data[pos+2], data[pos+3]];
    }
    /**
     * Gets the RGBA pixel at the given **UV position**
     * @returns An RGBA pixel
     */
    getPixelUV(u: number, v: number): Pixel {
        const [x, y] = this.toXY(u, v);
        return this.getPixel(x, y);
    }
    /**
     * Writes the RGBA values to a pixel at the given position
     * @param px An RGBA pixel
     * @param x The 
     * @param y 
     */
    writePixel(px: Pixel, x: number, y: number): void {
        let pos = this._arrayPos(x, y);
        for (let i = 0; i < 4; i++) {       // RGBA, 4 bytes per pixel
            this.imgData.data[pos + i] = px[i];
        }
    }

    /**
     * Creates a new instance of this image, with a new size (Image will get stretched/strunk)
     */
    resized(newWidth: number, newHeight: number): ImgDataHelper {
        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        this.drawOntoCanvas(canvas);
        return ImgDataHelper.fromCanvas(canvas);
    }


    drawOntoCanvas(target: HTMLCanvasElement): void;
    drawOntoCanvas(target: HTMLCanvasElement, dx: number, dy: number): void;
    /**
     * Pastes this image onto another canvas.
     * 
     * posArgs are positional args that will get fed into a
     * `CanvasRenderingContext2D.drawImage()` method.
     * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
     * 
     * If left blank, it'll stretch this image across the target canvas.
     * 
     * @param target The canvas which gets drawn onto
     * @param dx the pixel x-pos where the output's drawn
     * @param dy the pixel y-pos where the output's drawn
     * 
    */
    drawOntoCanvas(target: HTMLCanvasElement, dx?: number, dy?: number): void {
        const thisAsCanvas = this.toCanvas();
        const ctx = getCanvas2dContext(target);
        // Change the base canvas imageSmoothing. We'll revert later
        const oldSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = this.imageSmoothing;
        if (dx !== undefined && dy !== undefined) {
            ctx.drawImage(thisAsCanvas, dx, dy);
        } else {
            // Stretch over target
            ctx.drawImage(thisAsCanvas, 0, 0, target.width, target.height);
        }
        ctx.imageSmoothingEnabled = oldSmoothing;
    }

    private _arrayPos(x: number, y: number) {
        // Wrapping policy - Repeat
        if (!Number.isInteger(x) || !Number.isInteger(y)) panic("FUCK YOU PROVIDE INTS")
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
    roundedWarp(src: ImgDataHelper, strength: number): ImgDataHelper {
        const _warp = (x: number) => {
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
     * @param size A number from [0, 1], determining the crop radius.
     * 0 touches the edges, shrinking into nothing at 1. (default: 0) 
     * @returns A new image, freshly cropped.
     */
    roundedCrop(src: ImgDataHelper, size: number = 0): ImgDataHelper {
        const output = document.createElement('canvas');
        const ctx = getCanvas2dContext(output);
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
    splitImageOverlay(leftImg: ImgDataHelper, rightImg: ImgDataHelper, width: number, height: number, lineAngle: number=0): ImgDataHelper {
        const output = document.createElement('canvas');
        const ctx = getCanvas2dContext(output);
        output.width = width;
        output.height = height;
        lineAngle = lineAngle * Math.PI / 180;
        // Clip needs to be as long as possible, longest
        // distance is corner-to-corner diagonally.
        const length = Math.hypot(width, height);
        const vertPos = (-height/2) - (length-height)/2;
        const horPos = 0;
        // Apply the base image
        leftImg.drawOntoCanvas(output);
        // Use a clip for the 2nd image
        ctx.translate(width/2, height/2);
        ctx.rotate(lineAngle);
        ctx.rect(horPos, vertPos, length/2, length); ctx.clip();
        ctx.rotate(-lineAngle);
        ctx.translate(-width/2, -height/2);
        rightImg.drawOntoCanvas(output);
        // Turn it back into an ImgData
        return ImgDataHelper.fromCanvas(output);
    }
}

export { ImgDataHelper, ImageManipulations, Pixel, getCanvas2dContext };
import { ImgDataHelper, ImageManipulations } from "../img-helpers.js"

class Renderer {
    constructor() {
        this.imageSettings = {
            radius: 0,
            isCropped: true,
            warpStrength: 1.0,
            angle: 0,
        };
        // The base images
        this.images = {
            /** @type {ImgDataHelper?} */
            leftFlag: null,
            /** @type {ImgDataHelper?} */
            rightFlag: null,
            /** @type {ImgDataHelper?} */
            pfp: null,
        };
        // The completed foreground and background images,
        // plus the settings that generated them.
        // If the settings haven't changed, just use the cached version.
        this.cache = {
            width: null,
            height: null,
            images: {
                foreground: {
                    /** @type {ImgDataHelper?} */
                    image: null,
                    usedValues: [
                        'pfp', 'radius'
                    ]
                },
                background: {
                    /** @type {ImgDataHelper?} */
                    image: null,
                    usedValues: [
                        'leftFlag', 'rightFlag', 'warpStrength', 'isCropped', 'angle'
                    ]
                },
            },
            dirty: {
                pfp: true,
                leftFlag: true,
                rightFlag: true,
                radius: true,
                isCropped: true,
                warpStrength: true,
                angle: true,
            }
        };
    }
    /**
     * Checks if an image is cached and valid.
     * (as in, the settings/images needed to make the image haven't changed)
     * If so, returns it.
     * @private
     * @param {'foreground' | 'background'} imgName What's the image called?
     * @param {number} width The width of the image you want.
     * @param {number} height If the size is different than the cached image,
     *                        you need to re-render.
     * @returns {ImgDataHelper?} The cached image if it's up to date
     */
    getCachedImage(imgName, width, height) {
        if (width !== this.cache.width || height !== this.cache.height) {
            return null;
        }
        for (const attrib of this.cache.images[imgName].usedValues) {
            if (this.cache.dirty[attrib])
                return null;
        }
        return this.cache.images[imgName].image;
    }

    /**
     * Sets the cached image, and un-dirties the cached image's settings.
     * @private
     * @param {'foreground' | 'background'} imgName What's the image called?
     * @param {ImgDataHelper} image The image to be saved
     */
    setCacheImage(imgName, image) {
        this.cache.width = image.width;
        this.cache.height = image.height;
        this.cache.images[imgName].image = image;
        for (const setting of this.cache.images[imgName].usedValues) {
            this.cache.dirty[setting] = false;
        }
    }

    /**
     * @param {String} setting The setting's name
     * @returns {any} The setting's value (different settings have different types)
     */
    getImageSetting(setting) {
        return this.imageSettings[setting]
    }

    /**
     * Sets the image setting, while also dirtying the cache.
     * @param {String} setting The setting's name
     * @param {any} value The value getting set
     * @throws {ReferenceError} ReferenceError if the setting name doesn't exist
     */
    setImageSetting(setting, value) {
        if (this.imageSettings[setting] === undefined)
            throw new ReferenceError(setting + " isn't a setting name");
        if (value === undefined || this.imageSettings[setting] === value)
            return;
        this.imageSettings[setting] = value;
        this.cache.dirty[setting] = true;
    }

    /**
     * @param {String} imageName The setting's name
     * @returns {ImgDataHelper}
     */
    getImage(imageName) {
        return this.images[imageName]
    }

    /**
     * Sets the new image, while also dirtying the cache.
     * @param {String} imageName The image's name
     * @param {ImgDataHelper} newImage The value getting set
     * @throws {ReferenceError} ReferenceError if the image name doesn't exist
     */
    setImage(imageName, newImage) {
        if (this.images[imageName] === undefined)
            throw new ReferenceError(imageName + " isn't an image");
        if (newImage === undefined)
            return;
        this.images[imageName] = newImage;
        this.cache.dirty[imageName] = true;
    }
    /**
     * Creates the background image, using the variables provided to this class.
     * 
     * Images needed: `leftFlag | rightFlag` (one or both)
     * 
     * Settings used: `angle (if both images are used), isCropped, warpStrength`
     * @param {number} width The width of the output
     * @param {number} height The height of the output
     * @returns {ImgDataHelper?} If this Renderer has enough data to make
     * a background, renders it. Otherwise, null.
     */
    renderBackground(width, height) {
        let backgroundImage;
        // Get the cached image, if it's up date date then use it
        backgroundImage = this.getCachedImage('background', width, height);
        if (backgroundImage)
            return backgroundImage;
        // Ok, cached image is out of date. Let's render it from scratch
        let leftImg = this.getImage('leftFlag');
        let rightImg = this.getImage('rightFlag');
        const angle = this.getImageSetting('angle');
        const isCropped = this.getImageSetting('isCropped');
        const warpStrength = this.getImageSetting('warpStrength');

        if (!leftImg && !rightImg) {
            // If no images have been uploaded, return null.
            return null;
        }
        if (leftImg && rightImg) {
            // If both have been uploaded, do a side-by-side split.
            if (radius != 0) {
                leftImg = ImageManipulations.roundedWarp(leftImg, warpStrength);
                rightImg = ImageManipulations.roundedWarp(rightImg, warpStrength);
            }
            backgroundImage = ImageManipulations.splitImageOverlay(leftImg, rightImg, width, height, angle);
        } else if (leftImg || rightImg) {
            // If only one image is set, simply warp
            backgroundImage = (leftImg || rightImg).resized(width, height);
            backgroundImage = ImageManipulations.roundedWarp(backgroundImage, warpStrength)
        }
        // Finally, crop if applicable
        if (isCropped)
            backgroundImage = ImageManipulations.roundedCrop(backgroundImage);
        // Finally, update cache
        this.setCacheImage('background', backgroundImage);

        return backgroundImage;
    }

    /**
     * Creates the foreground images, using the variables provided to this class.
     * 
     * Images needed: `pfp`
     * 
     * Settings used: `radius`
     * @param {number} width The width of the output
     * @param {number} height The height of the output
     * @returns {ImgDataHelper?} If you've provided all the images needed, it'll
     * return it. Otherwise, null.
     */
    renderForeground(width, height) {
        let croppedImage;
        // Check if we can get a cached version
        croppedImage = this.getCachedImage('foreground', width, height);
        if (croppedImage) {
            return croppedImage;
        }
        let pfp_img = this.getImage('pfp');
        const radius = this.getImageSetting('radius');
        // If an image hasn't been uploaded yet, return null
        if (!pfp_img) {
            return ImgDataHelper.withSize(width, height);
        }
        // Resize the pfp in case it's the wrong size
        if (pfp_img.width !== width || pfp_img.height !== height) {
            pfp_img = pfp_img.resized(width, height);
        }
        // The important part: Apply the crop.
        croppedImage = ImageManipulations.roundedCrop(pfp_img, radius);
        // Update the cache
        this.setCacheImage('foreground', croppedImage);

        return croppedImage;
    }
}

export { Renderer };
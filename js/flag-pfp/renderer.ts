import { ImgDataHelper, ImageManipulations } from "../img-helpers.js";

/*
Complaint: I do not like how JavaScript lacks first-class support for dictionaries/maps. There's a class, but it's clunky.
Complaint #2: I understand why TypeScript doesn't let you hack objects as maps, however it makes my code repetitive without it :^(
*/

/** The image settings that affect the foreground layer. Used by the cache to know what to re-render */
const FOREGROUND_TAGS = new Set(['pfp', 'radius']);
/** The image settings that affect the background layer. Used by the cache to know what to re-render */
const BACKGROUND_TAGS = new Set(['leftFlag', 'rightFlag', 'warpStrength', 'isCropped', 'angle']);

/**
 * Rendering both layers every time a setting changes is slow.
 * Plus, images settings only change one of these layers.
 * 
 * This cache will remember the   
 */
class CachedProfileImage {
  // The image should be re-rendered on a resize.
  private width?: number;
  private height?: number;
  /** The last known foreground image. Deleted when the shit is fuck */
  private foregroundLayer?: ImgDataHelper;
  private backgroundLayer?: ImgDataHelper;

  markChangedSettings(tag: string): void {
    if      (FOREGROUND_TAGS.has(tag)) this.foregroundLayer = undefined;
    else if (BACKGROUND_TAGS.has(tag)) this.backgroundLayer = undefined;
    else    throw new Error("Unknown tag: " + tag);
  }

  /**
   * Checks if an image layer is cached and valid.
   * (as in, the settings/images needed to make the image haven't changed)
   * If so, returns it.
   * @param width The width of the image you want. If the size is different than the cached image, you need to re-render.
   * @param height The height of the image you want. If the size is different than the cached image, you need to re-render.
   * @returns The cached image if it's up to date
   */
  tryGetCachedForeground(
    width: number,
    height: number
  ): ImgDataHelper | undefined {
    // If the image changed size we need to re-render.
    if (width !== this.width || height !== this.height) {
      return undefined;
    }
    return this.foregroundLayer;
  }

  /**
   * Checks if an image layer is cached and valid.
   * (as in, the settings/images needed to make the image haven't changed)
   * If so, returns it.
   * @param width The width of the image you want. If the size is different than the cached image, you need to re-render.
   * @param height The height of the image you want. If the size is different than the cached image, you need to re-render.
   * @returns The cached image if it's up to date
   */
  tryGetCachedBackground(
    width: number,
    height: number
  ): ImgDataHelper | undefined {
    // If the image changed size we need to re-render.
    if (width !== this.width || height !== this.height) {
      return undefined;
    }
    return this.backgroundLayer;
  }

  /**
   * Sets the cached foreground, and un-dirties the cached image's settings.
   * @param image The image to be saved
   */
  setForegroundCache(image: ImgDataHelper): void {
    this.width = image.width;
    this.height = image.height;
    this.foregroundLayer = image;
  }
  /**
   * Sets the cached background, and un-dirties the cached image's settings.
   * @param image The image to be saved
   */
  setBackgroundCache(image: ImgDataHelper): void{
    this.width = image.width;
    this.height = image.height;
    this.backgroundLayer = image;
  }
}

class ProfileImageRenderer {
  private imageSettings: {
    radius: number;
    isCropped: boolean;
    warpStrength: number;
    angle: number;
  };
  public layers: {
    leftFlag?: ImgDataHelper;
    rightFlag?: ImgDataHelper;
    pfp?: ImgDataHelper;
  };
  public cache: CachedProfileImage;

  constructor() {
    this.imageSettings = {
      radius: 0,
      isCropped: true,
      warpStrength: 1.0,
      angle: 0,
    };
    // The base layers
    this.layers = {};
    // Without a cache, this website is SUPER slow
    this.cache = new CachedProfileImage();
  }

  /** Getters */
  get radius() {return this.imageSettings.radius};
  get isCropped() {return this.imageSettings.isCropped};
  get warpStrength() {return this.imageSettings.warpStrength};
  get angle() {return this.imageSettings.angle};

  /** Setters */
  set radius(rad: number) {
    if (rad !== this.imageSettings.radius) {
      this.imageSettings.radius = rad;
      this.cache.markChangedSettings('radius');
    }
  }
  set isCropped(cropped: boolean) {
    if (cropped !== this.imageSettings.isCropped) {
      this.imageSettings.isCropped = cropped;
      this.cache.markChangedSettings('isCropped');
    }
  }
  set warpStrength(str: number) {
    if (str !== this.imageSettings.warpStrength) {
      this.imageSettings.warpStrength = str;
      this.cache.markChangedSettings('warpStrength');
    }
  }
  set angle(ang: number) {
    if (ang !== this.imageSettings.angle) {
      this.imageSettings.angle = ang;
      this.cache.markChangedSettings('angle');
    }
  }
  set leftFlagLayer(left: ImgDataHelper | undefined) {
    this.cache.markChangedSettings('leftFlag');
    this.layers.leftFlag = left;
  }
  set rightFlagLayer(right: ImgDataHelper | undefined) {
    this.cache.markChangedSettings('rightFlag');
    this.layers.rightFlag = right;
  }
  set pfpLayer(pfp: ImgDataHelper | undefined) {
    this.cache.markChangedSettings('pfp');
    this.layers.pfp = pfp;
  }

  /**
   * Creates the background image, using the variables provided to this class.
   *
   * Images needed: `leftFlag | rightFlag` (one or both)
   *
   * Settings used: `angle (if both images are used), isCropped, warpStrength`
   * @param width The width of the output
   * @param height The height of the output
   * @returns If this Renderer has both the left & right images, renders it. Otherwise, null.
   */
  renderBackground(width: number, height: number): ImgDataHelper | undefined {
    // Get the cached image, if it's up date date then use it
    let backgroundImage = this.cache.tryGetCachedBackground(width, height);
    if (backgroundImage) return backgroundImage;
    // Ok, cached image is out of date. Let's render it from scratch
    let leftImg = this.layers.leftFlag;
    let rightImg = this.layers.rightFlag;
    const angle = this.angle;
    const isCropped = this.isCropped;
    const warpStrength = this.warpStrength;
    const radius = this.radius;

    if (!leftImg && !rightImg) {
      // If no images have been uploaded, we can't do anything.
      return undefined;
    }
    if (leftImg && rightImg) {
      // If both have been uploaded, do a side-by-side split.
      if (radius !== 0) {
        leftImg = ImageManipulations.roundedWarp(leftImg, warpStrength);
        rightImg = ImageManipulations.roundedWarp(rightImg, warpStrength);
      }
      backgroundImage = ImageManipulations.splitImageOverlay(
        leftImg,
        rightImg,
        width,
        height,
        angle
      );
    } else {
      // If only one image is set, simply warp
      if (leftImg) 
        backgroundImage = leftImg.resized(width, height);
      else if (rightImg)
        backgroundImage = rightImg.resized(width, height);
      else throw new Error("IMPOSSIBLE");
      backgroundImage = ImageManipulations.roundedWarp(backgroundImage, warpStrength);
    }
    // Crop if applicable
    if (isCropped)
      backgroundImage = ImageManipulations.roundedCrop(backgroundImage);
    // Finally, update cache
    this.cache.setBackgroundCache(backgroundImage);

    return backgroundImage;
  }

  /**
   * Creates the foreground images, using the variables provided to this class.
   *
   * Images needed: `pfp`
   *
   * Settings used: `radius`
   * @param width The width of the output
   * @param height The height of the output
   * @returns If this Renderer has a PFP, renders it. Otherwise, null.
   */
  renderForeground(width: number, height: number): ImgDataHelper | undefined {
    let foregroundImage;
    // Check if we can get a cached version
    foregroundImage = this.cache.tryGetCachedForeground(width, height);
    if (foregroundImage) {
      return foregroundImage;
    }
    let pfp_img = this.layers.pfp;
    // If an image hasn't been uploaded yet, return null
    if (!pfp_img) {
      return undefined;
    }
    // Resize the pfp in case it's the wrong size
    if (pfp_img.width !== width || pfp_img.height !== height) {
      pfp_img = pfp_img.resized(width, height);
    }
    // The important part: Apply the crop.
    foregroundImage = ImageManipulations.roundedCrop(pfp_img, this.radius);
    // Update the cache
    this.cache.setForegroundCache(foregroundImage);

    return foregroundImage;
  }
}

export { ProfileImageRenderer };

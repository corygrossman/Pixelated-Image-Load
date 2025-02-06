import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";
import styles from "./style.module.scss";

/**
 * PixelatedImage Component
 * A React component that creates a pixelated loading effect for images.
 * The image starts highly pixelated and gradually becomes clearer when in view.
 *
 * @param {string} src - The source URL of the main image
 * @param {string} blurrySrc - The source URL of a blurry placeholder image
 * @param {number} initialPixelation - Starting pixelation factor (default: 64)
 * @param {number} threshold - Minimum pixelation level before showing clear image (default: 10)
 * @param {number} timeout - Delay between pixelation animation frames (default: 100)
 * @param {number} minResolution - Minimum resolution for pixelation effect (default: 1000)
 */
const PixelatedImage = ({
  src,
  blurrySrc,
  initialPixelation = 64,
  threshold = 10,
  timeout = 100,
  minResolution = 1000,
}) => {
  /**
   * State: Tracks whether the image has finished loading
   */
  const [imageLoaded, setImageLoaded] = useState(false);

  /**
   * State: Stores the dimensions of the canvas
   */
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 0,
    height: 0,
  });

  /**
   * Ref: Reference to the canvas element
   */
  const canvasRef = useRef(null);

  /**
   * Ref: Reference to the image element
   */
  const imgRef = useRef(null);

  /**
   * State: Tracks whether the animation has completed
   */
  const [animationComplete, setAnimationComplete] = useState(false);

  /**
   * Hook: useInView from motion/react
   * Tracks whether the canvas is in view
   */
  const inView = useInView(canvasRef, { once: true, amount: 0.5 });

  /**
   * Adjusts the canvas size based on the container and image dimensions
   * Maintains aspect ratio while ensuring minimum resolution for quality
   * @param {HTMLImageElement} image - The image element to base dimensions on
   */
  const adjustCanvasSize = (image) => {
    if (canvasRef.current) {
      const containerWidth = canvasRef.current.offsetWidth;
      const containerHeight = canvasRef.current.offsetHeight;

      // Calculate aspect ratio
      const imgAspectRatio = image.naturalWidth / image.naturalHeight;
      const containerAspectRatio = containerWidth / containerHeight;

      // Adjust canvas dimensions for object-fit: cover
      let width, height;

      if (imgAspectRatio > containerAspectRatio) {
        height = Math.max(containerHeight, minResolution);
        width = height * imgAspectRatio;
      } else {
        width = Math.max(containerWidth, minResolution);
        height = width / imgAspectRatio;
      }
      setCanvasDimensions({
        height,
        width,
      });
    }
  };

  /**
   * Draws the image on canvas with specified pixelation level
   * @param {HTMLImageElement} image - The image to draw
   * @param {number} pixelationFactor - Current level of pixelation
   */
  const drawImage = (image, pixelationFactor) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const { width, height } = canvasDimensions;

    // Clear the canvas
    context.clearRect(0, 0, width, height);

    // Draw the image at full resolution if pixelation is below threshold
    if (pixelationFactor < threshold) {
      context.drawImage(image, 0, 0, width, height);
      return;
    }

    // Draw the image at reduced resolution
    context.drawImage(image, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height).data;

    // This code creates a pixelated effect on the image
    // It iterates over the image in blocks of size 'pixelationFactor'
    for (let y = 0; y < height; y += pixelationFactor) {
      for (let x = 0; x < width; x += pixelationFactor) {
        // Calculate the index of the current pixel in the imageData array
        const pixelIndex = (x + y * width) * 4;

        // Set the fill color to the color of the current pixel
        // The color is in RGBA format, with each component ranging from 0 to 255
        context.fillStyle = `rgba(${imageData[pixelIndex]}, ${
          imageData[pixelIndex + 1]
        }, ${imageData[pixelIndex + 2]}, ${imageData[pixelIndex + 3] / 255})`;

        // Draw a filled rectangle of size 'pixelationFactor' at the current position
        // This creates the pixelated effect by making larger blocks of color
        context.fillRect(x, y, pixelationFactor, pixelationFactor);
      }
    }
  };

  /**
   * Recursively animates the pixelation effect
   * Reduces pixelation by half in each frame until threshold is reached
   * @param {HTMLImageElement} image - The image to animate
   * @param {number} currentPixelation - Current pixelation level
   */
  const animatePixelation = (image, currentPixelation) => {
    drawImage(image, currentPixelation);

    // Stop animation when pixelation factor is below the threshold
    if (currentPixelation < threshold) {
      setAnimationComplete(true);
      return;
    }

    setTimeout(() => {
      animatePixelation(image, currentPixelation / 2);
    }, timeout);
  };

  /**
   * Effect: Load the image and set the imageLoaded state
   */
  useEffect(() => {
    const image = new Image();
    image.src = src;
    image.crossOrigin = "Anonymous";

    image.onload = () => {
      imgRef.current = image;
      setImageLoaded(true);
      adjustCanvasSize(image);
    };
  }, [src]);

  /**
   * Effect: Start pixelation animation when image comes into view
   */
  useEffect(() => {
    if (inView && imgRef.current && imageLoaded && !animationComplete) {
      animatePixelation(imgRef.current, initialPixelation);
    }
  }, [inView, imageLoaded, initialPixelation]);

  /**
   * Effect: Handle window resize events
   */
  useEffect(() => {
    const handleResize = () => {
      if (imgRef.current && imageLoaded) {
        adjustCanvasSize(imgRef.current);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [imageLoaded]);

  return (
    <div className={styles.image_container}>
      <img
        src={blurrySrc}
        alt="Super Blury and Pixelated Image Used For Fast Loading"
      />
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default PixelatedImage;

import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

/**
 * Compresses an image to a target file size in KB
 * @param {string} uri - The image URI from ImagePicker
 * @param {number} targetSizeKB - Target size in KB (default 500KB)
 * @param {number} maxWidth - Maximum width (default 800)
 * @param {number} maxHeight - Maximum height (default 800)
 * @returns {Promise<Object>} - Compressed image result with uri and base64
 */
export const compressImage = async (
  uri,
  targetSizeKB = 500,
  maxWidth = 800,
  maxHeight = 800
) => {
  try {
    let quality = 0.8;
    let compressed = null;
    let attempts = 0;
    const maxAttempts = 5;
    const targetSizeBytes = targetSizeKB * 1024;

    console.log(`🖼️ Starting image compression. Target: ${targetSizeKB}KB`);

    // First, resize the image to reasonable dimensions
    let resized = await manipulateAsync(
      uri,
      [
        {
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        },
      ],
      {
        compress: quality,
        format: SaveFormat.JPEG,
        base64: true,
      }
    );

    // Check if initial resize is already under target
    const initialSize = getBase64Size(resized.base64);
    console.log(
      `📏 Initial size after resize: ${(initialSize / 1024).toFixed(2)}KB`
    );

    if (initialSize <= targetSizeBytes) {
      console.log(
        `✅ Initial resize met target size: ${(initialSize / 1024).toFixed(
          2
        )}KB`
      );
      return resized;
    }

    // Binary search for optimal quality
    let minQuality = 0.1;
    let maxQuality = quality;

    while (attempts < maxAttempts) {
      attempts++;

      compressed = await manipulateAsync(
        uri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxHeight,
            },
          },
        ],
        {
          compress: quality,
          format: SaveFormat.JPEG,
          base64: true,
        }
      );

      const currentSize = getBase64Size(compressed.base64);
      console.log(
        `🔄 Attempt ${attempts}: Quality ${quality.toFixed(2)}, Size: ${(
          currentSize / 1024
        ).toFixed(2)}KB`
      );

      if (currentSize <= targetSizeBytes || attempts >= maxAttempts) {
        break;
      }

      // Adjust quality using binary search
      if (currentSize > targetSizeBytes) {
        maxQuality = quality;
        quality = (minQuality + quality) / 2;
      } else {
        minQuality = quality;
        quality = (quality + maxQuality) / 2;
      }
    }

    const finalSize = getBase64Size(compressed.base64);
    console.log(
      `🎉 Compression complete! Final size: ${(finalSize / 1024).toFixed(
        2
      )}KB (${finalSize} bytes)`
    );

    return compressed;
  } catch (error) {
    console.error("❌ Image compression error:", error);
    throw new Error("Failed to compress image");
  }
};

/**
 * Calculate the size of a base64 string in bytes
 * @param {string} base64String - The base64 string
 * @returns {number} - Size in bytes
 */
const getBase64Size = (base64String) => {
  if (!base64String) return 0;

  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, "");

  // Calculate size: each base64 character represents 6 bits
  // So size in bytes = (length * 6) / 8, but accounting for padding
  const padding = (base64Data.match(/=/g) || []).length;
  return (base64Data.length * 3) / 4 - padding;
};

/**
 * Validate if the compressed image meets size requirements
 * @param {string} base64 - The base64 string
 * @param {number} maxSizeKB - Maximum allowed size in KB
 * @returns {boolean} - Whether the image is valid
 */
export const validateImageSize = (base64, maxSizeKB = 500) => {
  const sizeBytes = getBase64Size(base64);
  const sizeKB = sizeBytes / 1024;

  console.log(
    `🔍 Image validation: ${sizeKB.toFixed(2)}KB (max: ${maxSizeKB}KB) - ${
      sizeKB <= maxSizeKB ? "VALID" : "TOO LARGE"
    }`
  );

  return sizeKB <= maxSizeKB;
};

// imageUtils.js
// Compresses an image File to under maxSizeKB, scaling width down to maxWidth if needed.
// Returns a new File so FormData still gets the filename and type.

export const compressImage = (file, maxSizeKB = 500, maxWidth = 1200) => {
  return new Promise((resolve) => {
    // Non-image files pass through untouched
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Scale down proportionally if wider than maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        let quality = 0.82;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // Canvas toBlob failed — return original
                resolve(file);
                return;
              }

              const sizeKB = blob.size / 1024;

              if (sizeKB > maxSizeKB && quality > 0.2) {
                quality = Math.max(quality - 0.08, 0.2);
                tryCompress();
              } else {
                resolve(
                  new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  })
                );
              }
            },
            'image/jpeg',
            quality
          );
        };

        tryCompress();
      };

      img.onerror = () => resolve(file); // fallback: use original
      img.src = e.target.result;
    };

    reader.onerror = () => resolve(file); // fallback: use original
    reader.readAsDataURL(file);
  });
};

// Compress an array of images concurrently
export const compressImages = (files, maxSizeKB = 500, maxWidth = 1200) =>
  Promise.all(files.map((f) => compressImage(f, maxSizeKB, maxWidth)));

// Validate file size before upload (call this in your onChange handler)
export const validateImageFiles = (files, maxSizeMB = 5) => {
  const errors = [];
  files.forEach((file) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      errors.push(`${file.name} exceeds ${maxSizeMB}MB`);
    }
    if (!file.type.startsWith('image/')) {
      errors.push(`${file.name} is not an image`);
    }
  });
  return errors; // empty array = all good
};
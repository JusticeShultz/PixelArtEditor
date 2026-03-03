"use strict";

importScripts("./pixel-snapper.js");

const pixelSnapperApi = self.PixelSnapper ?? {};

self.addEventListener("message", (event) => {
  const message = event.data;
  if (!message || typeof message !== "object") {
    return;
  }

  if (message.type === "process") {
    handleProcessRequest(message);
    return;
  }

  if (message.type === "rasterize") {
    handleRasterizeRequest(message);
  }
});

function handleProcessRequest(message) {
  const { jobId, source, config, bypass } = message;

  try {
    postProgress(jobId, 0.08, bypass ? "Preparing source pixels..." : "Preparing worker...");

    const sourceImageData = deserializeImageData(source);
    if (!sourceImageData) {
      throw new Error("Could not read image data in the worker.");
    }

    postProgress(jobId, 0.22, bypass ? "Copying source pixels..." : "Running snap analysis...");

    const processed = bypass
      ? createBypassProcessed(sourceImageData)
      : {
        ...pixelSnapperApi.processImageData(sourceImageData, config ?? {}),
        mode: "snapped",
      };

    postProgress(jobId, 0.92, "Finalizing worker result...");

    const payload = serializeProcessed(processed);
    self.postMessage({
      type: "process-complete",
      jobId,
      processed: payload,
    }, getTransferables(payload));
  } catch (error) {
    self.postMessage({
      type: "process-error",
      jobId,
      error: error instanceof Error ? error.message : "Worker processing failed.",
    });
  }
}

function handleRasterizeRequest(message) {
  const { jobId, bitmap } = message;

  try {
    postRasterizeProgress(jobId, 0.12, "Decoding image off the main thread...");

    if (typeof OffscreenCanvas !== "function") {
      throw new Error("OffscreenCanvas is not available in this worker.");
    }

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
    if (!context) {
      throw new Error("Could not create a worker 2D context.");
    }

    context.drawImage(bitmap, 0, 0);
    postRasterizeProgress(jobId, 0.42, "Reading pixels...");

    const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
    postRasterizeProgress(jobId, 0.76, "Preparing image buffer...");

    if (typeof bitmap.close === "function") {
      bitmap.close();
    }

    const payload = serializeImageData(imageData);
    self.postMessage({
      type: "rasterize-complete",
      jobId,
      imageData: payload,
    }, [payload.data]);
  } catch (error) {
    if (bitmap && typeof bitmap.close === "function") {
      bitmap.close();
    }

    self.postMessage({
      type: "rasterize-error",
      jobId,
      error: error instanceof Error ? error.message : "Worker rasterization failed.",
    });
  }
}

function postProgress(jobId, value, message) {
  self.postMessage({
    type: "process-progress",
    jobId,
    value,
    message,
  });
}

function postRasterizeProgress(jobId, value, message) {
  self.postMessage({
    type: "rasterize-progress",
    jobId,
    value,
    message,
  });
}

function createBypassProcessed(imageData) {
  return {
    mode: "bypass",
    snappedImageData: cloneImageData(imageData),
    grid: {
      columns: Array.from({ length: imageData.width + 1 }, (_, index) => index),
      rows: Array.from({ length: imageData.height + 1 }, (_, index) => index),
      detectedWidth: imageData.width,
      detectedHeight: imageData.height,
    },
  };
}

function cloneImageData(imageData) {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}

function deserializeImageData(payload) {
  if (!payload || !payload.data || !Number.isFinite(payload.width) || !Number.isFinite(payload.height)) {
    return null;
  }

  return new ImageData(new Uint8ClampedArray(payload.data), payload.width, payload.height);
}

function serializeImageData(imageData) {
  return {
    width: imageData.width,
    height: imageData.height,
    data: imageData.data.buffer,
  };
}

function serializeProcessed(processed) {
  return {
    mode: processed.mode ?? "snapped",
    snappedImageData: serializeImageData(processed.snappedImageData),
    grid: processed.grid
      ? {
        columns: Array.isArray(processed.grid.columns) ? processed.grid.columns.slice() : [],
        rows: Array.isArray(processed.grid.rows) ? processed.grid.rows.slice() : [],
        detectedWidth: processed.grid.detectedWidth,
        detectedHeight: processed.grid.detectedHeight,
      }
      : null,
  };
}

function getTransferables(payload) {
  const buffers = [];

  if (payload?.snappedImageData?.data) {
    buffers.push(payload.snappedImageData.data);
  }

  return buffers;
}

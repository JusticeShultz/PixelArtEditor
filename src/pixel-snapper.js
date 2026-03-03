const DEFAULT_CONFIG = Object.freeze({
  kColors: 16,
  kSeed: 42,
  maxKmeansIterations: 15,
  paletteClampEnabled: false,
  paletteBalance: 1,
  peakThresholdMultiplier: 0.2,
  peakDistanceFilter: 4,
  walkerSearchWindowRatio: 0.35,
  walkerMinSearchWindow: 2,
  walkerStrengthThreshold: 0.5,
  sharpenStrength: 0,
  ditherStrength: 0,
  ditherJitter: 0,
  despecklePasses: 0,
  mixelStrength: 0,
  mixelGuard: 0.85,
  minCutsPerAxis: 4,
  fallbackTargetSegments: 64,
  maxStepRatio: 1.8,
  maxDimension: 10000,
});

function processImageData(sourceImageData, userConfig = {}) {
  const config = normalizeConfig(userConfig);
  const { width, height } = sourceImageData;

  validateImageDimensions(width, height, config.maxDimension);

  const preparedImageData = preprocessSourceImage(sourceImageData, config);
  const guidePaletteBudget = config.paletteClampEnabled
    ? config.kColors
    : estimateGuidePaletteBudget(preparedImageData, config.kColors);
  const guideImageData = quantizeImage(
    preparedImageData,
    { ...config, kColors: guidePaletteBudget }
  );
  const { colProfile, rowProfile } = computeProfiles(guideImageData);

  const stepX = estimateStepSize(colProfile, config);
  const stepY = estimateStepSize(rowProfile, config);
  const [resolvedStepX, resolvedStepY] = resolveStepSizes(stepX, stepY, width, height, config);

  const rawColCuts = walk(colProfile, resolvedStepX, width, config);
  const rawRowCuts = walk(rowProfile, resolvedStepY, height, config);

  const { colCuts, rowCuts } = stabilizeBothAxes(
    colProfile,
    rowProfile,
    rawColCuts,
    rawRowCuts,
    width,
    height,
    config
  );

  const snapSourceImageData = config.paletteClampEnabled
    ? guideImageData
    : preparedImageData;
  const snappedBaseImageData = resampleByCuts(snapSourceImageData, colCuts, rowCuts);
  const snappedImageData = postProcessPixelArt(snappedBaseImageData, config);

  return {
    quantizedImageData: guideImageData,
    snappedImageData,
    grid: {
      columns: colCuts,
      rows: rowCuts,
      detectedWidth: Math.max(colCuts.length - 1, 1),
      detectedHeight: Math.max(rowCuts.length - 1, 1),
    },
  };
}

function resamplePixelArt(sourceImageData, targetWidth, targetHeight) {
  const width = clampInteger(targetWidth, 1, DEFAULT_CONFIG.maxDimension);
  const height = clampInteger(targetHeight, 1, DEFAULT_CONFIG.maxDimension);

  if (width === sourceImageData.width && height === sourceImageData.height) {
    return cloneImageData(sourceImageData);
  }

  const srcWidth = sourceImageData.width;
  const srcHeight = sourceImageData.height;
  const srcData = sourceImageData.data;
  const output = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    const startYFloat = (y * srcHeight) / height;
    const endYFloat = ((y + 1) * srcHeight) / height;
    const y0 = clampInteger(Math.floor(startYFloat), 0, srcHeight - 1);
    const y1 = clampInteger(Math.ceil(endYFloat), y0 + 1, srcHeight);

    for (let x = 0; x < width; x += 1) {
      const startXFloat = (x * srcWidth) / width;
      const endXFloat = ((x + 1) * srcWidth) / width;
      const x0 = clampInteger(Math.floor(startXFloat), 0, srcWidth - 1);
      const x1 = clampInteger(Math.ceil(endXFloat), x0 + 1, srcWidth);

      let color;
      if (endXFloat - startXFloat <= 1 && endYFloat - startYFloat <= 1) {
        const sampleX = clampInteger(Math.floor((startXFloat + endXFloat) * 0.5), 0, srcWidth - 1);
        const sampleY = clampInteger(Math.floor((startYFloat + endYFloat) * 0.5), 0, srcHeight - 1);
        const offset = (sampleY * srcWidth + sampleX) * 4;
        color = [
          srcData[offset],
          srcData[offset + 1],
          srcData[offset + 2],
          srcData[offset + 3],
        ];
      } else {
        color = findDominantColorInBounds(srcData, srcWidth, x0, x1, y0, y1);
      }

      const outOffset = (y * width + x) * 4;
      output[outOffset] = color[0];
      output[outOffset + 1] = color[1];
      output[outOffset + 2] = color[2];
      output[outOffset + 3] = color[3];
    }
  }

  return new ImageData(output, width, height);
}

function drawImageDataToCanvas(imageData, canvas) {
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
  context.putImageData(imageData, 0, 0);
}

function imageDataToBlob(imageData, type = "image/png") {
  const canvas = document.createElement("canvas");
  drawImageDataToCanvas(imageData, canvas);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to encode image."));
        return;
      }
      resolve(blob);
    }, type);
  });
}

function normalizeConfig(userConfig) {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    kColors: clampInteger(
      userConfig.kColors ?? DEFAULT_CONFIG.kColors,
      1,
      256
    ),
    paletteClampEnabled: Boolean(userConfig.paletteClampEnabled ?? DEFAULT_CONFIG.paletteClampEnabled),
    paletteBalance: clampNumber(
      userConfig.paletteBalance ?? DEFAULT_CONFIG.paletteBalance,
      0.4,
      1.6,
      DEFAULT_CONFIG.paletteBalance
    ),
    peakThresholdMultiplier: clampNumber(
      userConfig.peakThresholdMultiplier ?? DEFAULT_CONFIG.peakThresholdMultiplier,
      0.02,
      0.95,
      DEFAULT_CONFIG.peakThresholdMultiplier
    ),
    sharpenStrength: clampNumber(
      userConfig.sharpenStrength ?? DEFAULT_CONFIG.sharpenStrength,
      0,
      1,
      DEFAULT_CONFIG.sharpenStrength
    ),
    ditherStrength: clampNumber(
      userConfig.ditherStrength ?? DEFAULT_CONFIG.ditherStrength,
      0,
      1,
      DEFAULT_CONFIG.ditherStrength
    ),
    ditherJitter: clampNumber(
      userConfig.ditherJitter ?? DEFAULT_CONFIG.ditherJitter,
      0,
      1,
      DEFAULT_CONFIG.ditherJitter
    ),
    despecklePasses: clampInteger(
      userConfig.despecklePasses ?? DEFAULT_CONFIG.despecklePasses,
      0,
      4,
      DEFAULT_CONFIG.despecklePasses
    ),
    mixelStrength: clampNumber(
      userConfig.mixelStrength ?? DEFAULT_CONFIG.mixelStrength,
      0,
      1,
      DEFAULT_CONFIG.mixelStrength
    ),
    mixelGuard: clampNumber(
      userConfig.mixelGuard ?? DEFAULT_CONFIG.mixelGuard,
      0,
      1,
      DEFAULT_CONFIG.mixelGuard
    ),
  };
}

function validateImageDimensions(width, height, maxDimension) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("Image dimensions cannot be zero.");
  }

  if (width > maxDimension || height > maxDimension) {
    throw new Error(`Image dimensions too large (max ${maxDimension}x${maxDimension}).`);
  }

  if (width < 3 || height < 3) {
    throw new Error("Image too small (minimum 3x3).");
  }
}

function preprocessSourceImage(sourceImageData, config) {
  if (config.sharpenStrength <= 0) {
    return sourceImageData;
  }

  const { width, height, data } = sourceImageData;
  const output = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3];

      if (alpha === 0) {
        output[offset] = data[offset];
        output[offset + 1] = data[offset + 1];
        output[offset + 2] = data[offset + 2];
        output[offset + 3] = alpha;
        continue;
      }

      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let weightTotal = 0;

      for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
        const sampleY = Math.max(0, Math.min(height - 1, y + yOffset));
        for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
          const sampleX = Math.max(0, Math.min(width - 1, x + xOffset));
          const sampleOffset = (sampleY * width + sampleX) * 4;
          const sampleAlpha = data[sampleOffset + 3];
          if (sampleAlpha === 0) {
            continue;
          }

          const weight = xOffset === 0 && yOffset === 0 ? 4 : 1;
          sumR += data[sampleOffset] * weight;
          sumG += data[sampleOffset + 1] * weight;
          sumB += data[sampleOffset + 2] * weight;
          weightTotal += weight;
        }
      }

      if (weightTotal === 0) {
        output[offset] = data[offset];
        output[offset + 1] = data[offset + 1];
        output[offset + 2] = data[offset + 2];
        output[offset + 3] = alpha;
        continue;
      }

      const blurR = sumR / weightTotal;
      const blurG = sumG / weightTotal;
      const blurB = sumB / weightTotal;
      const amount = config.sharpenStrength * 1.35;

      output[offset] = clampByte(data[offset] + ((data[offset] - blurR) * amount));
      output[offset + 1] = clampByte(data[offset + 1] + ((data[offset + 1] - blurG) * amount));
      output[offset + 2] = clampByte(data[offset + 2] + ((data[offset + 2] - blurB) * amount));
      output[offset + 3] = alpha;
    }
  }

  return new ImageData(output, width, height);
}

function postProcessPixelArt(sourceImageData, config) {
  let currentImageData = sourceImageData;

  for (let pass = 0; pass < config.despecklePasses; pass += 1) {
    currentImageData = despecklePixelArt(currentImageData);
  }

  const mixelPasses = config.mixelStrength >= 0.66
    ? 2
    : config.mixelStrength > 0
      ? 1
      : 0;

  for (let pass = 0; pass < mixelPasses; pass += 1) {
    currentImageData = cleanupMixels(currentImageData, config);
  }

  return currentImageData;
}

function despecklePixelArt(imageData) {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const centerOffset = (y * width + x) * 4;
      const centerKey = packColor(
        data[centerOffset],
        data[centerOffset + 1],
        data[centerOffset + 2],
        data[centerOffset + 3]
      );

      const neighborCounts = new Map();
      let matchingNeighbors = 0;

      for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
        for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
          if (xOffset === 0 && yOffset === 0) {
            continue;
          }

          const sampleOffset = ((y + yOffset) * width + (x + xOffset)) * 4;
          const neighborKey = packColor(
            data[sampleOffset],
            data[sampleOffset + 1],
            data[sampleOffset + 2],
            data[sampleOffset + 3]
          );

          if (neighborKey === centerKey) {
            matchingNeighbors += 1;
          }

          neighborCounts.set(neighborKey, (neighborCounts.get(neighborKey) ?? 0) + 1);
        }
      }

      if (matchingNeighbors >= 3) {
        continue;
      }

      let bestKey = centerKey;
      let bestCount = 0;

      for (const [neighborKey, count] of neighborCounts.entries()) {
        if (neighborKey === centerKey) {
          continue;
        }

        if (count > bestCount) {
          bestCount = count;
          bestKey = neighborKey;
        }
      }

      if (bestKey !== centerKey && bestCount >= 5) {
        const [red, green, blue, alpha] = unpackColor(bestKey);
        output[centerOffset] = red;
        output[centerOffset + 1] = green;
        output[centerOffset + 2] = blue;
        output[centerOffset + 3] = alpha;
      }
    }
  }

  return new ImageData(output, width, height);
}

function cleanupMixels(imageData, config) {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);
  const guard = clampNumber(config?.mixelGuard ?? DEFAULT_CONFIG.mixelGuard, 0, 1, DEFAULT_CONFIG.mixelGuard);

  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const pixels = [
        ((y * width) + x) * 4,
        ((y * width) + x + 1) * 4,
        (((y + 1) * width) + x) * 4,
        (((y + 1) * width) + x + 1) * 4,
      ];

      const counts = new Map();
      const offsetsByKey = new Map();

      for (const offset of pixels) {
        const key = packColor(
          data[offset],
          data[offset + 1],
          data[offset + 2],
          data[offset + 3]
        );

        counts.set(key, (counts.get(key) ?? 0) + 1);
        if (!offsetsByKey.has(key)) {
          offsetsByKey.set(key, []);
        }
        offsetsByKey.get(key).push(offset);
      }

      if (counts.size !== 2) {
        continue;
      }

      const sorted = Array.from(counts.entries()).sort((left, right) => right[1] - left[1]);
      const [majorityKey, majorityCount] = sorted[0];
      const [minorityKey, minorityCount] = sorted[1];

      if (majorityCount !== 3 || minorityCount !== 1) {
        continue;
      }

      const targetOffset = offsetsByKey.get(minorityKey)[0];
      const targetIndex = targetOffset / 4;
      const targetX = targetIndex % width;
      const targetY = Math.floor(targetIndex / width);
      const support = measureNeighborhoodSupport(
        data,
        width,
        height,
        targetX,
        targetY,
        majorityKey,
        minorityKey
      );
      const requiredMajority = guard >= 0.85
        ? 6
        : guard >= 0.55
          ? 5
          : 4;

      if (support.minoritySupport >= 2 && guard >= 0.25) {
        continue;
      }

      if (support.majoritySupport < requiredMajority) {
        continue;
      }

      if (support.otherSupport > 0 && guard >= 0.7) {
        continue;
      }

      const [red, green, blue, alpha] = unpackColor(majorityKey);
      output[targetOffset] = red;
      output[targetOffset + 1] = green;
      output[targetOffset + 2] = blue;
      output[targetOffset + 3] = alpha;
    }
  }

  return new ImageData(output, width, height);
}

function measureNeighborhoodSupport(data, width, height, x, y, majorityKey, minorityKey) {
  let majoritySupport = 0;
  let minoritySupport = 0;
  let otherSupport = 0;

  for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
    const sampleY = y + yOffset;
    if (sampleY < 0 || sampleY >= height) {
      continue;
    }

    for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
      const sampleX = x + xOffset;
      if (sampleX < 0 || sampleX >= width || (xOffset === 0 && yOffset === 0)) {
        continue;
      }

      const sampleOffset = ((sampleY * width) + sampleX) * 4;
      const sampleKey = packColor(
        data[sampleOffset],
        data[sampleOffset + 1],
        data[sampleOffset + 2],
        data[sampleOffset + 3]
      );

      if (sampleKey === majorityKey) {
        majoritySupport += 1;
      } else if (sampleKey === minorityKey) {
        minoritySupport += 1;
      } else {
        otherSupport += 1;
      }
    }
  }

  return {
    majoritySupport,
    minoritySupport,
    otherSupport,
  };
}

function quantizeImage(sourceImageData, config) {
  const { width, height, data } = sourceImageData;

  if (config.kColors <= 0) {
    throw new Error("Number of colors must be greater than 0.");
  }

  const samples = collectColorSamples(data, config.paletteBalance);
  const sampleCount = samples.length;

  if (sampleCount === 0) {
    return cloneImageData(sourceImageData);
  }

  const random = createMulberry32(config.kSeed);
  const k = Math.min(resolveSmartColorBudget(samples, config.kColors), sampleCount);
  const centroids = [];
  const distances = new Float64Array(sampleCount);
  distances.fill(Number.POSITIVE_INFINITY);

  centroids.push(samples[sampleIndex(random, sampleCount)].rgb.slice());

  for (let centroidIndex = 1; centroidIndex < k; centroidIndex += 1) {
    const lastCentroid = centroids[centroids.length - 1];
    let weightedDistanceSum = 0;

    for (let sampleIndexValue = 0; sampleIndexValue < sampleCount; sampleIndexValue += 1) {
      const sample = samples[sampleIndexValue];
      const distance = distanceSq(sample.rgb, lastCentroid);
      if (distance < distances[sampleIndexValue]) {
        distances[sampleIndexValue] = distance;
      }
      weightedDistanceSum += distances[sampleIndexValue] * sample.effectiveWeight;
    }

    if (weightedDistanceSum <= 0) {
      centroids.push(samples[sampleIndex(random, sampleCount)].rgb.slice());
      continue;
    }

    let threshold = random() * weightedDistanceSum;
    let chosenSample = samples[sampleCount - 1];

    for (let sampleIndexValue = 0; sampleIndexValue < sampleCount; sampleIndexValue += 1) {
      threshold -= distances[sampleIndexValue] * samples[sampleIndexValue].effectiveWeight;
      if (threshold <= 0) {
        chosenSample = samples[sampleIndexValue];
        break;
      }
    }

    centroids.push(chosenSample.rgb.slice());
  }

  let previousCentroids = centroids.map((centroid) => centroid.slice());

  for (let iteration = 0; iteration < config.maxKmeansIterations; iteration += 1) {
    const sums = Array.from({ length: k }, () => [0, 0, 0]);
    const weights = new Float64Array(k);

    for (let sampleIndexValue = 0; sampleIndexValue < sampleCount; sampleIndexValue += 1) {
      const sample = samples[sampleIndexValue];
      let bestCluster = 0;
      let minDistance = Number.POSITIVE_INFINITY;

      for (let centroidIndex = 0; centroidIndex < k; centroidIndex += 1) {
        const distance = distanceSq(sample.rgb, centroids[centroidIndex]);
        if (distance < minDistance) {
          minDistance = distance;
          bestCluster = centroidIndex;
        }
      }

      const weight = sample.effectiveWeight;
      sums[bestCluster][0] += sample.rgb[0] * weight;
      sums[bestCluster][1] += sample.rgb[1] * weight;
      sums[bestCluster][2] += sample.rgb[2] * weight;
      weights[bestCluster] += weight;
    }

    for (let centroidIndex = 0; centroidIndex < k; centroidIndex += 1) {
      if (weights[centroidIndex] === 0) {
        continue;
      }

      centroids[centroidIndex][0] = sums[centroidIndex][0] / weights[centroidIndex];
      centroids[centroidIndex][1] = sums[centroidIndex][1] / weights[centroidIndex];
      centroids[centroidIndex][2] = sums[centroidIndex][2] / weights[centroidIndex];
    }

    if (iteration > 0) {
      let maxMovement = 0;

      for (let centroidIndex = 0; centroidIndex < k; centroidIndex += 1) {
        const movement = distanceSq(centroids[centroidIndex], previousCentroids[centroidIndex]);
        if (movement > maxMovement) {
          maxMovement = movement;
        }
      }

      if (maxMovement < 0.01) {
        break;
      }
    }

    previousCentroids = centroids.map((centroid) => centroid.slice());
  }

  const output = new Uint8ClampedArray(width * height * 4);
  const bayerMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  const ditherScale = config.ditherStrength * 48;
  const jitterScale = config.ditherJitter * 28;

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * 4;
    const alpha = data[offset + 3];
    if (alpha === 0) {
      output[offset] = data[offset];
      output[offset + 1] = data[offset + 1];
      output[offset + 2] = data[offset + 2];
      output[offset + 3] = alpha;
      continue;
    }

    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const bayerBias = config.ditherStrength > 0
      ? ((bayerMatrix[y & 3][x & 3] / 15) - 0.5) * ditherScale
      : 0;
    const noiseBias = config.ditherJitter > 0
      ? (hashNoise(x, y, config.kSeed) - 0.5) * jitterScale
      : 0;
    const totalBias = bayerBias + noiseBias;
    const samplePoint = [
      clampByte(data[offset] + totalBias),
      clampByte(data[offset + 1] + totalBias),
      clampByte(data[offset + 2] + totalBias),
    ];

    let bestCentroid = centroids[0];
    let minDistance = Number.POSITIVE_INFINITY;

    for (let centroidIndex = 0; centroidIndex < k; centroidIndex += 1) {
      const centroid = centroids[centroidIndex];
      const distance = distanceSq(samplePoint, centroid);
      if (distance < minDistance) {
        minDistance = distance;
        bestCentroid = centroid;
      }
    }

    output[offset] = Math.round(bestCentroid[0]);
    output[offset + 1] = Math.round(bestCentroid[1]);
    output[offset + 2] = Math.round(bestCentroid[2]);
    output[offset + 3] = alpha;
  }

  return new ImageData(output, width, height);
}

function estimateGuidePaletteBudget(sourceImageData, requestedKColors) {
  const area = sourceImageData.width * sourceImageData.height;
  const baseline = Math.round(Math.sqrt(area) / 2.4);
  return clampInteger(
    Math.max(requestedKColors, baseline, 12),
    12,
    96,
    Math.max(requestedKColors, 12)
  );
}

function resolveSmartColorBudget(samples, requestedKColors) {
  const safeRequested = clampInteger(requestedKColors, 1, 256, DEFAULT_CONFIG.kColors);
  if (!samples.length) {
    return safeRequested;
  }

  const totalWeight = samples.reduce((sum, sample) => sum + sample.effectiveWeight, 0);
  if (totalWeight <= 0) {
    return Math.min(safeRequested, samples.length);
  }

  let entropy = 0;
  for (const sample of samples) {
    const ratio = sample.effectiveWeight / totalWeight;
    if (ratio > 0) {
      entropy -= ratio * Math.log(ratio);
    }
  }

  const normalizedEntropy = samples.length > 1
    ? entropy / Math.log(samples.length)
    : 0;
  const distinctPressure = Math.min(1, samples.length / Math.max(1, safeRequested * 2.5));
  const complexity = clampNumber(
    (normalizedEntropy * 0.72) + (distinctPressure * 0.28),
    0.12,
    1,
    0.5
  );
  const minimumBudget = Math.min(
    safeRequested,
    Math.max(2, Math.round(safeRequested * 0.35))
  );

  return clampInteger(
    Math.round(minimumBudget + ((safeRequested - minimumBudget) * complexity)),
    1,
    Math.min(safeRequested, samples.length),
    Math.min(safeRequested, samples.length)
  );
}

function computeProfiles(imageData) {
  const { width, height, data } = imageData;
  const grayscale = new Float64Array(width * height);

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * 4;
    const alpha = data[offset + 3];
    grayscale[pixel] = alpha === 0
      ? 0
      : (0.299 * data[offset]) + (0.587 * data[offset + 1]) + (0.114 * data[offset + 2]);
  }

  const colProfile = new Float64Array(width);
  const rowProfile = new Float64Array(height);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * width;
    for (let x = 1; x < width - 1; x += 1) {
      const left = grayscale[rowOffset + x - 1];
      const right = grayscale[rowOffset + x + 1];
      colProfile[x] += Math.abs(right - left);
    }
  }

  for (let x = 0; x < width; x += 1) {
    for (let y = 1; y < height - 1; y += 1) {
      const top = grayscale[(y - 1) * width + x];
      const bottom = grayscale[(y + 1) * width + x];
      rowProfile[y] += Math.abs(bottom - top);
    }
  }

  return { colProfile, rowProfile };
}

function estimateStepSize(profile, config) {
  if (!profile || profile.length < 3) {
    return null;
  }

  let maxValue = 0;
  for (let index = 0; index < profile.length; index += 1) {
    if (profile[index] > maxValue) {
      maxValue = profile[index];
    }
  }

  if (maxValue === 0) {
    return null;
  }

  const threshold = maxValue * config.peakThresholdMultiplier;
  const peaks = [];

  for (let index = 1; index < profile.length - 1; index += 1) {
    if (
      profile[index] > threshold &&
      profile[index] > profile[index - 1] &&
      profile[index] > profile[index + 1]
    ) {
      peaks.push(index);
    }
  }

  if (peaks.length < 2) {
    return null;
  }

  const cleanPeaks = [peaks[0]];

  for (let index = 1; index < peaks.length; index += 1) {
    if (peaks[index] - cleanPeaks[cleanPeaks.length - 1] > (config.peakDistanceFilter - 1)) {
      cleanPeaks.push(peaks[index]);
    }
  }

  if (cleanPeaks.length < 2) {
    return null;
  }

  const diffs = [];
  for (let index = 1; index < cleanPeaks.length; index += 1) {
    diffs.push(cleanPeaks[index] - cleanPeaks[index - 1]);
  }

  diffs.sort((left, right) => left - right);
  return diffs[Math.floor(diffs.length / 2)];
}

function resolveStepSizes(stepX, stepY, width, height, config) {
  if (stepX !== null && stepY !== null) {
    const ratio = stepX > stepY ? stepX / stepY : stepY / stepX;
    if (ratio > config.maxStepRatio) {
      const smaller = Math.min(stepX, stepY);
      return [smaller, smaller];
    }

    const average = (stepX + stepY) * 0.5;
    return [average, average];
  }

  if (stepX !== null) {
    return [stepX, stepX];
  }

  if (stepY !== null) {
    return [stepY, stepY];
  }

  const fallback = Math.max(Math.min(width, height) / config.fallbackTargetSegments, 1);
  return [fallback, fallback];
}

function stabilizeBothAxes(profileX, profileY, rawColCuts, rawRowCuts, width, height, config) {
  const colCutsPass1 = stabilizeCuts(
    profileX,
    rawColCuts.slice(),
    width,
    rawRowCuts,
    height,
    config
  );

  const rowCutsPass1 = stabilizeCuts(
    profileY,
    rawRowCuts.slice(),
    height,
    rawColCuts,
    width,
    config
  );

  const colCells = Math.max(colCutsPass1.length - 1, 1);
  const rowCells = Math.max(rowCutsPass1.length - 1, 1);
  const colStep = width / colCells;
  const rowStep = height / rowCells;
  const ratio = colStep > rowStep ? colStep / rowStep : rowStep / colStep;

  if (ratio <= config.maxStepRatio) {
    return { colCuts: colCutsPass1, rowCuts: rowCutsPass1 };
  }

  const targetStep = Math.min(colStep, rowStep);
  const finalColCuts = colStep > (targetStep * 1.2)
    ? snapUniformCuts(profileX, width, targetStep, config, config.minCutsPerAxis)
    : colCutsPass1;
  const finalRowCuts = rowStep > (targetStep * 1.2)
    ? snapUniformCuts(profileY, height, targetStep, config, config.minCutsPerAxis)
    : rowCutsPass1;

  return { colCuts: finalColCuts, rowCuts: finalRowCuts };
}

function walk(profile, stepSize, limit, config) {
  if (!profile || profile.length === 0) {
    throw new Error("Cannot walk on an empty profile.");
  }

  const cuts = [0];
  let currentPosition = 0;
  const searchWindow = Math.max(
    stepSize * config.walkerSearchWindowRatio,
    config.walkerMinSearchWindow
  );
  const meanValue = mean(profile);

  while (currentPosition < limit) {
    const target = currentPosition + stepSize;
    if (target >= limit) {
      cuts.push(limit);
      break;
    }

    const startSearch = Math.max(Math.floor(target - searchWindow), Math.floor(currentPosition + 1));
    const endSearch = Math.min(Math.floor(target + searchWindow), limit);

    if (endSearch <= startSearch) {
      currentPosition = target;
      continue;
    }

    let maxValue = -1;
    let maxIndex = startSearch;

    for (let index = startSearch; index < endSearch; index += 1) {
      if (profile[index] > maxValue) {
        maxValue = profile[index];
        maxIndex = index;
      }
    }

    if (maxValue > meanValue * config.walkerStrengthThreshold) {
      cuts.push(maxIndex);
      currentPosition = maxIndex;
    } else {
      const snappedTarget = Math.floor(target);
      cuts.push(snappedTarget);
      currentPosition = target;
    }
  }

  return cuts;
}

function stabilizeCuts(profile, cuts, limit, siblingCuts, siblingLimit, config) {
  if (limit === 0) {
    return [0];
  }

  const sanitizedCuts = sanitizeCuts(cuts, limit);
  const minRequired = Math.min(
    Math.max(config.minCutsPerAxis, 2),
    limit + 1
  );
  const axisCells = Math.max(sanitizedCuts.length - 1, 0);
  const siblingCells = Math.max(siblingCuts.length - 1, 0);
  const siblingHasGrid =
    siblingLimit > 0 &&
    siblingCells >= (minRequired - 1) &&
    siblingCells > 0;

  const stepsSkewed = siblingHasGrid && axisCells > 0
    ? isStepSkewed(limit, axisCells, siblingLimit, siblingCells, config.maxStepRatio)
    : false;

  if (sanitizedCuts.length >= minRequired && !stepsSkewed) {
    return sanitizedCuts;
  }

  let targetStep;
  if (siblingHasGrid) {
    targetStep = siblingLimit / siblingCells;
  } else if (config.fallbackTargetSegments > 1) {
    targetStep = limit / config.fallbackTargetSegments;
  } else if (axisCells > 0) {
    targetStep = limit / axisCells;
  } else {
    targetStep = limit;
  }

  if (!Number.isFinite(targetStep) || targetStep <= 0) {
    targetStep = 1;
  }

  return snapUniformCuts(profile, limit, targetStep, config, minRequired);
}

function sanitizeCuts(cuts, limit) {
  if (limit === 0) {
    return [0];
  }

  const normalized = cuts.slice();
  let hasZero = false;
  let hasLimit = false;

  for (let index = 0; index < normalized.length; index += 1) {
    let value = normalized[index];

    if (value === 0) {
      hasZero = true;
    }

    if (value >= limit) {
      value = limit;
    }

    if (value === limit) {
      hasLimit = true;
    }

    normalized[index] = value;
  }

  if (!hasZero) {
    normalized.push(0);
  }

  if (!hasLimit) {
    normalized.push(limit);
  }

  normalized.sort((left, right) => left - right);

  const deduped = [];
  for (let index = 0; index < normalized.length; index += 1) {
    if (index === 0 || normalized[index] !== normalized[index - 1]) {
      deduped.push(normalized[index]);
    }
  }

  return deduped;
}

function snapUniformCuts(profile, limit, targetStep, config, minRequired) {
  if (limit === 0) {
    return [0];
  }

  if (limit === 1) {
    return [0, 1];
  }

  let desiredCells = 0;
  if (Number.isFinite(targetStep) && targetStep > 0) {
    desiredCells = Math.round(limit / targetStep);
  }

  desiredCells = Math.min(
    Math.max(desiredCells, minRequired - 1, 1),
    limit
  );

  const cellWidth = limit / desiredCells;
  const searchWindow = Math.max(
    cellWidth * config.walkerSearchWindowRatio,
    config.walkerMinSearchWindow
  );
  const meanValue = profile.length === 0 ? 0 : mean(profile);
  let cuts = [0];

  for (let index = 1; index < desiredCells; index += 1) {
    const target = cellWidth * index;
    const previousCut = cuts[cuts.length - 1];

    if (previousCut + 1 >= limit) {
      break;
    }

    let start = Math.max(Math.floor(target - searchWindow), previousCut + 1, 0);
    let end = Math.min(Math.ceil(target + searchWindow), limit - 1);

    if (end < start) {
      start = previousCut + 1;
      end = start;
    }

    const profileEnd = Math.min(end, profile.length - 1);
    let bestIndex = Math.min(start, Math.max(profile.length - 1, 0));
    let bestValue = -1;

    for (let cursor = start; cursor <= profileEnd; cursor += 1) {
      const value = profile[cursor] ?? 0;
      if (value > bestValue) {
        bestValue = value;
        bestIndex = cursor;
      }
    }

    const strengthThreshold = meanValue * config.walkerStrengthThreshold;
    if (bestValue < strengthThreshold) {
      let fallbackIndex = Math.round(target);
      if (fallbackIndex <= previousCut) {
        fallbackIndex = previousCut + 1;
      }
      if (fallbackIndex >= limit) {
        fallbackIndex = Math.max(limit - 1, previousCut + 1);
      }
      bestIndex = fallbackIndex;
    }

    cuts.push(bestIndex);
  }

  if (cuts[cuts.length - 1] !== limit) {
    cuts.push(limit);
  }

  cuts = sanitizeCuts(cuts, limit);
  return cuts;
}

function resampleByCuts(imageData, cols, rows) {
  if (cols.length < 2 || rows.length < 2) {
    throw new Error("Insufficient grid cuts for resampling.");
  }

  const outputWidth = Math.max(cols.length - 1, 1);
  const outputHeight = Math.max(rows.length - 1, 1);
  const output = new Uint8ClampedArray(outputWidth * outputHeight * 4);
  const srcData = imageData.data;
  const srcWidth = imageData.width;

  for (let yIndex = 0; yIndex < outputHeight; yIndex += 1) {
    const yStart = rows[yIndex];
    const yEnd = rows[yIndex + 1];

    for (let xIndex = 0; xIndex < outputWidth; xIndex += 1) {
      const xStart = cols[xIndex];
      const xEnd = cols[xIndex + 1];
      const color = findDominantColorInBounds(srcData, srcWidth, xStart, xEnd, yStart, yEnd);
      const outputOffset = (yIndex * outputWidth + xIndex) * 4;

      output[outputOffset] = color[0];
      output[outputOffset + 1] = color[1];
      output[outputOffset + 2] = color[2];
      output[outputOffset + 3] = color[3];
    }
  }

  return new ImageData(output, outputWidth, outputHeight);
}

function findDominantColorInBounds(data, width, xStart, xEnd, yStart, yEnd) {
  if (xEnd <= xStart || yEnd <= yStart) {
    return [0, 0, 0, 0];
  }

  const counts = new Map();
  let bestKey = null;
  let bestCount = 0;

  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = xStart; x < xEnd; x += 1) {
      const offset = (y * width + x) * 4;
      const key = packColor(
        data[offset],
        data[offset + 1],
        data[offset + 2],
        data[offset + 3]
      );
      const nextCount = (counts.get(key) ?? 0) + 1;
      counts.set(key, nextCount);

      if (
        nextCount > bestCount ||
        (nextCount === bestCount && (bestKey === null || key < bestKey))
      ) {
        bestCount = nextCount;
        bestKey = key;
      }
    }
  }

  return bestKey === null ? [0, 0, 0, 0] : unpackColor(bestKey);
}

function collectColorSamples(data, paletteBalance) {
  const counts = new Map();

  for (let offset = 0; offset < data.length; offset += 4) {
    if (data[offset + 3] === 0) {
      continue;
    }

    const key = packRgb(data[offset], data[offset + 1], data[offset + 2]);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const samples = [];
  for (const [key, count] of counts.entries()) {
    samples.push({
      rgb: unpackRgb(key),
      count,
      effectiveWeight: Math.max(1, count ** paletteBalance),
    });
  }

  return samples;
}

function distanceSq(point, centroid) {
  const dr = point[0] - centroid[0];
  const dg = point[1] - centroid[1];
  const db = point[2] - centroid[2];
  return (dr * dr) + (dg * dg) + (db * db);
}

function mean(values) {
  if (!values.length) {
    return 0;
  }

  let total = 0;
  for (let index = 0; index < values.length; index += 1) {
    total += values[index];
  }
  return total / values.length;
}

function isStepSkewed(limit, axisCells, siblingLimit, siblingCells, maxStepRatio) {
  const axisStep = limit / axisCells;
  const siblingStep = siblingLimit / siblingCells;
  const ratio = axisStep / siblingStep;
  return ratio > maxStepRatio || ratio < (1 / maxStepRatio);
}

function sampleIndex(random, upperExclusive) {
  return Math.floor(random() * upperExclusive);
}

function createMulberry32(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function packColor(r, g, b, a) {
  return ((((r * 256) + g) * 256 + b) * 256) + a;
}

function unpackColor(key) {
  const alpha = key % 256;
  const blue = Math.floor(key / 256) % 256;
  const green = Math.floor(key / 65536) % 256;
  const red = Math.floor(key / 16777216) % 256;
  return [red, green, blue, alpha];
}

function packRgb(red, green, blue) {
  return ((red * 256) + green) * 256 + blue;
}

function unpackRgb(key) {
  const blue = key % 256;
  const green = Math.floor(key / 256) % 256;
  const red = Math.floor(key / 65536) % 256;
  return [red, green, blue];
}

function hashNoise(x, y, seed) {
  let value = ((x * 374761393) + (y * 668265263) + (seed * 2246822519)) >>> 0;
  value = (value ^ (value >>> 13)) >>> 0;
  value = Math.imul(value, 1274126177) >>> 0;
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function cloneImageData(imageData) {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}

function clampInteger(value, min, max, fallback = min) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(numeric)));
}

function clampNumber(value, min, max, fallback = min) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, numeric));
}

const PIXEL_SNAPPER_ROOT = typeof self !== "undefined"
  ? self
  : typeof window !== "undefined"
    ? window
    : globalThis;

PIXEL_SNAPPER_ROOT.PixelSnapper = {
  DEFAULT_CONFIG,
  drawImageDataToCanvas,
  imageDataToBlob,
  processImageData,
  quantizeImage,
  resamplePixelArt,
};

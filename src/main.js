(() => {
const {
  DEFAULT_CONFIG,
  drawImageDataToCanvas,
  imageDataToBlob,
  processImageData,
  quantizeImage,
  resamplePixelArt,
} = window.PixelSnapper ?? {};

const MAX_EXPORT_DIMENSION = 8192;
const IMPORT_EAGER_ANALYSIS_PIXEL_LIMIT = 262144;
const INTERACTIVE_SLIDER_DEFER_PIXEL_LIMIT = 1800000;
const MANUAL_TUNING_APPLY_PIXEL_LIMIT = 3600000;
const ANALYSIS_SAMPLE_MAX_DIMENSION = 320;
const INTERACTIVE_STYLE_MAX_DIMENSION = 768;
const WORKING_SAMPLE_MAX_DIMENSION = 1536;
const WORKING_SAMPLE_MAX_PIXELS = 2500000;
const SCALE_STEP = 0.05;
const SCALE_MIN = 0.05;
const SCALE_MAX = 16;
const MATERIAL_STYLES = {
  metal: { label: "Metal", color: "#a6dcff", rgb: [166, 220, 255] },
  glass: { label: "Glass", color: "#7bf2ff", rgb: [123, 242, 255] },
  liquid: { label: "Liquid", color: "#4ca3ff", rgb: [76, 163, 255] },
  emissive: { label: "Emissive", color: "#ffd862", rgb: [255, 216, 98] },
  organic: { label: "Organic", color: "#6bcf7f", rgb: [107, 207, 127] },
  wood: { label: "Wood", color: "#9a6d3b", rgb: [154, 109, 59] },
  leather: { label: "Leather", color: "#7b5640", rgb: [123, 86, 64] },
  cloth: { label: "Cloth", color: "#c18c63", rgb: [193, 140, 99] },
  stone: { label: "Stone", color: "#9399ab", rgb: [147, 153, 171] },
};
const LIGHT_SECTOR_STYLES = [
  { key: "top", label: "Top", color: "#7cffd4" },
  { key: "topRight", label: "Top-Right", color: "#4ee3cb" },
  { key: "right", label: "Right", color: "#62b8ff" },
  { key: "bottomRight", label: "Bottom-Right", color: "#87a6ff" },
  { key: "bottom", label: "Bottom", color: "#ffbe63" },
  { key: "bottomLeft", label: "Bottom-Left", color: "#ff9d72" },
  { key: "left", label: "Left", color: "#f586c4" },
  { key: "topLeft", label: "Top-Left", color: "#ad92ff" },
];
const SETTINGS_STORAGE_KEY = "pixel-snapper-settings-v1";
const DEFAULT_APP_SETTINGS = Object.freeze({
  theme: "default",
  rememberToolSettings: true,
  rememberActiveTabs: true,
  reducedMotion: false,
});
const PERSISTED_TOOL_CONTROL_IDS = [
  "paletteRange",
  "paletteClampEnabled",
  "engineProfile",
  "quickTuningPreset",
  "exportPaddingRange",
  "aspectLock",
  "powerOfTwo",
  "orderedDither",
  "exportMetadata",
  "exportPaletteLut",
  "exportMaterialMap",
  "exportNormalMap",
  "exportAoMap",
  "bypassSnap",
  "paletteBalanceRange",
  "gridSensitivityRange",
  "sharpenRange",
  "ditherRange",
  "noiseJitterRange",
  "despeckleRange",
  "mixelRange",
  "mixelGuardRange",
  "outlineEnabled",
  "outlineColor",
  "outlineThickness",
  "adaptivePaletteRange",
  "clusterSizeRange",
  "lightNormalizeRange",
  "edgeLockRange",
  "aaIntentRange",
  "rampRange",
  "ditherZoneRange",
  "indexedMode",
  "materialAware",
  "showHeatmap",
  "batchNormalize",
  "previewMode",
  "semanticAssist",
  "subjectMaskAssist",
  "smartTuneAssist",
  "assistStrengthRange",
  "assistPassesRange",
];

const QUICK_TUNING_PRESETS = Object.freeze({
  balanced_cleanup: {
    bypassSnap: false,
    paletteClamp: false,
    palette: 48,
    orderedDither: false,
    exportPadding: 0,
    powerOfTwo: false,
    paletteBalance: 105,
    gridSensitivity: 64,
    sharpen: 14,
    ditherStrength: 0,
    noiseJitter: 0,
    despeckle: 1,
    mixel: 12,
    mixelGuard: 90,
    outlineEnabled: false,
    outlineThickness: 1,
    outlineColor: "#101010",
    adaptivePalette: 12,
    clusterSize: 6,
    lightNormalize: 10,
    edgeLock: 85,
    aaIntent: 70,
    ramp: 10,
    ditherZone: 0,
    indexedMode: "off",
    materialAware: true,
    showHeatmap: false,
    batchNormalize: false,
    previewMode: "normal",
    semanticAssist: true,
    subjectMaskAssist: true,
    smartTuneAssist: true,
    assistStrength: 55,
    assistPasses: 3,
    exportMetadata: true,
    exportPaletteLut: false,
    exportMaterialMap: true,
    exportNormalMap: false,
    exportAoMap: false,
  },
  source_preserve: {
    bypassSnap: true,
    paletteClamp: false,
    palette: 64,
    orderedDither: false,
    exportPadding: 0,
    powerOfTwo: false,
    paletteBalance: 100,
    gridSensitivity: 63,
    sharpen: 0,
    ditherStrength: 0,
    noiseJitter: 0,
    despeckle: 0,
    mixel: 0,
    mixelGuard: 95,
    outlineEnabled: false,
    outlineThickness: 1,
    outlineColor: "#101010",
    adaptivePalette: 0,
    clusterSize: 6,
    lightNormalize: 0,
    edgeLock: 0,
    aaIntent: 100,
    ramp: 0,
    ditherZone: 0,
    indexedMode: "off",
    materialAware: false,
    showHeatmap: false,
    batchNormalize: false,
    previewMode: "normal",
    semanticAssist: true,
    subjectMaskAssist: true,
    smartTuneAssist: true,
    assistStrength: 40,
    assistPasses: 2,
    exportMetadata: false,
    exportPaletteLut: false,
    exportMaterialMap: false,
    exportNormalMap: false,
    exportAoMap: false,
  },
  crisp_sprite: {
    bypassSnap: false,
    paletteClamp: false,
    palette: 32,
    orderedDither: false,
    exportPadding: 1,
    powerOfTwo: false,
    paletteBalance: 95,
    gridSensitivity: 68,
    sharpen: 28,
    ditherStrength: 0,
    noiseJitter: 0,
    despeckle: 1,
    mixel: 18,
    mixelGuard: 92,
    outlineEnabled: false,
    outlineThickness: 1,
    outlineColor: "#0f1014",
    adaptivePalette: 8,
    clusterSize: 5,
    lightNormalize: 6,
    edgeLock: 96,
    aaIntent: 84,
    ramp: 8,
    ditherZone: 0,
    indexedMode: "off",
    materialAware: false,
    showHeatmap: false,
    batchNormalize: false,
    previewMode: "normal",
    semanticAssist: true,
    subjectMaskAssist: true,
    smartTuneAssist: true,
    assistStrength: 52,
    assistPasses: 3,
    exportMetadata: false,
    exportPaletteLut: false,
    exportMaterialMap: false,
    exportNormalMap: false,
    exportAoMap: false,
  },
  retro_handheld: {
    bypassSnap: false,
    paletteClamp: true,
    palette: 16,
    orderedDither: false,
    exportPadding: 1,
    powerOfTwo: true,
    paletteBalance: 118,
    gridSensitivity: 72,
    sharpen: 8,
    ditherStrength: 0,
    noiseJitter: 0,
    despeckle: 0,
    mixel: 10,
    mixelGuard: 94,
    outlineEnabled: true,
    outlineThickness: 1,
    outlineColor: "#141014",
    adaptivePalette: 58,
    clusterSize: 4,
    lightNormalize: 20,
    edgeLock: 96,
    aaIntent: 82,
    ramp: 32,
    ditherZone: 12,
    indexedMode: "retro",
    materialAware: false,
    showHeatmap: false,
    batchNormalize: false,
    previewMode: "normal",
    semanticAssist: true,
    subjectMaskAssist: true,
    smartTuneAssist: true,
    assistStrength: 48,
    assistPasses: 3,
    exportMetadata: true,
    exportPaletteLut: true,
    exportMaterialMap: false,
    exportNormalMap: false,
    exportAoMap: false,
  },
  web_icon: {
    bypassSnap: false,
    paletteClamp: true,
    palette: 24,
    orderedDither: false,
    exportPadding: 1,
    powerOfTwo: false,
    paletteBalance: 100,
    gridSensitivity: 75,
    sharpen: 22,
    ditherStrength: 0,
    noiseJitter: 0,
    despeckle: 1,
    mixel: 8,
    mixelGuard: 95,
    outlineEnabled: false,
    outlineThickness: 1,
    outlineColor: "#0f1014",
    adaptivePalette: 20,
    clusterSize: 4,
    lightNormalize: 0,
    edgeLock: 100,
    aaIntent: 90,
    ramp: 6,
    ditherZone: 0,
    indexedMode: "off",
    materialAware: false,
    showHeatmap: false,
    batchNormalize: false,
    previewMode: "normal",
    semanticAssist: true,
    subjectMaskAssist: true,
    smartTuneAssist: true,
    assistStrength: 46,
    assistPasses: 2,
    exportMetadata: false,
    exportPaletteLut: false,
    exportMaterialMap: false,
    exportNormalMap: false,
    exportAoMap: false,
  },
  soft_gradients: {
    bypassSnap: false,
    paletteClamp: true,
    palette: 96,
    orderedDither: true,
    exportPadding: 0,
    powerOfTwo: false,
    paletteBalance: 112,
    gridSensitivity: 58,
    sharpen: 4,
    ditherStrength: 26,
    noiseJitter: 22,
    despeckle: 0,
    mixel: 6,
    mixelGuard: 96,
    outlineEnabled: false,
    outlineThickness: 1,
    outlineColor: "#101010",
    adaptivePalette: 30,
    clusterSize: 8,
    lightNormalize: 8,
    edgeLock: 62,
    aaIntent: 95,
    ramp: 18,
    ditherZone: 68,
    indexedMode: "off",
    materialAware: false,
    showHeatmap: false,
    batchNormalize: false,
    previewMode: "normal",
    semanticAssist: true,
    subjectMaskAssist: true,
    smartTuneAssist: true,
    assistStrength: 58,
    assistPasses: 4,
    exportMetadata: false,
    exportPaletteLut: false,
    exportMaterialMap: false,
    exportNormalMap: false,
    exportAoMap: false,
  },
  portrait_cleanup: {
    bypassSnap: false,
    paletteClamp: false,
    palette: 96,
    orderedDither: false,
    exportPadding: 0,
    powerOfTwo: false,
    paletteBalance: 108,
    gridSensitivity: 60,
    sharpen: 12,
    ditherStrength: 0,
    noiseJitter: 0,
    despeckle: 1,
    mixel: 8,
    mixelGuard: 94,
    outlineEnabled: false,
    outlineThickness: 1,
    outlineColor: "#101010",
    adaptivePalette: 28,
    clusterSize: 8,
    lightNormalize: 18,
    edgeLock: 70,
    aaIntent: 92,
    ramp: 24,
    ditherZone: 14,
    indexedMode: "off",
    materialAware: true,
    showHeatmap: false,
    batchNormalize: false,
    previewMode: "normal",
    semanticAssist: true,
    subjectMaskAssist: true,
    smartTuneAssist: true,
    assistStrength: 60,
    assistPasses: 4,
    exportMetadata: false,
    exportPaletteLut: false,
    exportMaterialMap: true,
    exportNormalMap: false,
    exportAoMap: false,
  },
  creature_sprite: {
    bypassSnap: false,
    paletteClamp: false,
    palette: 64,
    orderedDither: false,
    exportPadding: 1,
    powerOfTwo: false,
    paletteBalance: 104,
    gridSensitivity: 66,
    sharpen: 18,
    ditherStrength: 0,
    noiseJitter: 0,
    despeckle: 1,
    mixel: 14,
    mixelGuard: 92,
    outlineEnabled: false,
    outlineThickness: 1,
    outlineColor: "#101010",
    adaptivePalette: 24,
    clusterSize: 6,
    lightNormalize: 22,
    edgeLock: 88,
    aaIntent: 78,
    ramp: 18,
    ditherZone: 10,
    indexedMode: "off",
    materialAware: true,
    showHeatmap: false,
    batchNormalize: false,
    previewMode: "normal",
    semanticAssist: true,
    subjectMaskAssist: true,
    smartTuneAssist: true,
    assistStrength: 62,
    assistPasses: 4,
    exportMetadata: true,
    exportPaletteLut: false,
    exportMaterialMap: true,
    exportNormalMap: true,
    exportAoMap: true,
  },
  hard_surface: {
    bypassSnap: false,
    paletteClamp: false,
    palette: 48,
    orderedDither: false,
    exportPadding: 1,
    powerOfTwo: false,
    paletteBalance: 92,
    gridSensitivity: 70,
    sharpen: 30,
    ditherStrength: 0,
    noiseJitter: 0,
    despeckle: 1,
    mixel: 12,
    mixelGuard: 94,
    outlineEnabled: false,
    outlineThickness: 1,
    outlineColor: "#101010",
    adaptivePalette: 18,
    clusterSize: 5,
    lightNormalize: 14,
    edgeLock: 98,
    aaIntent: 78,
    ramp: 8,
    ditherZone: 0,
    indexedMode: "off",
    materialAware: true,
    showHeatmap: false,
    batchNormalize: false,
    previewMode: "normal",
    semanticAssist: true,
    subjectMaskAssist: true,
    smartTuneAssist: true,
    assistStrength: 54,
    assistPasses: 3,
    exportMetadata: true,
    exportPaletteLut: false,
    exportMaterialMap: true,
    exportNormalMap: true,
    exportAoMap: true,
  },
  tileset_environment: {
    bypassSnap: false,
    paletteClamp: true,
    palette: 48,
    orderedDither: false,
    exportPadding: 0,
    powerOfTwo: false,
    paletteBalance: 102,
    gridSensitivity: 74,
    sharpen: 16,
    ditherStrength: 0,
    noiseJitter: 0,
    despeckle: 1,
    mixel: 8,
    mixelGuard: 96,
    outlineEnabled: false,
    outlineThickness: 1,
    outlineColor: "#101010",
    adaptivePalette: 26,
    clusterSize: 5,
    lightNormalize: 10,
    edgeLock: 94,
    aaIntent: 86,
    ramp: 14,
    ditherZone: 8,
    indexedMode: "off",
    materialAware: false,
    showHeatmap: false,
    batchNormalize: true,
    previewMode: "normal",
    semanticAssist: true,
    subjectMaskAssist: true,
    smartTuneAssist: true,
    assistStrength: 56,
    assistPasses: 4,
    exportMetadata: true,
    exportPaletteLut: false,
    exportMaterialMap: false,
    exportNormalMap: false,
    exportAoMap: false,
  },
  silhouette_readable: {
    bypassSnap: false,
    paletteClamp: true,
    palette: 24,
    orderedDither: false,
    exportPadding: 1,
    powerOfTwo: false,
    paletteBalance: 115,
    gridSensitivity: 72,
    sharpen: 24,
    ditherStrength: 0,
    noiseJitter: 0,
    despeckle: 1,
    mixel: 10,
    mixelGuard: 94,
    outlineEnabled: true,
    outlineThickness: 1,
    outlineColor: "#111217",
    adaptivePalette: 34,
    clusterSize: 4,
    lightNormalize: 12,
    edgeLock: 96,
    aaIntent: 72,
    ramp: 28,
    ditherZone: 0,
    indexedMode: "off",
    materialAware: false,
    showHeatmap: false,
    batchNormalize: false,
    previewMode: "normal",
    semanticAssist: true,
    subjectMaskAssist: true,
    smartTuneAssist: true,
    assistStrength: 50,
    assistPasses: 3,
    exportMetadata: false,
    exportPaletteLut: false,
    exportMaterialMap: false,
    exportNormalMap: false,
    exportAoMap: false,
  },
  shader_ready_indexed: {
    bypassSnap: false,
    paletteClamp: true,
    palette: 128,
    orderedDither: true,
    exportPadding: 0,
    powerOfTwo: true,
    paletteBalance: 106,
    gridSensitivity: 64,
    sharpen: 10,
    ditherStrength: 18,
    noiseJitter: 12,
    despeckle: 1,
    mixel: 8,
    mixelGuard: 94,
    outlineEnabled: false,
    outlineThickness: 1,
    outlineColor: "#101010",
    adaptivePalette: 36,
    clusterSize: 6,
    lightNormalize: 8,
    edgeLock: 80,
    aaIntent: 72,
    ramp: 14,
    ditherZone: 34,
    indexedMode: "shader",
    materialAware: false,
    showHeatmap: false,
    batchNormalize: false,
    previewMode: "normal",
    semanticAssist: true,
    subjectMaskAssist: true,
    smartTuneAssist: true,
    assistStrength: 58,
    assistPasses: 4,
    exportMetadata: true,
    exportPaletteLut: true,
    exportMaterialMap: false,
    exportNormalMap: false,
    exportAoMap: false,
  },
  print_atlas: {
    bypassSnap: false,
    paletteClamp: false,
    palette: 72,
    orderedDither: false,
    exportPadding: 2,
    powerOfTwo: true,
    paletteBalance: 100,
    gridSensitivity: 66,
    sharpen: 18,
    ditherStrength: 0,
    noiseJitter: 0,
    despeckle: 1,
    mixel: 10,
    mixelGuard: 94,
    outlineEnabled: false,
    outlineThickness: 1,
    outlineColor: "#101010",
    adaptivePalette: 14,
    clusterSize: 6,
    lightNormalize: 10,
    edgeLock: 90,
    aaIntent: 86,
    ramp: 10,
    ditherZone: 4,
    indexedMode: "off",
    materialAware: true,
    showHeatmap: false,
    batchNormalize: false,
    previewMode: "normal",
    semanticAssist: true,
    subjectMaskAssist: true,
    smartTuneAssist: true,
    assistStrength: 52,
    assistPasses: 3,
    exportMetadata: true,
    exportPaletteLut: false,
    exportMaterialMap: true,
    exportNormalMap: true,
    exportAoMap: true,
  },
});

const elements = {
  applyAssistButton: document.querySelector("#applyAssistButton"),
  aaIntentRange: document.querySelector("#aaIntentRange"),
  aaIntentValue: document.querySelector("#aaIntentValue"),
  aspectLock: document.querySelector("#aspectLock"),
  adaptivePaletteRange: document.querySelector("#adaptivePaletteRange"),
  adaptivePaletteValue: document.querySelector("#adaptivePaletteValue"),
  assistPassesRange: document.querySelector("#assistPassesRange"),
  assistPassesValue: document.querySelector("#assistPassesValue"),
  assistRecommendations: document.querySelector("#assistRecommendations"),
  assistStrengthRange: document.querySelector("#assistStrengthRange"),
  assistStrengthValue: document.querySelector("#assistStrengthValue"),
  batchNormalize: document.querySelector("#batchNormalize"),
  browseButton: document.querySelector("#browseButton"),
  bypassSnap: document.querySelector("#bypassSnap"),
  clusterSizeRange: document.querySelector("#clusterSizeRange"),
  clusterSizeValue: document.querySelector("#clusterSizeValue"),
  detectedSize: document.querySelector("#detectedSize"),
  densityCheck: document.querySelector("#densityCheck"),
  ditherRange: document.querySelector("#ditherRange"),
  ditherValue: document.querySelector("#ditherValue"),
  ditherZoneRange: document.querySelector("#ditherZoneRange"),
  ditherZoneValue: document.querySelector("#ditherZoneValue"),
  downloadButton: document.querySelector("#downloadButton"),
  despeckleRange: document.querySelector("#despeckleRange"),
  despeckleValue: document.querySelector("#despeckleValue"),
  dropzone: document.querySelector("#dropzone"),
  engineProfile: document.querySelector("#engineProfile"),
  edgeLockRange: document.querySelector("#edgeLockRange"),
  edgeLockValue: document.querySelector("#edgeLockValue"),
  exportAoMap: document.querySelector("#exportAoMap"),
  exportMaterialMap: document.querySelector("#exportMaterialMap"),
  exportMetadata: document.querySelector("#exportMetadata"),
  exportNormalMap: document.querySelector("#exportNormalMap"),
  exportPaddingRange: document.querySelector("#exportPaddingRange"),
  exportPaddingValue: document.querySelector("#exportPaddingValue"),
  exportPaletteLut: document.querySelector("#exportPaletteLut"),
  exportSize: document.querySelector("#exportSize"),
  fileInput: document.querySelector("#fileInput"),
  gridSensitivityRange: document.querySelector("#gridSensitivityRange"),
  gridSensitivityValue: document.querySelector("#gridSensitivityValue"),
  gridLabel: document.querySelector("#gridLabel"),
  heightInput: document.querySelector("#heightInput"),
  indexedMode: document.querySelector("#indexedMode"),
  integrityReport: document.querySelector("#integrityReport"),
  lightLegend: document.querySelector("#lightLegend"),
  lightPie: document.querySelector("#lightPie"),
  lightDirection: document.querySelector("#lightDirection"),
  lightNormalizeRange: document.querySelector("#lightNormalizeRange"),
  lightNormalizeValue: document.querySelector("#lightNormalizeValue"),
  materialAware: document.querySelector("#materialAware"),
  materialLegend: document.querySelector("#materialLegend"),
  materialPie: document.querySelector("#materialPie"),
  materialReport: document.querySelector("#materialReport"),
  mixelRange: document.querySelector("#mixelRange"),
  mixelGuardRange: document.querySelector("#mixelGuardRange"),
  mixelGuardValue: document.querySelector("#mixelGuardValue"),
  mixelValue: document.querySelector("#mixelValue"),
  noiseJitterRange: document.querySelector("#noiseJitterRange"),
  noiseJitterValue: document.querySelector("#noiseJitterValue"),
  outlineColor: document.querySelector("#outlineColor"),
  outlineEnabled: document.querySelector("#outlineEnabled"),
  outlineThickness: document.querySelector("#outlineThickness"),
  outlineThicknessValue: document.querySelector("#outlineThicknessValue"),
  orderedDither: document.querySelector("#orderedDither"),
  paletteClampEnabled: document.querySelector("#paletteClampEnabled"),
  paletteRange: document.querySelector("#paletteRange"),
  paletteBalanceRange: document.querySelector("#paletteBalanceRange"),
  paletteBalanceValue: document.querySelector("#paletteBalanceValue"),
  paletteScore: document.querySelector("#paletteScore"),
  paletteSwatches: document.querySelector("#paletteSwatches"),
  paletteValue: document.querySelector("#paletteValue"),
  powerOfTwo: document.querySelector("#powerOfTwo"),
  previewCanvas: document.querySelector("#previewCanvas"),
  previewProgress: document.querySelector("#previewProgress"),
  previewProgressBar: document.querySelector("#previewProgressBar"),
  previewProgressLabel: document.querySelector("#previewProgressLabel"),
  previewMode: document.querySelector("#previewMode"),
  previewSurface: document.querySelector("#previewSurface"),
  previewStage: document.querySelector(".preview-stage"),
  quickTuningPreset: document.querySelector("#quickTuningPreset"),
  rampRange: document.querySelector("#rampRange"),
  rampValue: document.querySelector("#rampValue"),
  readabilityScore: document.querySelector("#readabilityScore"),
  reprocessButton: document.querySelector("#reprocessButton"),
  resetSizeButton: document.querySelector("#resetSizeButton"),
  sampleScaleRange: document.querySelector("#sampleScaleRange"),
  sampleScaleValue: document.querySelector("#sampleScaleValue"),
  scaleRange: document.querySelector("#scaleRange"),
  scaleValue: document.querySelector("#scaleValue"),
  reducedMotion: document.querySelector("#reducedMotion"),
  rememberActiveTabs: document.querySelector("#rememberActiveTabs"),
  rememberToolSettings: document.querySelector("#rememberToolSettings"),
  resetSavedSettings: document.querySelector("#resetSavedSettings"),
  semanticAssist: document.querySelector("#semanticAssist"),
  semanticGuess: document.querySelector("#semanticGuess"),
  sharpenRange: document.querySelector("#sharpenRange"),
  sharpenValue: document.querySelector("#sharpenValue"),
  showHeatmap: document.querySelector("#showHeatmap"),
  sourceSize: document.querySelector("#sourceSize"),
  statusText: document.querySelector("#statusText"),
  subjectMaskAssist: document.querySelector("#subjectMaskAssist"),
  subjectProfile: document.querySelector("#subjectProfile"),
  smartTuneAssist: document.querySelector("#smartTuneAssist"),
  tabPanels: Array.from(document.querySelectorAll("[data-tab-panel]")),
  tabTriggers: Array.from(document.querySelectorAll("[data-tab-trigger]")),
  themeSelect: document.querySelector("#themeSelect"),
  widthInput: document.querySelector("#widthInput"),
};

const state = {
  analytics: null,
  appSettings: { ...DEFAULT_APP_SETTINGS },
  batchStyleAnchor: null,
  busy: false,
  fileName: "sprite-snapped",
  fullSourceImageData: null,
  interactiveBaseImageData: null,
  pendingWorkerRequest: null,
  pendingRenderProgressToken: null,
  processed: null,
  processWorker: null,
  processWorkerReady: false,
  progressToken: 0,
  previewLayers: null,
  previewBitmapJobId: 0,
  processingRefreshPending: false,
  processingRefreshAllowUnsafeGrid: false,
  persistenceApplying: false,
  renderJobId: 0,
  savedTabs: {
    controls: "export",
    preview: "import",
  },
  styledBaseImageData: null,
  renderQueued: false,
  sourceImageData: null,
  sourceLooksPixelArt: false,
  sourcePixelScale: 1,
  exportImageData: null,
  exportWidth: 1,
  exportHeight: 1,
  styleJobId: 0,
  styleRefreshPending: false,
  styleRefreshPendingImmediate: false,
  styleRefreshRunning: false,
  workerJobId: 0,
};

let tuningTimerId = 0;
let settingsSaveTimerId = 0;
let styleTimerId = 0;

try {
  if (!DEFAULT_CONFIG) {
    throw new Error("Pixel Snapper failed to load. Make sure pixel-snapper.js loads before main.js.");
  }

  state.persistenceApplying = true;
  restoreStoredAppState();
  bindEvents();
  initializeProcessingWorker();
  setActiveTab(
    "controls",
    state.appSettings.rememberActiveTabs ? state.savedTabs.controls : "export"
  );
  updatePreviewTabVisibility();
  setActiveTab("preview", "import");
  initializeTuningControls();
  updatePaletteClampOutput();
  refreshControls();
  renderEmptyPalette();
  updateDiagnostics(null);
  drawPlaceholderCanvas();
  state.persistenceApplying = false;
  setStatus("Ready. Choose an image or drop one into the upload panel.");
} catch (error) {
  console.error(error);
  if (elements.statusText) {
    elements.statusText.textContent = error instanceof Error
      ? error.message
      : "The app failed to initialize.";
  }
}

function restoreStoredAppState() {
  const storage = getSettingsStorage();
  if (!storage) {
    applyAppSettings(DEFAULT_APP_SETTINGS);
    return;
  }

  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      applyAppSettings(DEFAULT_APP_SETTINGS);
      return;
    }

    const parsed = JSON.parse(raw);
    const app = {
      ...DEFAULT_APP_SETTINGS,
      ...(parsed && typeof parsed === "object" ? parsed.app : null),
    };

    applyAppSettings(app);

    if (parsed && typeof parsed === "object" && parsed.tabs && typeof parsed.tabs === "object") {
      state.savedTabs.controls = typeof parsed.tabs.controls === "string"
        ? parsed.tabs.controls
        : state.savedTabs.controls;
      state.savedTabs.preview = typeof parsed.tabs.preview === "string"
        ? parsed.tabs.preview
        : state.savedTabs.preview;
    }

    if (state.appSettings.rememberToolSettings && parsed && typeof parsed === "object") {
      applyPersistedToolControls(parsed.controls);
    }
  } catch (error) {
    console.warn("Could not restore saved settings.", error);
    applyAppSettings(DEFAULT_APP_SETTINGS);
  }
}

function getSettingsStorage() {
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

function applyAppSettings(appSettings) {
  state.appSettings = {
    ...DEFAULT_APP_SETTINGS,
    ...(appSettings && typeof appSettings === "object" ? appSettings : null),
  };

  const theme = resolveThemeValue(state.appSettings.theme);
  state.appSettings.theme = theme;
  applyThemeSetting(theme);
  applyReducedMotionSetting(Boolean(state.appSettings.reducedMotion));

  if (elements.themeSelect) {
    elements.themeSelect.value = theme;
  }
  if (elements.rememberToolSettings) {
    elements.rememberToolSettings.checked = Boolean(state.appSettings.rememberToolSettings);
  }
  if (elements.rememberActiveTabs) {
    elements.rememberActiveTabs.checked = Boolean(state.appSettings.rememberActiveTabs);
  }
  if (elements.reducedMotion) {
    elements.reducedMotion.checked = Boolean(state.appSettings.reducedMotion);
  }
}

function resolveThemeValue(theme) {
  const allowedThemes = new Set(["default", "graphite", "forest", "harbor", "ember", "contrast"]);
  return allowedThemes.has(theme) ? theme : DEFAULT_APP_SETTINGS.theme;
}

function applyThemeSetting(theme) {
  document.body.dataset.theme = resolveThemeValue(theme);
}

function applyReducedMotionSetting(enabled) {
  document.body.classList.toggle("reduce-motion", Boolean(enabled));
}

function applyPersistedToolControls(savedControls) {
  if (!savedControls || typeof savedControls !== "object") {
    return;
  }

  for (const controlId of PERSISTED_TOOL_CONTROL_IDS) {
    if (!(controlId in savedControls)) {
      continue;
    }

    const element = elements[controlId];
    if (!element) {
      continue;
    }

    const value = savedControls[controlId];
    if (element instanceof HTMLInputElement) {
      if (element.type === "checkbox") {
        element.checked = Boolean(value);
      } else if (element.type === "color" || element.type === "range" || element.type === "number") {
        element.value = String(value);
      } else {
        element.value = String(value);
      }
      continue;
    }

    if (element instanceof HTMLSelectElement) {
      element.value = String(value);
    }
  }
}

function bindAppSettingsEvents() {
  elements.themeSelect?.addEventListener("change", () => {
    const theme = resolveThemeValue(elements.themeSelect.value);
    state.appSettings.theme = theme;
    applyThemeSetting(theme);
    schedulePersistedStateSave();
  });

  elements.rememberToolSettings?.addEventListener("change", () => {
    state.appSettings.rememberToolSettings = Boolean(elements.rememberToolSettings.checked);
    schedulePersistedStateSave();
  });

  elements.rememberActiveTabs?.addEventListener("change", () => {
    state.appSettings.rememberActiveTabs = Boolean(elements.rememberActiveTabs.checked);
    schedulePersistedStateSave();
  });

  elements.reducedMotion?.addEventListener("change", () => {
    state.appSettings.reducedMotion = Boolean(elements.reducedMotion.checked);
    applyReducedMotionSetting(state.appSettings.reducedMotion);
    schedulePersistedStateSave();
  });

  elements.resetSavedSettings?.addEventListener("click", () => {
    clearStoredAppState();
    state.persistenceApplying = true;
    applyAppSettings(DEFAULT_APP_SETTINGS);
    state.savedTabs = { controls: "export", preview: "import" };
    state.persistenceApplying = false;
    setActiveTab("controls", "settings");
    setStatus("Saved settings cleared. Current controls stay as-is until you change them.");
  });
}

function bindPersistenceEvents() {
  const maybePersist = (event) => {
    const target = event.target;
    if (!target || !(target instanceof HTMLElement) || !target.id) {
      return;
    }

    if (!PERSISTED_TOOL_CONTROL_IDS.includes(target.id)) {
      return;
    }

    schedulePersistedStateSave();
  };

  document.addEventListener("input", maybePersist, true);
  document.addEventListener("change", maybePersist, true);
}

function schedulePersistedStateSave() {
  if (state.persistenceApplying) {
    return;
  }

  if (settingsSaveTimerId) {
    window.clearTimeout(settingsSaveTimerId);
    settingsSaveTimerId = 0;
  }

  settingsSaveTimerId = window.setTimeout(() => {
    settingsSaveTimerId = 0;
    persistAppState();
  }, 120);
}

function persistAppState() {
  const storage = getSettingsStorage();
  if (!storage) {
    return;
  }

  const payload = {
    app: {
      theme: resolveThemeValue(state.appSettings.theme),
      rememberToolSettings: Boolean(state.appSettings.rememberToolSettings),
      rememberActiveTabs: Boolean(state.appSettings.rememberActiveTabs),
      reducedMotion: Boolean(state.appSettings.reducedMotion),
    },
    tabs: state.appSettings.rememberActiveTabs
      ? {
        controls: state.savedTabs.controls,
        preview: state.savedTabs.preview,
      }
      : {},
    controls: state.appSettings.rememberToolSettings
      ? collectPersistedToolControls()
      : {},
  };

  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Could not save settings.", error);
  }
}

function collectPersistedToolControls() {
  const controls = {};

  for (const controlId of PERSISTED_TOOL_CONTROL_IDS) {
    const element = elements[controlId];
    if (!element) {
      continue;
    }

    if (element instanceof HTMLInputElement) {
      controls[controlId] = element.type === "checkbox"
        ? Boolean(element.checked)
        : element.value;
      continue;
    }

    if (element instanceof HTMLSelectElement) {
      controls[controlId] = element.value;
    }
  }

  return controls;
}

function clearStoredAppState() {
  const storage = getSettingsStorage();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(SETTINGS_STORAGE_KEY);
  } catch (error) {
    console.warn("Could not clear saved settings.", error);
  }
}

function bindEvents() {
  bindTabEvents();
  bindAppSettingsEvents();
  bindPersistenceEvents();

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    window.addEventListener(eventName, (event) => {
      event.preventDefault();
    });
  });

  elements.browseButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!state.busy) {
      elements.fileInput.click();
    }
  });

  elements.fileInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    elements.fileInput.value = "";
    if (file) {
      await loadAndProcessFile(file);
    }
  });

  elements.dropzone.addEventListener("click", () => {
    if (!state.busy) {
      elements.fileInput.click();
    }
  });

  elements.dropzone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!state.busy) {
        elements.fileInput.click();
      }
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    elements.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      if (!state.busy) {
        elements.dropzone.classList.add("is-active");
      }
    });
  });

  ["dragleave", "dragend", "drop"].forEach((eventName) => {
    elements.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropzone.classList.remove("is-active");
    });
  });

  elements.dropzone.addEventListener("drop", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (state.busy) {
      return;
    }

    const file = getTransferFile(event.dataTransfer);
    if (file) {
      await loadAndProcessFile(file);
    }
  });

  elements.paletteRange.addEventListener("input", () => {
    updatePaletteClampOutput();
  });

  elements.sampleScaleRange.addEventListener("input", () => {
    updateSampleScaleOutput();
  });

  elements.sampleScaleRange.addEventListener("change", async () => {
    if (!state.fullSourceImageData || state.busy) {
      return;
    }

    await applyWorkingSampleScale();
  });

  elements.exportPaddingRange.addEventListener("input", () => {
    updateExportPaddingOutput();
  });

  elements.exportPaddingRange.addEventListener("change", async () => {
    updateExportPaddingOutput();

    if (!state.sourceImageData || state.busy) {
      return;
    }

    if (state.processed?.mode === "snapped" && !elements.bypassSnap.checked) {
      if (shouldUseManualTuningApply()) {
        setStatus("Padding updated. Press Snap Now to rebuild this large image with the new border.");
        refreshControls();
        schedulePreviewRender();
        return;
      }

      await runSnapPipeline({ allowUnsafeGrid: true });
      return;
    }

    schedulePreviewRender();
  });

  elements.paletteRange.addEventListener("change", async () => {
    if (shouldUseManualTuningApply()) {
      setStatus("Palette clamp updated. Press Snap Now to rebuild this large image.");
      if (elements.paletteClampEnabled.checked && state.processed) {
        queueStyleRefresh(true);
      }
      return;
    }

    if (state.sourceImageData) {
      await runSnapPipeline({ allowUnsafeGrid: true });
    }
  });

  elements.paletteClampEnabled.addEventListener("change", async () => {
    updatePaletteClampOutput();
    refreshControls();

    if (shouldUseManualTuningApply()) {
      setStatus("Palette clamp mode updated. Press Snap Now to rebuild this large image.");
      if (state.processed) {
        queueStyleRefresh(true);
      }
      return;
    }

    if (state.sourceImageData && !state.busy) {
      await runSnapPipeline({ allowUnsafeGrid: true });
    }
  });

  elements.reprocessButton.addEventListener("click", async () => {
    if (state.sourceImageData && !state.busy) {
      await runSnapPipeline({ allowUnsafeGrid: true });
    }
  });

  elements.scaleRange.addEventListener("input", () => {
    if (!state.processed || state.busy) {
      return;
    }

    applyUniformScale(Number(elements.scaleRange.value));
  });

  elements.widthInput.addEventListener("input", () => {
    if (!state.processed || state.busy) {
      return;
    }

    const requestedWidth = clampInteger(
      elements.widthInput.value,
      1,
      MAX_EXPORT_DIMENSION,
      state.exportWidth
    );

    if (elements.aspectLock.checked) {
      applyWidthWithAspect(requestedWidth);
    } else {
      setExportSize(requestedWidth, state.exportHeight);
    }
  });

  elements.heightInput.addEventListener("input", () => {
    if (!state.processed || state.busy) {
      return;
    }

    const requestedHeight = clampInteger(
      elements.heightInput.value,
      1,
      MAX_EXPORT_DIMENSION,
      state.exportHeight
    );

    if (elements.aspectLock.checked) {
      applyHeightWithAspect(requestedHeight);
    } else {
      setExportSize(state.exportWidth, requestedHeight);
    }
  });

  elements.aspectLock.addEventListener("change", () => {
    if (!state.processed || state.busy) {
      return;
    }

    if (elements.aspectLock.checked) {
      applyWidthWithAspect(state.exportWidth);
      return;
    }

    syncInputs();
    syncScaleLabel();
    schedulePreviewRender();
  });

  elements.powerOfTwo.addEventListener("change", () => {
    if (!state.processed || state.busy) {
      return;
    }

    setExportSize(state.exportWidth, state.exportHeight);
  });

  elements.orderedDither.addEventListener("change", () => {
    refreshControls();
    updateTuningOutputs();
    if (shouldUseManualTuningApply()) {
      setStatus("Dither settings staged. Press Snap Now to apply them on this large image.");
      return;
    }
    queueProcessingRefresh(true, { allowUnsafeGrid: true });
  });

  elements.bypassSnap.addEventListener("change", async () => {
    refreshControls();
    updateTuningOutputs();

    if (state.sourceImageData && !state.busy) {
      await runSnapPipeline({ allowUnsafeGrid: !elements.bypassSnap.checked });
      return;
    }

    if (!state.sourceImageData) {
      updateDiagnostics(null);
    }
  });

  [
    elements.paletteBalanceRange,
    elements.gridSensitivityRange,
    elements.sharpenRange,
    elements.ditherRange,
    elements.noiseJitterRange,
    elements.despeckleRange,
    elements.mixelRange,
    elements.mixelGuardRange,
  ].forEach(bindTuningRange);

  [
    elements.adaptivePaletteRange,
    elements.clusterSizeRange,
    elements.lightNormalizeRange,
    elements.edgeLockRange,
    elements.aaIntentRange,
    elements.rampRange,
    elements.ditherZoneRange,
    elements.outlineThickness,
  ].forEach(bindStyleRange);

  [
    elements.indexedMode,
    elements.materialAware,
    elements.batchNormalize,
  ].forEach(bindStyleToggle);

  [
    elements.semanticAssist,
    elements.subjectMaskAssist,
    elements.smartTuneAssist,
  ].forEach(bindAssistToggle);

  [
    elements.assistStrengthRange,
    elements.assistPassesRange,
  ].forEach(bindAssistRange);

  [
    elements.previewMode,
    elements.showHeatmap,
    elements.outlineEnabled,
    elements.outlineColor,
  ].forEach(bindRenderOnlyControl);

  elements.previewSurface.addEventListener("input", () => {
    void drawCurrentPreviewLayer(++state.renderJobId);
  });

  elements.previewSurface.addEventListener("change", () => {
    void drawCurrentPreviewLayer(++state.renderJobId);
  });

  elements.quickTuningPreset.addEventListener("change", () => {
    if (elements.quickTuningPreset.value !== "custom") {
      setSelectControl(elements.engineProfile, "custom");
    }
    applyQuickTuningPreset(elements.quickTuningPreset.value);
  });

  elements.engineProfile.addEventListener("change", () => {
    setSelectControl(elements.quickTuningPreset, "custom");
    applyEngineProfile(elements.engineProfile.value);
  });

  elements.resetSizeButton.addEventListener("click", () => {
    if (!state.processed || state.busy) {
      return;
    }

    resetExportToDetectedGrid();
  });

  elements.downloadButton.addEventListener("click", async () => {
    if (!state.exportImageData || state.busy) {
      return;
    }

    await downloadCurrentImage();
  });

  elements.applyAssistButton.addEventListener("click", async () => {
    if (!state.processed || state.busy) {
      return;
    }

    await applyAssistSuggestions();
  });
}

function initializeProcessingWorker() {
  if (typeof Worker !== "function") {
    return;
  }

  try {
    const worker = new Worker("./src/processing-worker.js");
    worker.addEventListener("message", handleProcessingWorkerMessage);
    worker.addEventListener("error", (event) => {
      console.warn("Processing worker failed. Falling back to main-thread processing.", event);
      if (state.pendingWorkerRequest) {
        state.pendingWorkerRequest.reject(new Error("The background worker failed."));
        state.pendingWorkerRequest = null;
      }
      state.processWorker = null;
      state.processWorkerReady = false;
    });
    state.processWorker = worker;
    state.processWorkerReady = true;
  } catch (error) {
    console.warn("Could not start the processing worker. Falling back to main-thread processing.", error);
    state.processWorker = null;
    state.processWorkerReady = false;
  }
}

function handleProcessingWorkerMessage(event) {
  const message = event.data;
  if (!message || typeof message !== "object") {
    return;
  }

  const pending = state.pendingWorkerRequest;
  if (!pending || message.jobId !== pending.jobId) {
    return;
  }

  if (message.type === "process-progress" || message.type === "rasterize-progress") {
    updateTaskProgress(
      pending.progressToken,
      clampNumber(message.value, 0, 1, 0),
      message.message || "Processing image..."
    );
    return;
  }

  if (message.type === "process-complete") {
    state.pendingWorkerRequest = null;
    pending.resolve(deserializeProcessedFromWorker(message.processed));
    return;
  }

  if (message.type === "rasterize-complete") {
    state.pendingWorkerRequest = null;
    pending.resolve(deserializeImageDataFromWorker(message.imageData));
    return;
  }

  if (message.type === "process-error" || message.type === "rasterize-error") {
    state.pendingWorkerRequest = null;
    pending.reject(new Error(message.error || "Worker processing failed."));
  }
}

function bindTabEvents() {
  if (!elements.tabTriggers.length || !elements.tabPanels.length) {
    return;
  }

  elements.tabTriggers.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.tabGroup, button.dataset.tabTrigger, true);
    });

    button.addEventListener("keydown", (event) => {
      const groupName = button.dataset.tabGroup;
      const groupButtons = getVisibleTabButtons(groupName);
      const index = groupButtons.indexOf(button);
      let nextIndex = index;

      if (index < 0 || groupButtons.length === 0) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = (index + 1) % groupButtons.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIndex = (index - 1 + groupButtons.length) % groupButtons.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = groupButtons.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      setActiveTab(groupName, groupButtons[nextIndex].dataset.tabTrigger, true);
    });
  });
}

function setActiveTab(groupName, tabName, shouldFocus = false) {
  const visibleButtons = getVisibleTabButtons(groupName);
  const requestedButton = visibleButtons.find(
    (button) => button.dataset.tabTrigger === tabName
  );
  const resolvedTabName = requestedButton
    ? tabName
    : visibleButtons[0]?.dataset.tabTrigger;

  if (!resolvedTabName) {
    return;
  }

  let activeButton = null;

  elements.tabTriggers.forEach((button) => {
    if (button.dataset.tabGroup !== groupName) {
      return;
    }

    const isActive = button.dataset.tabTrigger === resolvedTabName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
    button.tabIndex = isActive ? 0 : -1;

    if (isActive) {
      activeButton = button;
    }
  });

  elements.tabPanels.forEach((panel) => {
    if (panel.dataset.tabGroup !== groupName) {
      return;
    }

    const isActive = panel.dataset.tabPanel === resolvedTabName;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  if (groupName === "preview" && resolvedTabName === "canvas") {
    window.requestAnimationFrame(() => {
      syncPreviewCanvasSizeForVisibleTab();
    });
  }

  if (groupName === "controls") {
    state.savedTabs.controls = resolvedTabName;
    if (state.appSettings.rememberActiveTabs) {
      schedulePersistedStateSave();
    }
  } else if (groupName === "preview" && resolvedTabName !== "import") {
    state.savedTabs.preview = resolvedTabName;
    if (state.appSettings.rememberActiveTabs) {
      schedulePersistedStateSave();
    }
  }

  if (shouldFocus && activeButton) {
    activeButton.focus();
  }
}

function getVisibleTabButtons(groupName) {
  return elements.tabTriggers.filter(
    (button) => button.dataset.tabGroup === groupName && !button.hidden
  );
}

function updatePreviewTabVisibility() {
  const hasImage = Boolean(state.sourceImageData);

  elements.tabTriggers.forEach((button) => {
    if (button.dataset.tabGroup !== "preview" || button.dataset.previewRequiresImage !== "true") {
      return;
    }

    button.hidden = !hasImage;
    if (!hasImage) {
      button.classList.remove("is-active");
      button.setAttribute("aria-selected", "false");
      button.tabIndex = -1;
    }
  });

  elements.tabPanels.forEach((panel) => {
    if (panel.dataset.tabGroup !== "preview" || panel.dataset.previewRequiresImage !== "true") {
      return;
    }

    if (!hasImage) {
      panel.hidden = true;
      panel.classList.remove("is-active");
    }
  });

  const currentPreviewTab = elements.tabTriggers.find(
    (button) => button.dataset.tabGroup === "preview" && button.classList.contains("is-active")
  );

  if (!hasImage || !currentPreviewTab || currentPreviewTab.hidden) {
    const preferredPreviewTab = hasImage && state.appSettings.rememberActiveTabs
      ? state.savedTabs.preview
      : "canvas";
    setActiveTab("preview", hasImage ? preferredPreviewTab : "import");
  }
}

function syncPreviewCanvasSizeForVisibleTab() {
  if (!elements.previewStage || elements.previewStage.closest("[hidden]")) {
    return;
  }

  const selectedSurface = elements.previewSurface?.value || "final";
  const previewImage = state.previewLayers?.[selectedSurface]
    || state.previewLayers?.final
    || state.exportImageData;
  if (previewImage) {
    sizePreviewCanvas(previewImage.width, previewImage.height);
    if (selectedSurface !== "final" && selectedSurface !== "base" && !state.previewLayers?.[selectedSurface]) {
      void drawCurrentPreviewLayer(++state.renderJobId);
    }
    return;
  }

  if (state.sourceImageData) {
    sizePreviewCanvas(state.sourceImageData.width, state.sourceImageData.height);
    return;
  }

  drawPlaceholderCanvas();
}

function shouldShowProgressForImage(imageData) {
  if (!imageData) {
    return false;
  }

  return (imageData.width * imageData.height) >= 262144;
}

function beginTaskProgress(message, value = 0) {
  const token = ++state.progressToken;

  if (!elements.previewProgress || !elements.previewProgressBar || !elements.previewProgressLabel) {
    return token;
  }

  elements.previewProgress.hidden = false;
  elements.previewProgress.classList.add("is-active");
  updateTaskProgress(token, value, message);
  return token;
}

function updateTaskProgress(token, value, message) {
  if (token !== state.progressToken) {
    return;
  }

  if (elements.previewProgressBar) {
    elements.previewProgressBar.style.width = `${Math.round(clampNumber(value, 0, 1, 0) * 100)}%`;
  }

  if (elements.previewProgressLabel && message) {
    elements.previewProgressLabel.textContent = message;
  }
}

function endTaskProgress(token) {
  if (token !== state.progressToken) {
    return;
  }

  if (elements.previewProgressBar) {
    elements.previewProgressBar.style.width = "100%";
  }

  if (elements.previewProgress) {
    window.setTimeout(() => {
      if (token !== state.progressToken || !elements.previewProgress) {
        return;
      }

      elements.previewProgress.hidden = true;
      elements.previewProgress.classList.remove("is-active");
      if (elements.previewProgressBar) {
        elements.previewProgressBar.style.width = "0%";
      }
      if (elements.previewProgressLabel) {
        elements.previewProgressLabel.textContent = "Idle";
      }
    }, 120);
  }
}

async function yieldForResponsiveWork(imageDataOrPixels) {
  const totalPixels = typeof imageDataOrPixels === "number"
    ? imageDataOrPixels
    : imageDataOrPixels
      ? imageDataOrPixels.width * imageDataOrPixels.height
      : 0;

  if (totalPixels >= 262144) {
    await nextFrame();
  }
}

function serializeImageDataForWorker(imageData) {
  const data = new Uint8ClampedArray(imageData.data);
  return {
    width: imageData.width,
    height: imageData.height,
    data: data.buffer,
  };
}

function deserializeImageDataFromWorker(payload) {
  if (!payload || !payload.data || !Number.isFinite(payload.width) || !Number.isFinite(payload.height)) {
    return null;
  }

  return new ImageData(new Uint8ClampedArray(payload.data), payload.width, payload.height);
}

function deserializeProcessedFromWorker(payload) {
  if (!payload) {
    throw new Error("The worker returned an empty result.");
  }

  return {
    mode: payload.mode || "snapped",
    snappedImageData: deserializeImageDataFromWorker(payload.snappedImageData),
    quantizedImageData: payload.quantizedImageData
      ? deserializeImageDataFromWorker(payload.quantizedImageData)
      : null,
    grid: payload.grid
      ? {
        columns: Array.isArray(payload.grid.columns) ? payload.grid.columns.slice() : [],
        rows: Array.isArray(payload.grid.rows) ? payload.grid.rows.slice() : [],
        detectedWidth: payload.grid.detectedWidth,
        detectedHeight: payload.grid.detectedHeight,
      }
      : null,
  };
}

function requestProcessedImage(sourceImageData, config, bypass, progressToken) {
  if (!state.processWorkerReady || !state.processWorker) {
    return new Promise((resolve, reject) => {
      window.setTimeout(() => {
        try {
          updateTaskProgress(progressToken, 0.3, "Processing on the main thread...");
          resolve(
            bypass
              ? createBypassProcessed(sourceImageData)
              : {
                ...processImageData(sourceImageData, config),
                mode: "snapped",
              }
          );
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }

  if (state.pendingWorkerRequest) {
    state.pendingWorkerRequest.reject(new Error("A newer processing request replaced the last one."));
    state.pendingWorkerRequest = null;
  }

  const jobId = ++state.workerJobId;

  return new Promise((resolve, reject) => {
    state.pendingWorkerRequest = {
      jobId,
      kind: "process",
      progressToken,
      resolve,
      reject,
    };

    const payload = serializeImageDataForWorker(sourceImageData);
    state.processWorker.postMessage({
      type: "process",
      jobId,
      bypass,
      config,
      source: payload,
    }, [payload.data]);
  });
}

function requestRasterizedImage(bitmap, progressToken) {
  if (!state.processWorkerReady || !state.processWorker || typeof createImageBitmap !== "function") {
    return Promise.reject(new Error("Worker rasterization is not available."));
  }

  if (state.pendingWorkerRequest) {
    state.pendingWorkerRequest.reject(new Error("A newer worker request replaced the last one."));
    state.pendingWorkerRequest = null;
  }

  const jobId = ++state.workerJobId;

  return new Promise((resolve, reject) => {
    state.pendingWorkerRequest = {
      jobId,
      kind: "rasterize",
      progressToken,
      resolve,
      reject,
    };

    state.processWorker.postMessage({
      type: "rasterize",
      jobId,
      bitmap,
    }, [bitmap]);
  });
}

async function loadAndProcessFile(file) {
  if (!isSupportedImage(file)) {
    setStatus("Only image files are supported.");
    return;
  }

  const progressToken = beginTaskProgress("Decoding image...", 0.04);
  setBusy(true, `Loading ${file.name}...`);

  try {
    state.fileName = stripExtension(file.name);
    state.fullSourceImageData = await fileToImageData(file);
    const defaultSamplePercent = chooseDefaultWorkingSamplePercent(state.fullSourceImageData);
    setRangeControl(elements.sampleScaleRange, defaultSamplePercent);
    updateSampleScaleOutput();
    state.sourceImageData = buildWorkingSampleImageData(
      state.fullSourceImageData,
      defaultSamplePercent
    );
    updateTaskProgress(progressToken, 0.26, "Analyzing imported pixels...");
    state.sourceLooksPixelArt = detectExistingPixelArt(state.sourceImageData);
    state.sourcePixelScale = estimateSourcePixelScale(state.sourceImageData);
    updatePaletteClampOutput();
    if (elements.previewSurface) {
      elements.previewSurface.value = "final";
    }
    state.processed = null;
    state.styledBaseImageData = null;
    state.analytics = null;
    state.exportImageData = null;
    state.previewLayers = null;
    updateDiagnostics(null);
    updatePreviewTabVisibility();
    setActiveTab(
      "preview",
      state.appSettings.rememberActiveTabs ? state.savedTabs.preview : "canvas"
    );
    state.processed = createBypassProcessed(state.sourceImageData, "source");
    state.interactiveBaseImageData = buildInteractiveStyleBaseImage(state.processed.snappedImageData);
    state.styledBaseImageData = state.interactiveBaseImageData;
    configureScaleRange();
    resetExportToDetectedGrid(false);
    primePreviewFromCurrentSource();
    updateMetadata();
    await renderImageToPreview(state.exportImageData || state.sourceImageData);

    const deferAnalysis = shouldDeferImportHydration(state.sourceImageData);
    const samplePercent = getWorkingSamplePercent();
    const workingLabel = samplePercent < 100
      ? ` Sampling at ${samplePercent}% for responsive processing.`
      : "";
    if (deferAnalysis) {
      updateTaskProgress(progressToken, 0.92, "Preview ready. Deferring deep analysis...");
      setStatus(state.sourceLooksPixelArt
        ? `Loaded ${file.name}. Existing pixel art detected.${workingLabel} Deep analysis is deferred for this large image until you start tuning or press Snap Now.`
        : `Loaded ${file.name}.${workingLabel} Deep analysis is deferred for this large image until you start tuning or press Snap Now.`);
      updateDiagnostics(null);
      renderEmptyPalette();
      endTaskProgress(progressToken);
    } else {
      updateTaskProgress(progressToken, 0.56, "Building preview tools...");
      setStatus(state.sourceLooksPixelArt
        ? `Loaded ${file.name}. Existing pixel art detected.${workingLabel} The preview stays unchanged until you start tuning or press Snap Now.`
        : `Loaded ${file.name}.${workingLabel} The preview stays unchanged until you start tuning or press Snap Now.`);
      await nextFrame();
      void refreshStyledPipeline(progressToken);
    }
  } catch (error) {
    handleError(error);
    endTaskProgress(progressToken);
  } finally {
    state.busy = false;
    refreshControls();
  }
}

function shouldDeferImportHydration(imageData) {
  if (!imageData) {
    return false;
  }

  return (imageData.width * imageData.height) > IMPORT_EAGER_ANALYSIS_PIXEL_LIMIT;
}

function getCurrentWorkingPixelCount() {
  return state.sourceImageData
    ? state.sourceImageData.width * state.sourceImageData.height
    : 0;
}

function shouldDeferInteractiveSliderWork() {
  return getCurrentWorkingPixelCount() > INTERACTIVE_SLIDER_DEFER_PIXEL_LIMIT;
}

function shouldUseManualTuningApply() {
  return getCurrentWorkingPixelCount() > MANUAL_TUNING_APPLY_PIXEL_LIMIT;
}

function getWorkingSamplePercent() {
  return clampInteger(elements.sampleScaleRange?.value, 5, 100, 100);
}

function chooseDefaultWorkingSamplePercent(imageData) {
  if (!imageData) {
    return 100;
  }

  const { width, height } = imageData;
  const maxDimensionScale = Math.min(
    1,
    WORKING_SAMPLE_MAX_DIMENSION / Math.max(1, width),
    WORKING_SAMPLE_MAX_DIMENSION / Math.max(1, height)
  );
  const pixelScale = Math.min(
    1,
    Math.sqrt(WORKING_SAMPLE_MAX_PIXELS / Math.max(1, width * height))
  );
  const scale = Math.min(maxDimensionScale, pixelScale);

  if (scale >= 0.995) {
    return 100;
  }

  const percent = Math.floor((scale * 100) / 5) * 5;
  return clampInteger(percent, 5, 100, 100);
}

function getWorkingSampleDimensions(imageData, percent) {
  if (!imageData) {
    return { width: 1, height: 1 };
  }

  const scale = clampNumber(percent / 100, 0.05, 1, 1);
  return {
    width: Math.max(1, Math.round(imageData.width * scale)),
    height: Math.max(1, Math.round(imageData.height * scale)),
  };
}

function buildWorkingSampleImageData(imageData, percent) {
  if (!imageData) {
    return null;
  }

  const { width, height } = getWorkingSampleDimensions(imageData, percent);
  if (width === imageData.width && height === imageData.height) {
    return imageData;
  }

  return resampleNearestNeighborImageData(imageData, width, height);
}

async function applyWorkingSampleScale() {
  if (!state.fullSourceImageData) {
    return;
  }

  const percent = getWorkingSamplePercent();
  const progressToken = beginTaskProgress("Rebuilding working sample...", 0.08);
  setBusy(true, "Updating sampled working image...");

  let handedOff = false;

  try {
    updateTaskProgress(progressToken, 0.22, "Downscaling source with nearest neighbor...");
    state.sourceImageData = buildWorkingSampleImageData(state.fullSourceImageData, percent);
    updateTaskProgress(progressToken, 0.38, "Analyzing sampled pixels...");
    state.sourceLooksPixelArt = detectExistingPixelArt(state.sourceImageData);
    state.sourcePixelScale = estimateSourcePixelScale(state.sourceImageData);
    updateSampleScaleOutput();

    if (state.processed?.mode === "snapped" && !elements.bypassSnap.checked) {
      handedOff = true;
      state.busy = false;
      refreshControls();
      endTaskProgress(progressToken);
      await runSnapPipeline({ allowUnsafeGrid: true });
      return;
    }

    state.processed = createBypassProcessed(
      state.sourceImageData,
      elements.bypassSnap.checked ? "bypass" : "source"
    );
    state.interactiveBaseImageData = buildInteractiveStyleBaseImage(state.processed.snappedImageData);
    state.styledBaseImageData = state.interactiveBaseImageData;
    state.analytics = null;
    state.exportImageData = null;
    state.previewLayers = null;

    configureScaleRange();
    preserveExportSizeAfterProcess(state.processed);
    primePreviewFromCurrentSource();
    updateMetadata();
    await renderImageToPreview(state.exportImageData || state.sourceImageData);

    if (shouldDeferImportHydration(state.sourceImageData)) {
      updateDiagnostics(null);
      renderEmptyPalette();
      setStatus(`Sampling set to ${percent}%. Working image updated to ${state.sourceImageData.width}x${state.sourceImageData.height}.`);
      endTaskProgress(progressToken);
      return;
    }

    setStatus(`Sampling set to ${percent}%. Working image updated to ${state.sourceImageData.width}x${state.sourceImageData.height}.`);
    await nextFrame();
    void refreshStyledPipeline(progressToken);
  } catch (error) {
    endTaskProgress(progressToken);
    handleError(error);
  } finally {
    if (!handedOff) {
      state.busy = false;
      refreshControls();
    }
  }
}

function primePreviewFromCurrentSource() {
  if (!state.processed) {
    return;
  }

  const baseImage = state.interactiveBaseImageData || state.processed.snappedImageData;
  const paddedBaseImage = applyConfiguredExportPadding(baseImage);
  state.exportImageData = paddedBaseImage;
  state.previewLayers = {
    final: paddedBaseImage,
    base: paddedBaseImage,
    material: null,
    normal: null,
    ao: null,
    palette: null,
  };
}

function shouldUseInteractiveStyleProxy(imageData = state.processed?.snappedImageData) {
  if (!imageData) {
    return false;
  }

  return imageData.width > INTERACTIVE_STYLE_MAX_DIMENSION || imageData.height > INTERACTIVE_STYLE_MAX_DIMENSION;
}

function buildInteractiveStyleBaseImage(imageData) {
  if (!imageData) {
    return null;
  }

  if (!shouldUseInteractiveStyleProxy(imageData)) {
    return imageData;
  }

  const scale = Math.min(
    1,
    INTERACTIVE_STYLE_MAX_DIMENSION / Math.max(1, imageData.width),
    INTERACTIVE_STYLE_MAX_DIMENSION / Math.max(1, imageData.height)
  );
  const targetWidth = Math.max(1, Math.round(imageData.width * scale));
  const targetHeight = Math.max(1, Math.round(imageData.height * scale));

  if (targetWidth === imageData.width && targetHeight === imageData.height) {
    return imageData;
  }

  return resamplePixelArt(imageData, targetWidth, targetHeight);
}

function getStyleWorkingSourceImage() {
  return state.interactiveBaseImageData || state.processed?.snappedImageData || null;
}

async function runSnapPipeline(options = {}) {
  if (!state.sourceImageData) {
    return;
  }

  const allowUnsafeGrid = Boolean(options.allowUnsafeGrid);
  const skipSnap = Boolean(elements.bypassSnap?.checked);
  const progressToken = beginTaskProgress(
    skipSnap ? "Rebuilding from source pixels..." : "Queuing snap analysis...",
    0.05
  );
  setBusy(true, skipSnap
    ? "Preserving source pixels and rebuilding tools..."
    : "Analyzing image and snapping pixels...");

  try {
    await nextFrame();

    const snapPadding = getExportPaddingPixels();
    const snapSourceImage = !skipSnap && snapPadding > 0
      ? addTransparentPadding(state.sourceImageData, snapPadding)
      : state.sourceImageData;

    updateTaskProgress(
      progressToken,
      state.processWorkerReady ? 0.12 : 0.18,
      state.processWorkerReady
        ? "Handing work to a background worker..."
        : "Running local processing..."
    );

    const processedCandidate = await requestProcessedImage(
      snapSourceImage,
      getProcessingConfig(),
      skipSnap,
      progressToken
    );

    if (!state.processWorkerReady) {
      updateTaskProgress(progressToken, 0.76, "Finishing processing...");
      await yieldForResponsiveWork(state.sourceImageData);
    }

    const normalizedProcessed = !skipSnap && snapPadding > 0
      ? trimProcessedPadding(processedCandidate, snapPadding)
      : processedCandidate;
    const rejectedUnsafeGrid = !allowUnsafeGrid && shouldRejectDetectedGrid(normalizedProcessed);
    const processed = rejectedUnsafeGrid
      ? createBypassProcessed(state.sourceImageData, "source")
      : normalizedProcessed;

    state.processed = processed;
    state.interactiveBaseImageData = buildInteractiveStyleBaseImage(processed.snappedImageData);
    state.styledBaseImageData = state.interactiveBaseImageData;
    state.analytics = null;
    state.exportImageData = null;

    configureScaleRange();
    preserveExportSizeAfterProcess(processed);
    updateMetadata();
    updateTaskProgress(progressToken, 0.9, "Rebuilding preview...");
    void refreshStyledPipeline(progressToken);

    setStatus(skipSnap
      ? `Kept the source at ${processed.grid.detectedWidth}x${processed.grid.detectedHeight} and rebuilt the preview without re-snapping.`
      : rejectedUnsafeGrid
        ? `Detected grid looked unsafe for this already-pixelized source, so the native ${processed.grid.detectedWidth}x${processed.grid.detectedHeight} grid was preserved.`
      : elements.paletteClampEnabled.checked
        ? `Detected a ${processed.grid.detectedWidth}x${processed.grid.detectedHeight} pixel grid and applied palette-aware snapping.`
        : `Detected a ${processed.grid.detectedWidth}x${processed.grid.detectedHeight} pixel grid and preserved source colors.`);
  } catch (error) {
    endTaskProgress(progressToken);
    handleError(error);
  } finally {
    state.busy = false;
    refreshControls();

    if (state.processingRefreshPending && state.sourceImageData) {
      const pendingAllowUnsafeGrid = state.processingRefreshAllowUnsafeGrid;
      state.processingRefreshPending = false;
      state.processingRefreshAllowUnsafeGrid = false;
      void runSnapPipeline({ allowUnsafeGrid: pendingAllowUnsafeGrid });
    }
  }
}

function createBypassProcessed(imageData, mode = "bypass") {
  return {
    mode,
    snappedImageData: cloneImageDataLocal(imageData),
    grid: {
      columns: Array.from({ length: imageData.width + 1 }, (_, index) => index),
      rows: Array.from({ length: imageData.height + 1 }, (_, index) => index),
      detectedWidth: imageData.width,
      detectedHeight: imageData.height,
    },
  };
}

function addTransparentPadding(imageData, padding) {
  const safePadding = clampInteger(padding, 0, 128, 0);
  if (!imageData || safePadding <= 0) {
    return imageData;
  }

  return addTransparentPaddingXY(imageData, safePadding, safePadding);
}

function addTransparentPaddingXY(imageData, paddingX, paddingY) {
  const safePaddingX = clampInteger(paddingX, 0, 4096, 0);
  const safePaddingY = clampInteger(paddingY, 0, 4096, 0);
  if (!imageData || (safePaddingX <= 0 && safePaddingY <= 0)) {
    return imageData;
  }

  const nextWidth = imageData.width + (safePaddingX * 2);
  const nextHeight = imageData.height + (safePaddingY * 2);
  const output = new Uint8ClampedArray(nextWidth * nextHeight * 4);

  for (let y = 0; y < imageData.height; y += 1) {
    const sourceOffset = y * imageData.width * 4;
    const targetOffset = ((y + safePaddingY) * nextWidth + safePaddingX) * 4;
    output.set(
      imageData.data.subarray(sourceOffset, sourceOffset + (imageData.width * 4)),
      targetOffset
    );
  }

  return new ImageData(output, nextWidth, nextHeight);
}

function trimProcessedPadding(processed, padding) {
  const safePadding = clampInteger(padding, 0, 128, 0);
  if (!processed || safePadding <= 0 || !processed.snappedImageData) {
    return processed;
  }

  const source = processed.snappedImageData;
  const nextWidth = Math.max(1, source.width - (safePadding * 2));
  const nextHeight = Math.max(1, source.height - (safePadding * 2));
  const output = new Uint8ClampedArray(nextWidth * nextHeight * 4);

  for (let y = 0; y < nextHeight; y += 1) {
    const sourceOffset = ((y + safePadding) * source.width + safePadding) * 4;
    const targetOffset = y * nextWidth * 4;
    output.set(
      source.data.subarray(sourceOffset, sourceOffset + (nextWidth * 4)),
      targetOffset
    );
  }

  const trimCutAxis = (cuts, maxValue) => {
    if (!Array.isArray(cuts) || !cuts.length) {
      return Array.from({ length: maxValue + 1 }, (_, index) => index);
    }

    const trimmed = cuts
      .map((value) => value - safePadding)
      .filter((value) => value >= 0 && value <= maxValue);

    if (!trimmed.length || trimmed[0] !== 0) {
      trimmed.unshift(0);
    }

    if (trimmed[trimmed.length - 1] !== maxValue) {
      trimmed.push(maxValue);
    }

    return Array.from(new Set(trimmed)).sort((left, right) => left - right);
  };

  const columns = trimCutAxis(processed.grid?.columns, nextWidth);
  const rows = trimCutAxis(processed.grid?.rows, nextHeight);

  return {
    ...processed,
    padding: {
      sourcePixels: safePadding,
    },
    snappedImageData: new ImageData(output, nextWidth, nextHeight),
    grid: {
      columns,
      rows,
      detectedWidth: Math.max(columns.length - 1, 1),
      detectedHeight: Math.max(rows.length - 1, 1),
    },
  };
}

function shouldRejectDetectedGrid(processed) {
  if (!processed || !state.sourceImageData || !state.sourceLooksPixelArt) {
    return false;
  }

  if (processed.mode !== "snapped") {
    return false;
  }

  const sourceWidth = state.sourceImageData.width;
  const sourceHeight = state.sourceImageData.height;
  const detectedWidth = processed.grid.detectedWidth;
  const detectedHeight = processed.grid.detectedHeight;
  const widthRatio = detectedWidth / Math.max(1, sourceWidth);
  const heightRatio = detectedHeight / Math.max(1, sourceHeight);
  const averageCellWidth = sourceWidth / Math.max(1, detectedWidth);
  const averageCellHeight = sourceHeight / Math.max(1, detectedHeight);
  const sourceIsNativeScale = state.sourcePixelScale <= 1.25;

  if (!sourceIsNativeScale) {
    return false;
  }

  return (
    (widthRatio < 0.82 || heightRatio < 0.82) &&
    (averageCellWidth > 1.2 || averageCellHeight > 1.2)
  );
}

function configureScaleRange() {
  if (!state.processed) {
    return;
  }

  const baseWidth = state.processed.grid.detectedWidth;
  const baseHeight = state.processed.grid.detectedHeight;
  const baseMinDimension = Math.max(1, Math.min(baseWidth, baseHeight));
  const baseMaxDimension = Math.max(baseWidth, baseHeight);
  const technicalMaxUniformScale = Math.min(
    MAX_EXPORT_DIMENSION / baseWidth,
    MAX_EXPORT_DIMENSION / baseHeight
  );
  const practicalMaxUniformScale = Math.min(
    SCALE_MAX,
    Math.max(4, 256 / Math.max(1, baseMaxDimension))
  );
  const maxUniformScale = Math.min(technicalMaxUniformScale, practicalMaxUniformScale);
  const preferredMinimum = Math.min(0.25, Math.max(SCALE_MIN, 16 / baseMinDimension));
  const safeMinimum = Math.max(
    SCALE_MIN,
    Math.floor(preferredMinimum / SCALE_STEP) * SCALE_STEP
  );
  const safeMaximum = Math.max(safeMinimum, Math.floor(maxUniformScale / SCALE_STEP) * SCALE_STEP);
  elements.scaleRange.min = String(Number(safeMinimum.toFixed(2)));
  elements.scaleRange.max = String(safeMaximum);
  elements.scaleRange.step = String(SCALE_STEP);
}

function resetExportToDetectedGrid(schedule = true) {
  if (!state.processed) {
    return;
  }

  setExportSize(
    state.processed.grid.detectedWidth,
    state.processed.grid.detectedHeight,
    false
  );

  elements.scaleRange.value = "1";
  syncScaleLabel();

  if (schedule) {
    schedulePreviewRender();
  }
}

function preserveExportSizeAfterProcess(processed) {
  if (!processed) {
    return;
  }

  const fallbackWidth = processed.grid.detectedWidth;
  const fallbackHeight = processed.grid.detectedHeight;
  const nextWidth = clampInteger(state.exportWidth, 1, MAX_EXPORT_DIMENSION, fallbackWidth);
  const nextHeight = clampInteger(state.exportHeight, 1, MAX_EXPORT_DIMENSION, fallbackHeight);

  state.exportWidth = normalizeExportDimension(nextWidth, fallbackWidth);
  state.exportHeight = normalizeExportDimension(nextHeight, fallbackHeight);
  syncInputs();
  syncScaleLabel();
}

function applyUniformScale(requestedScale) {
  if (!state.processed) {
    return;
  }

  const baseWidth = state.processed.grid.detectedWidth;
  const baseHeight = state.processed.grid.detectedHeight;
  const safeScale = clampScale(requestedScale);

  setExportSize(
    Math.max(1, Math.round(baseWidth * safeScale)),
    Math.max(1, Math.round(baseHeight * safeScale)),
    false
  );

  elements.scaleRange.value = String(safeScale);
  syncScaleLabel();
  schedulePreviewRender();
}

function applyWidthWithAspect(requestedWidth) {
  if (!state.processed) {
    return;
  }

  const baseWidth = state.processed.grid.detectedWidth;
  const baseHeight = state.processed.grid.detectedHeight;

  let nextWidth = clampInteger(requestedWidth, 1, MAX_EXPORT_DIMENSION, baseWidth);
  let nextHeight = Math.max(1, Math.round((nextWidth / baseWidth) * baseHeight));

  if (nextHeight > MAX_EXPORT_DIMENSION) {
    nextHeight = MAX_EXPORT_DIMENSION;
    nextWidth = Math.max(1, Math.round((nextHeight / baseHeight) * baseWidth));
  }

  setExportSize(nextWidth, nextHeight, false);
  syncScaleLabel();
  schedulePreviewRender();
}

function applyHeightWithAspect(requestedHeight) {
  if (!state.processed) {
    return;
  }

  const baseWidth = state.processed.grid.detectedWidth;
  const baseHeight = state.processed.grid.detectedHeight;

  let nextHeight = clampInteger(requestedHeight, 1, MAX_EXPORT_DIMENSION, baseHeight);
  let nextWidth = Math.max(1, Math.round((nextHeight / baseHeight) * baseWidth));

  if (nextWidth > MAX_EXPORT_DIMENSION) {
    nextWidth = MAX_EXPORT_DIMENSION;
    nextHeight = Math.max(1, Math.round((nextWidth / baseWidth) * baseHeight));
  }

  setExportSize(nextWidth, nextHeight, false);
  syncScaleLabel();
  schedulePreviewRender();
}

function setExportSize(width, height, shouldRender = true) {
  state.exportWidth = normalizeExportDimension(width, state.exportWidth);
  state.exportHeight = normalizeExportDimension(height, state.exportHeight);
  syncInputs();
  syncScaleLabel();

  if (shouldRender) {
    schedulePreviewRender();
  }
}

function getScaledExportPadding() {
  const padding = getExportPaddingPixels();
  if (!state.processed || padding <= 0) {
    return { x: 0, y: 0 };
  }

  const baseWidth = Math.max(1, state.processed.grid.detectedWidth);
  const baseHeight = Math.max(1, state.processed.grid.detectedHeight);

  return {
    x: Math.max(1, Math.round((padding * state.exportWidth) / baseWidth)),
    y: Math.max(1, Math.round((padding * state.exportHeight) / baseHeight)),
  };
}

function applyConfiguredExportPadding(imageData) {
  if (!imageData) {
    return imageData;
  }

  const { x, y } = getScaledExportPadding();
  if (x <= 0 && y <= 0) {
    return imageData;
  }

  return addTransparentPaddingXY(imageData, x, y);
}

function schedulePreviewRender(progressToken = null) {
  if (!state.processed) {
    return;
  }

  if (progressToken !== null && progressToken !== undefined) {
    state.pendingRenderProgressToken = progressToken;
  }

  if (state.renderQueued) {
    return;
  }

  state.renderQueued = true;
  window.requestAnimationFrame(() => {
    state.renderQueued = false;
    void renderPreview(state.pendingRenderProgressToken);
    state.pendingRenderProgressToken = null;
  });
}

async function renderPreview(progressToken = null) {
  if (!state.processed) {
    return;
  }

  const renderJobId = ++state.renderJobId;
  const settings = getStyleSettings();
  const baseImage = state.styledBaseImageData
    ?? state.interactiveBaseImageData
    ?? state.processed.snappedImageData;
  const ownsProgress = progressToken === null || progressToken === undefined;
  const resolvedProgressToken = ownsProgress && shouldShowProgressForImage(baseImage)
    ? beginTaskProgress("Rendering preview...", 0.08)
    : progressToken;

  try {
    updateTaskProgress(resolvedProgressToken, 0.94, "Resampling export...");
    const exportBaseImage = resampleWithEdgeLock(
      baseImage,
      state.exportWidth,
      state.exportHeight,
      settings.edgeLock
    );
    await yieldForResponsiveWork(exportBaseImage);

    if (renderJobId !== state.renderJobId) {
      return;
    }

    updateTaskProgress(resolvedProgressToken, 0.97, "Compositing preview...");
    const paddedExportBaseImage = applyConfiguredExportPadding(exportBaseImage);
    state.exportImageData = settings.outlineEnabled
      ? applyOutline(paddedExportBaseImage, settings.outlineColor, settings.outlineThickness)
      : paddedExportBaseImage;

    state.previewLayers = {
      final: state.exportImageData,
      base: paddedExportBaseImage,
      material: null,
      normal: null,
      ao: null,
      palette: null,
    };

    await drawCurrentPreviewLayer(renderJobId, resolvedProgressToken);

    if (renderJobId !== state.renderJobId) {
      return;
    }

    updateMetadata();
    updateDiagnostics(state.analytics, state.exportImageData);
    refreshControls();
  } catch (error) {
    endTaskProgress(resolvedProgressToken);
    handleError(error);
    refreshControls();
  }
}

async function drawCurrentPreviewLayer(renderJobId = state.renderJobId, progressToken = null) {
  if (!state.processed) {
    return;
  }

  const progressSource = state.previewLayers?.base || state.exportImageData || state.sourceImageData;
  const ownsProgress = progressToken === null || progressToken === undefined;
  const resolvedProgressToken = ownsProgress && shouldShowProgressForImage(progressSource)
    ? beginTaskProgress("Updating preview surface...", 0.92)
    : progressToken;

  try {
    const previewImage = await getCurrentPreviewLayer(renderJobId, resolvedProgressToken);
    if (!previewImage || renderJobId !== state.renderJobId) {
      return;
    }

    await drawPreviewImage(previewImage, renderJobId);
    if (renderJobId !== state.renderJobId) {
      return;
    }

    sizePreviewCanvas(previewImage.width, previewImage.height);
    endTaskProgress(resolvedProgressToken);
  } catch (error) {
    endTaskProgress(resolvedProgressToken);
    handleError(error);
    refreshControls();
  }
}

async function getCurrentPreviewLayer(renderJobId = state.renderJobId, progressToken = null) {
  const selectedSurface = elements.previewSurface?.value || "final";

  if (!state.previewLayers) {
    return state.exportImageData;
  }

  if (!state.previewLayers[selectedSurface]) {
    updateTaskProgress(progressToken, 0.98, `Building ${getPreviewSurfaceLabel(selectedSurface)}...`);
    state.previewLayers[selectedSurface] = await buildDerivedPreviewLayer(
      selectedSurface,
      state.previewLayers,
      getStyleSettings(),
      renderJobId
    );
  }

  const baseSelection = state.previewLayers[selectedSurface] || state.previewLayers.final || state.exportImageData;

  if (!baseSelection || renderJobId !== state.renderJobId) {
    return null;
  }

  const settings = getStyleSettings();
  const supportsPreviewEffects = selectedSurface === "final" || selectedSurface === "base";
  let previewImage = baseSelection;

  if (supportsPreviewEffects && settings.previewMode !== "normal") {
    previewImage = applyPreviewMode(previewImage, settings.previewMode);
    await yieldForResponsiveWork(previewImage);
  }

  if (renderJobId !== state.renderJobId) {
    return null;
  }

  if (supportsPreviewEffects && settings.showHeatmap && state.sourceImageData) {
    const reference = resampleWithEdgeLock(
      state.sourceImageData,
      state.exportWidth,
      state.exportHeight,
      0
    );
    previewImage = overlayErrorHeatmap(previewImage, reference);
    await yieldForResponsiveWork(previewImage);
  }

  return renderJobId === state.renderJobId ? previewImage : null;
}

async function buildDerivedPreviewLayer(surface, layers, settings, renderJobId) {
  const baseImage = layers.base || layers.final;
  if (!baseImage || renderJobId !== state.renderJobId) {
    return null;
  }

  if (surface === "material") {
    await yieldForResponsiveWork(baseImage);
    return renderJobId === state.renderJobId
      ? buildMaterialMapImageData(baseImage, settings.clusterSize)
      : null;
  }

  if (surface === "normal") {
    await yieldForResponsiveWork(baseImage);
    return renderJobId === state.renderJobId
      ? buildNormalMapImageData(baseImage)
      : null;
  }

  if (surface === "ao") {
    await yieldForResponsiveWork(baseImage);
    return renderJobId === state.renderJobId
      ? buildAmbientOcclusionMapImageData(baseImage)
      : null;
  }

  if (surface === "palette") {
    await yieldForResponsiveWork(baseImage);
    return renderJobId === state.renderJobId
      ? buildPaletteLutImageData(baseImage, settings.indexedMode)
      : null;
  }

  return layers[surface] || layers.final || null;
}

function getPreviewSurfaceLabel(surface) {
  switch (surface) {
    case "base":
      return "Base Color";
    case "material":
      return "Material Map";
    case "normal":
      return "Normal Map";
    case "ao":
      return "AO Map";
    case "palette":
      return "Palette LUT";
    default:
      return "Final PNG";
  }
}

async function drawPreviewImage(imageData, renderJobId) {
  if (!imageData || !elements.previewCanvas) {
    return;
  }

  const supportsBitmapPath = typeof createImageBitmap === "function" && imageData.width * imageData.height >= 65536;
  if (!supportsBitmapPath) {
    drawImageDataToCanvas(imageData, elements.previewCanvas);
    return;
  }

  const bitmapJobId = ++state.previewBitmapJobId;
  let bitmap = null;

  try {
    bitmap = await createImageBitmap(imageData);
    if (bitmapJobId !== state.previewBitmapJobId || renderJobId !== state.renderJobId) {
      return;
    }

    const canvas = elements.previewCanvas;
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    const context = canvas.getContext("2d", { alpha: true });
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0);
  } catch (error) {
    drawImageDataToCanvas(imageData, elements.previewCanvas);
  } finally {
    if (bitmap && typeof bitmap.close === "function") {
      bitmap.close();
    }
  }
}

async function renderImageToPreview(imageData) {
  const renderJobId = ++state.renderJobId;
  await drawPreviewImage(imageData, renderJobId);
  if (renderJobId !== state.renderJobId) {
    return;
  }

  sizePreviewCanvas(imageData.width, imageData.height);
}

function updateMetadata() {
  if (!state.processed) {
    elements.sourceSize.textContent = "-";
    elements.detectedSize.textContent = "-";
    elements.exportSize.textContent = "-";
    elements.gridLabel.textContent = "No grid yet";
    return;
  }

  const sourceImage = state.fullSourceImageData || state.sourceImageData;
  elements.sourceSize.textContent = sourceImage
    ? formatSize(sourceImage.width, sourceImage.height)
    : "-";
  elements.detectedSize.textContent = formatSize(
    state.processed.grid.detectedWidth,
    state.processed.grid.detectedHeight
  );
  elements.exportSize.textContent = formatSize(state.exportWidth, state.exportHeight);
  if (state.processed.mode === "bypass") {
    elements.gridLabel.textContent = "Source pixels (no snap)";
  } else if (state.processed.mode === "source") {
    elements.gridLabel.textContent = "Source pixels (unchanged)";
  } else {
    elements.gridLabel.textContent = `${state.processed.grid.detectedWidth} x ${state.processed.grid.detectedHeight} grid`;
  }
}

function renderPalette(imageData) {
  const colors = reorderPaletteForIndexMode(
    extractPalette(imageData, 12),
    elements.indexedMode.value
  );
  elements.paletteSwatches.innerHTML = "";

  if (colors.length === 0) {
    renderEmptyPalette();
    return;
  }

  colors.forEach((rgba) => {
    const swatch = document.createElement("div");
    swatch.className = "swatch";
    swatch.style.background = colorToCss(rgba);
    swatch.title = rgba.slice(0, 3).join(", ");
    elements.paletteSwatches.appendChild(swatch);
  });
}

function renderEmptyPalette() {
  elements.paletteSwatches.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "swatch is-empty";
  empty.textContent = "No image";
  elements.paletteSwatches.appendChild(empty);
}

function getAnalysisImageData(imageData) {
  if (!imageData) {
    return imageData;
  }

  if (imageData.width <= ANALYSIS_SAMPLE_MAX_DIMENSION && imageData.height <= ANALYSIS_SAMPLE_MAX_DIMENSION) {
    return imageData;
  }

  const scale = Math.min(
    1,
    ANALYSIS_SAMPLE_MAX_DIMENSION / Math.max(1, imageData.width),
    ANALYSIS_SAMPLE_MAX_DIMENSION / Math.max(1, imageData.height)
  );

  const targetWidth = Math.max(1, Math.round(imageData.width * scale));
  const targetHeight = Math.max(1, Math.round(imageData.height * scale));

  if (targetWidth === imageData.width && targetHeight === imageData.height) {
    return imageData;
  }

  const output = new Uint8ClampedArray(targetWidth * targetHeight * 4);
  const srcWidth = imageData.width;
  const srcHeight = imageData.height;
  const srcData = imageData.data;

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(
      srcHeight - 1,
      Math.floor(((y + 0.5) * srcHeight) / targetHeight)
    );

    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(
        srcWidth - 1,
        Math.floor(((x + 0.5) * srcWidth) / targetWidth)
      );
      const sourceOffset = ((sourceY * srcWidth) + sourceX) * 4;
      const targetOffset = ((y * targetWidth) + x) * 4;

      output[targetOffset] = srcData[sourceOffset];
      output[targetOffset + 1] = srcData[sourceOffset + 1];
      output[targetOffset + 2] = srcData[sourceOffset + 2];
      output[targetOffset + 3] = srcData[sourceOffset + 3];
    }
  }

  return new ImageData(output, targetWidth, targetHeight);
}

function resampleNearestNeighborImageData(imageData, targetWidth, targetHeight) {
  const width = clampInteger(targetWidth, 1, MAX_EXPORT_DIMENSION, imageData.width);
  const height = clampInteger(targetHeight, 1, MAX_EXPORT_DIMENSION, imageData.height);

  if (width === imageData.width && height === imageData.height) {
    return imageData;
  }

  const sourceWidth = imageData.width;
  const sourceHeight = imageData.height;
  const sourceData = imageData.data;
  const output = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.min(
      sourceHeight - 1,
      Math.floor(((y + 0.5) * sourceHeight) / height)
    );

    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(
        sourceWidth - 1,
        Math.floor(((x + 0.5) * sourceWidth) / width)
      );
      const sourceOffset = ((sourceY * sourceWidth) + sourceX) * 4;
      const targetOffset = ((y * width) + x) * 4;

      output[targetOffset] = sourceData[sourceOffset];
      output[targetOffset + 1] = sourceData[sourceOffset + 1];
      output[targetOffset + 2] = sourceData[sourceOffset + 2];
      output[targetOffset + 3] = sourceData[sourceOffset + 3];
    }
  }

  return new ImageData(output, width, height);
}

function initializeTuningControls() {
  updatePaletteClampOutput();
  updateSampleScaleOutput();
  updateExportPaddingOutput();
  updateTuningOutputs();
  updateAdvancedOutputs();
  updateAssistOutputs();
}

function updatePaletteClampOutput() {
  elements.paletteValue.textContent = elements.paletteClampEnabled.checked
    ? elements.paletteRange.value
    : "Source";
}

function updateSampleScaleOutput() {
  if (!elements.sampleScaleValue || !elements.sampleScaleRange) {
    return;
  }

  const percent = clampInteger(elements.sampleScaleRange.value, 5, 100, 100);
  const sampleImage = state.fullSourceImageData;

  if (!sampleImage) {
    elements.sampleScaleValue.textContent = `${percent}%`;
    return;
  }

  const { width, height } = getWorkingSampleDimensions(sampleImage, percent);
  elements.sampleScaleValue.textContent = `${percent}% | ${width}x${height}`;
}

function getExportPaddingPixels() {
  return clampInteger(elements.exportPaddingRange?.value, 0, 16, 0);
}

function updateExportPaddingOutput() {
  if (!elements.exportPaddingValue || !elements.exportPaddingRange) {
    return;
  }

  elements.exportPaddingValue.textContent = `${getExportPaddingPixels()} px`;
}

function bindTuningRange(input) {
  if (!input) {
    return;
  }

  input.addEventListener("input", () => {
    updateTuningOutputs();
    if (shouldDeferInteractiveSliderWork()) {
      return;
    }
    queueProcessingRefresh(false, { allowUnsafeGrid: true });
  });

  input.addEventListener("change", () => {
    updateTuningOutputs();
    if (shouldUseManualTuningApply()) {
      setStatus("Tuning updated. Press Snap Now to apply the new settings on this large image.");
      refreshControls();
      return;
    }
    queueProcessingRefresh(true, { allowUnsafeGrid: true });
  });
}

function bindStyleRange(input) {
  if (!input) {
    return;
  }

  const refreshStyle = (immediate) => {
    if (input === elements.outlineThickness) {
      schedulePreviewRender();
      return;
    }

    queueStyleRefresh(immediate);
  };

  input.addEventListener("input", () => {
    updateAdvancedOutputs();
    if (shouldDeferInteractiveSliderWork()) {
      return;
    }
    refreshStyle(false);
  });

  input.addEventListener("change", () => {
    updateAdvancedOutputs();
    refreshStyle(true);
  });
}

function bindStyleToggle(input) {
  if (!input) {
    return;
  }

  input.addEventListener("change", () => {
    if (input === elements.batchNormalize && !input.checked) {
      state.batchStyleAnchor = null;
    }
    updateAdvancedOutputs();
    refreshControls();
    queueStyleRefresh(true);
  });
}

function bindAssistToggle(input) {
  if (!input) {
    return;
  }

  input.addEventListener("change", () => {
    updateAssistOutputs();
    refreshControls();
    queueStyleRefresh(true);
  });
}

function bindAssistRange(input) {
  if (!input) {
    return;
  }

  input.addEventListener("input", () => {
    updateAssistOutputs();
    if (shouldDeferInteractiveSliderWork()) {
      return;
    }
    queueStyleRefresh(false);
  });

  input.addEventListener("change", () => {
    updateAssistOutputs();
    queueStyleRefresh(true);
  });
}

function bindRenderOnlyControl(input) {
  if (!input) {
    return;
  }

  const redrawPreviewOnly = () => {
    if (input === elements.outlineEnabled || input === elements.outlineColor) {
      schedulePreviewRender();
      return;
    }

    void drawCurrentPreviewLayer(++state.renderJobId);
  };

  input.addEventListener("input", () => {
    updateAdvancedOutputs();
    refreshControls();
    if (shouldDeferInteractiveSliderWork()) {
      return;
    }
    redrawPreviewOnly();
  });

  input.addEventListener("change", () => {
    updateAdvancedOutputs();
    refreshControls();
    redrawPreviewOnly();
  });
}

function queueProcessingRefresh(immediate, options = {}) {
  if (!state.sourceImageData) {
    return;
  }

  const allowUnsafeGrid = Boolean(options.allowUnsafeGrid);

  if (tuningTimerId) {
    window.clearTimeout(tuningTimerId);
    tuningTimerId = 0;
  }

  if (state.busy && !immediate) {
    state.processingRefreshPending = true;
    state.processingRefreshAllowUnsafeGrid = state.processingRefreshAllowUnsafeGrid || allowUnsafeGrid;
    return;
  }

  if (immediate) {
    if (state.busy) {
      state.processingRefreshPending = true;
      state.processingRefreshAllowUnsafeGrid = state.processingRefreshAllowUnsafeGrid || allowUnsafeGrid;
      return;
    }

    void runSnapPipeline({ allowUnsafeGrid });
    return;
  }

  tuningTimerId = window.setTimeout(() => {
    tuningTimerId = 0;
    if (!state.sourceImageData) {
      return;
    }

    if (state.busy) {
      state.processingRefreshPending = true;
      state.processingRefreshAllowUnsafeGrid = state.processingRefreshAllowUnsafeGrid || allowUnsafeGrid;
      return;
    }

    void runSnapPipeline({ allowUnsafeGrid });
  }, 160);
}

function queueStyleRefresh(immediate) {
  if (!state.processed) {
    return;
  }

  if (styleTimerId) {
    window.clearTimeout(styleTimerId);
    styleTimerId = 0;
  }

  const requestRefresh = () => {
    if (!state.processed) {
      return;
    }

    if (state.styleRefreshRunning) {
      state.styleRefreshPending = true;
      state.styleRefreshPendingImmediate = state.styleRefreshPendingImmediate || immediate;
      return;
    }

    state.styleRefreshRunning = true;
    Promise.resolve(refreshStyledPipeline())
      .catch((error) => {
        handleError(error);
        refreshControls();
      })
      .finally(() => {
        state.styleRefreshRunning = false;

        if (!state.styleRefreshPending || !state.processed) {
          state.styleRefreshPending = false;
          state.styleRefreshPendingImmediate = false;
          return;
        }

        const rerunImmediate = state.styleRefreshPendingImmediate;
        state.styleRefreshPending = false;
        state.styleRefreshPendingImmediate = false;
        queueStyleRefresh(rerunImmediate);
      });
  };

  if (immediate) {
    requestRefresh();
    return;
  }

  styleTimerId = window.setTimeout(() => {
    styleTimerId = 0;
    requestRefresh();
  }, shouldDeferInteractiveSliderWork() ? 220 : 120);
}

function getProcessingConfig() {
  return {
    paletteClampEnabled: Boolean(elements.paletteClampEnabled.checked),
    kColors: clampInteger(elements.paletteRange.value, 2, 256, DEFAULT_CONFIG.kColors),
    paletteBalance: clampNumber(Number(elements.paletteBalanceRange.value) / 100, 0.4, 1.6, 1),
    peakThresholdMultiplier: getGridThreshold(),
    sharpenStrength: clampNumber(Number(elements.sharpenRange.value) / 100, 0, 1, 0),
    ditherStrength: elements.orderedDither.checked
      ? clampNumber(Number(elements.ditherRange.value) / 100, 0, 1, 0)
      : 0,
    ditherJitter: elements.orderedDither.checked
      ? clampNumber(Number(elements.noiseJitterRange.value) / 100, 0, 1, 0)
      : 0,
    despecklePasses: clampInteger(elements.despeckleRange.value, 0, 3, 1),
    mixelStrength: clampNumber(Number(elements.mixelRange.value) / 100, 0, 1, 0),
    mixelGuard: clampNumber(Number(elements.mixelGuardRange.value) / 100, 0, 1, 0.85),
  };
}

function updateTuningOutputs() {
  const skipSnap = Boolean(elements.bypassSnap?.checked);
  elements.paletteBalanceValue.textContent = `${clampNumber(
    Number(elements.paletteBalanceRange.value) / 100,
    0.4,
    1.6,
    1
  ).toFixed(2)}x`;
  elements.gridSensitivityValue.textContent = skipSnap
    ? "Bypass"
    : getGridThreshold().toFixed(2);
  elements.sharpenValue.textContent = skipSnap
    ? "Bypass"
    : formatPercent(elements.sharpenRange.value);
  elements.ditherValue.textContent = skipSnap
    ? "Bypass"
    : elements.orderedDither.checked
    ? formatPercent(elements.ditherRange.value)
    : "Off";
  elements.noiseJitterValue.textContent = skipSnap
    ? "Bypass"
    : elements.orderedDither.checked
    ? formatPercent(elements.noiseJitterRange.value)
    : "Off";
  elements.despeckleValue.textContent = skipSnap
    ? "Bypass"
    : formatPassLabel(
    clampInteger(elements.despeckleRange.value, 0, 3, 1)
  );
  elements.mixelValue.textContent = skipSnap
    ? "Bypass"
    : formatPercent(elements.mixelRange.value);
  elements.mixelGuardValue.textContent = formatPercent(elements.mixelGuardRange.value);
}

function updateAdvancedOutputs() {
  elements.outlineThicknessValue.textContent = `${clampInteger(
    elements.outlineThickness.value,
    1,
    4,
    1
  )} px`;
  elements.adaptivePaletteValue.textContent = formatPercent(elements.adaptivePaletteRange.value);
  elements.clusterSizeValue.textContent = `${clampInteger(
    elements.clusterSizeRange.value,
    2,
    12,
    6
  )} px`;
  elements.lightNormalizeValue.textContent = formatPercent(elements.lightNormalizeRange.value);
  elements.edgeLockValue.textContent = formatPercent(elements.edgeLockRange.value);
  elements.aaIntentValue.textContent = formatPercent(elements.aaIntentRange.value);
  elements.rampValue.textContent = formatPercent(elements.rampRange.value);
  elements.ditherZoneValue.textContent = formatPercent(elements.ditherZoneRange.value);
}

function updateAssistOutputs() {
  elements.assistStrengthValue.textContent = formatPercent(elements.assistStrengthRange.value);
  elements.assistPassesValue.textContent = formatPassLabel(
    clampInteger(elements.assistPassesRange.value, 1, 6, 3)
  );
}

function getStyleSettings() {
  return {
    bypassSnap: Boolean(elements.bypassSnap.checked),
    outlineEnabled: Boolean(elements.outlineEnabled.checked),
    outlineColor: parseHexColor(elements.outlineColor.value),
    outlineThickness: clampInteger(elements.outlineThickness.value, 1, 4, 1),
    adaptivePalette: clampNumber(Number(elements.adaptivePaletteRange.value) / 100, 0, 1, 0),
    clusterSize: clampInteger(elements.clusterSizeRange.value, 2, 12, 6),
    lightNormalize: clampNumber(Number(elements.lightNormalizeRange.value) / 100, 0, 1, 0),
    edgeLock: clampNumber(Number(elements.edgeLockRange.value) / 100, 0, 1, 0),
    aaIntent: clampNumber(Number(elements.aaIntentRange.value) / 100, 0, 1, 0),
    rampStrength: clampNumber(Number(elements.rampRange.value) / 100, 0, 1, 0),
    ditherZone: clampNumber(Number(elements.ditherZoneRange.value) / 100, 0, 1, 0),
    indexedMode: elements.indexedMode.value || "off",
    materialAware: Boolean(elements.materialAware.checked),
    showHeatmap: Boolean(elements.showHeatmap.checked),
    batchNormalize: Boolean(elements.batchNormalize.checked),
    previewMode: elements.previewMode.value || "normal",
    semanticAssist: Boolean(elements.semanticAssist.checked),
    subjectMaskAssist: Boolean(elements.subjectMaskAssist.checked),
    smartTuneAssist: Boolean(elements.smartTuneAssist.checked),
    assistStrength: clampNumber(Number(elements.assistStrengthRange.value) / 100, 0, 1, 0.5),
    assistPasses: clampInteger(elements.assistPassesRange.value, 1, 6, 3),
  };
}

function shouldApplyRuntimePaletteClamp() {
  if (!elements.paletteClampEnabled?.checked || !state.processed || typeof quantizeImage !== "function") {
    return false;
  }

  return state.processed.mode !== "snapped" || shouldUseManualTuningApply();
}

function applyRuntimePaletteClamp(imageData) {
  if (!imageData || !shouldApplyRuntimePaletteClamp()) {
    return imageData;
  }

  return quantizeImage(imageData, {
    ...DEFAULT_CONFIG,
    paletteClampEnabled: true,
    kColors: clampInteger(elements.paletteRange.value, 2, 256, DEFAULT_CONFIG.kColors),
    paletteBalance: clampNumber(Number(elements.paletteBalanceRange.value) / 100, 0.4, 1.6, 1),
  });
}

async function buildStyledImage(baseImage, settings, options = {}) {
  if (!baseImage) {
    return null;
  }

  const {
    jobId = null,
    progressToken = null,
    updateBatchAnchor = true,
  } = options;

  const isCurrentJob = () => jobId === null || jobId === state.styleJobId;
  const updateProgress = (value, message) => {
    if (progressToken !== null && progressToken !== undefined) {
      updateTaskProgress(progressToken, value, message);
    }
  };

  let styled = cloneImageDataLocal(baseImage);
  await yieldForResponsiveWork(baseImage);

  if (settings.adaptivePalette > 0) {
    updateProgress(0.6, "Applying adaptive palette tools...");
    styled = applyAdaptivePaletteReduction(styled, settings.adaptivePalette, settings.clusterSize);
    await yieldForResponsiveWork(styled);
  }

  if (!isCurrentJob()) {
    return null;
  }

  if (settings.aaIntent < 1) {
    updateProgress(0.66, "Cleaning subpixel intent...");
    styled = applySubpixelIntentCleanup(styled, settings.aaIntent);
    await yieldForResponsiveWork(styled);
  }

  if (!isCurrentJob()) {
    return null;
  }

  if (settings.rampStrength > 0) {
    updateProgress(0.7, "Remapping color ramps...");
    styled = applyColorRampRemap(styled, settings.rampStrength, settings.indexedMode);
    await yieldForResponsiveWork(styled);
  }

  if (!isCurrentJob()) {
    return null;
  }

  if (settings.lightNormalize > 0) {
    updateProgress(0.74, "Normalizing light direction...");
    styled = applyLightNormalization(styled, settings.lightNormalize);
    await yieldForResponsiveWork(styled);
  }

  if (!isCurrentJob()) {
    return null;
  }

  if (settings.materialAware) {
    updateProgress(0.78, "Applying material-aware polish...");
    styled = applyMaterialEnhancement(styled, settings.clusterSize);
    await yieldForResponsiveWork(styled);
  }

  if (!isCurrentJob()) {
    return null;
  }

  if (settings.batchNormalize) {
    updateProgress(0.82, "Normalizing batch style...");
    if (state.batchStyleAnchor) {
      styled = applyBatchStyleNormalization(styled, state.batchStyleAnchor);
      await yieldForResponsiveWork(styled);
    }

    if (updateBatchAnchor) {
      const currentAnchor = computeBatchStyleAnchor(styled);
      state.batchStyleAnchor = state.batchStyleAnchor
        ? blendBatchStyleAnchors(state.batchStyleAnchor, currentAnchor, 0.18)
        : currentAnchor;
    }
  } else if (updateBatchAnchor) {
    state.batchStyleAnchor = null;
  }

  if (!isCurrentJob()) {
    return null;
  }

  if (settings.ditherZone > 0) {
    updateProgress(0.86, "Applying selective dither zones...");
    styled = applySelectiveDitherZones(styled, settings.ditherZone);
    await yieldForResponsiveWork(styled);
  }

  if (!isCurrentJob()) {
    return null;
  }

  if (shouldApplyRuntimePaletteClamp()) {
    updateProgress(0.89, "Applying palette clamp...");
    styled = applyRuntimePaletteClamp(styled);
    await yieldForResponsiveWork(styled);
  }

  return isCurrentJob() ? styled : null;
}

async function refreshStyledPipeline(existingProgressToken = null) {
  if (!state.processed) {
    return;
  }

  const styleJobId = ++state.styleJobId;
  const settings = getStyleSettings();
  const baseImage = getStyleWorkingSourceImage();
  const progressToken = existingProgressToken ?? (
    shouldShowProgressForImage(baseImage)
      ? beginTaskProgress("Applying style tools...", 0.52)
      : null
  );

  try {
    const styled = await buildStyledImage(baseImage, settings, {
      jobId: styleJobId,
      progressToken,
      updateBatchAnchor: true,
    });

    if (!styled || styleJobId !== state.styleJobId) {
      return;
    }

    updateTaskProgress(progressToken, 0.9, "Refreshing analysis...");
    state.styledBaseImageData = styled;
    state.previewLayers = null;
    state.exportImageData = null;
    await yieldForResponsiveWork(styled);
    const analysisImage = getAnalysisImageData(styled);
    await yieldForResponsiveWork(analysisImage);
    state.analytics = buildAnalytics(analysisImage, settings);
    await yieldForResponsiveWork(analysisImage);
    renderPalette(analysisImage);
    updateDiagnostics(state.analytics);
    schedulePreviewRender(progressToken);
  } catch (error) {
    endTaskProgress(progressToken);
    handleError(error);
    refreshControls();
  }
}

function applyCompositePreset(preset) {
  if (!preset || typeof preset !== "object") {
    updatePaletteClampOutput();
    updateSampleScaleOutput();
    updateExportPaddingOutput();
    updateTuningOutputs();
    updateAdvancedOutputs();
    updateAssistOutputs();
    refreshControls();
    return;
  }

  const hasSetting = (key) => Object.prototype.hasOwnProperty.call(preset, key);

  if (hasSetting("bypassSnap")) {
    setCheckboxControl(elements.bypassSnap, preset.bypassSnap);
  }
  if (hasSetting("paletteClamp")) {
    setCheckboxControl(elements.paletteClampEnabled, preset.paletteClamp);
  }
  if (hasSetting("palette")) {
    setRangeControl(elements.paletteRange, preset.palette);
  }
  if (hasSetting("orderedDither")) {
    setCheckboxControl(elements.orderedDither, preset.orderedDither);
  }
  if (hasSetting("exportPadding")) {
    setRangeControl(elements.exportPaddingRange, preset.exportPadding);
  }
  if (hasSetting("powerOfTwo")) {
    setCheckboxControl(elements.powerOfTwo, preset.powerOfTwo);
  }
  if (hasSetting("paletteBalance")) {
    setRangeControl(elements.paletteBalanceRange, preset.paletteBalance);
  }
  if (hasSetting("gridSensitivity")) {
    setRangeControl(elements.gridSensitivityRange, preset.gridSensitivity);
  }
  if (hasSetting("sharpen")) {
    setRangeControl(elements.sharpenRange, preset.sharpen);
  }
  if (hasSetting("ditherStrength")) {
    setRangeControl(elements.ditherRange, preset.ditherStrength);
  }
  if (hasSetting("noiseJitter")) {
    setRangeControl(elements.noiseJitterRange, preset.noiseJitter);
  }
  if (hasSetting("despeckle")) {
    setRangeControl(elements.despeckleRange, preset.despeckle);
  }
  if (hasSetting("mixel")) {
    setRangeControl(elements.mixelRange, preset.mixel);
  }
  if (hasSetting("mixelGuard")) {
    setRangeControl(elements.mixelGuardRange, preset.mixelGuard);
  }
  if (hasSetting("outlineEnabled")) {
    setCheckboxControl(elements.outlineEnabled, preset.outlineEnabled);
  }
  if (hasSetting("outlineThickness")) {
    setRangeControl(elements.outlineThickness, preset.outlineThickness);
  }
  if (hasSetting("outlineColor") && typeof preset.outlineColor === "string" && elements.outlineColor) {
    elements.outlineColor.value = preset.outlineColor;
  }
  if (hasSetting("adaptivePalette")) {
    setRangeControl(elements.adaptivePaletteRange, preset.adaptivePalette);
  }
  if (hasSetting("clusterSize")) {
    setRangeControl(elements.clusterSizeRange, preset.clusterSize);
  }
  if (hasSetting("lightNormalize")) {
    setRangeControl(elements.lightNormalizeRange, preset.lightNormalize);
  }
  if (hasSetting("edgeLock")) {
    setRangeControl(elements.edgeLockRange, preset.edgeLock);
  }
  if (hasSetting("aaIntent")) {
    setRangeControl(elements.aaIntentRange, preset.aaIntent);
  }
  if (hasSetting("ramp")) {
    setRangeControl(elements.rampRange, preset.ramp);
  }
  if (hasSetting("ditherZone")) {
    setRangeControl(elements.ditherZoneRange, preset.ditherZone);
  }
  if (hasSetting("indexedMode")) {
    setSelectControl(elements.indexedMode, preset.indexedMode);
  }
  if (hasSetting("materialAware")) {
    setCheckboxControl(elements.materialAware, preset.materialAware);
  }
  if (hasSetting("showHeatmap")) {
    setCheckboxControl(elements.showHeatmap, preset.showHeatmap);
  }
  if (hasSetting("batchNormalize")) {
    setCheckboxControl(elements.batchNormalize, preset.batchNormalize);
  }
  if (hasSetting("previewMode")) {
    setSelectControl(elements.previewMode, preset.previewMode);
  }
  if (hasSetting("semanticAssist")) {
    setCheckboxControl(elements.semanticAssist, preset.semanticAssist);
  }
  if (hasSetting("subjectMaskAssist")) {
    setCheckboxControl(elements.subjectMaskAssist, preset.subjectMaskAssist);
  }
  if (hasSetting("smartTuneAssist")) {
    setCheckboxControl(elements.smartTuneAssist, preset.smartTuneAssist);
  }
  if (hasSetting("assistStrength")) {
    setRangeControl(elements.assistStrengthRange, preset.assistStrength);
  }
  if (hasSetting("assistPasses")) {
    setRangeControl(elements.assistPassesRange, preset.assistPasses);
  }
  if (hasSetting("exportMetadata")) {
    setCheckboxControl(elements.exportMetadata, preset.exportMetadata);
  }
  if (hasSetting("exportPaletteLut")) {
    setCheckboxControl(elements.exportPaletteLut, preset.exportPaletteLut);
  }
  if (hasSetting("exportMaterialMap")) {
    setCheckboxControl(elements.exportMaterialMap, preset.exportMaterialMap);
  }
  if (hasSetting("exportNormalMap")) {
    setCheckboxControl(elements.exportNormalMap, preset.exportNormalMap);
  }
  if (hasSetting("exportAoMap")) {
    setCheckboxControl(elements.exportAoMap, preset.exportAoMap);
  }

  updatePaletteClampOutput();
  updateSampleScaleOutput();
  updateExportPaddingOutput();
  updateTuningOutputs();
  updateAdvancedOutputs();
  updateAssistOutputs();

  if (hasSetting("powerOfTwo") && state.processed) {
    setExportSize(state.exportWidth, state.exportHeight, false);
  }

  refreshControls();
  schedulePersistedStateSave();

  if (state.sourceImageData && !state.busy) {
    void runSnapPipeline({ allowUnsafeGrid: true });
  } else if (state.processed) {
    queueStyleRefresh(true);
  }
}

function applyEngineProfile(profile) {
  const presets = {
    unity_urp: {
      paletteClamp: false,
      palette: 48,
      orderedDither: false,
      ditherStrength: 0,
      noiseJitter: 0,
      sharpen: 16,
      gridSensitivity: 68,
      powerOfTwo: false,
      adaptivePalette: 32,
      clusterSize: 6,
      lightNormalize: 14,
      edgeLock: 88,
      aaIntent: 62,
      ramp: 12,
      ditherZone: 26,
      indexedMode: "off",
      materialAware: true,
      outlineEnabled: false,
      outlineThickness: 1,
      outlineColor: "#101010",
      previewMode: "normal",
      exportMetadata: true,
      exportPaletteLut: false,
      exportMaterialMap: true,
      exportNormalMap: true,
      exportAoMap: true,
    },
    unreal_paper2d: {
      paletteClamp: false,
      palette: 64,
      orderedDither: false,
      ditherStrength: 0,
      noiseJitter: 0,
      sharpen: 24,
      gridSensitivity: 70,
      powerOfTwo: false,
      adaptivePalette: 28,
      clusterSize: 5,
      lightNormalize: 18,
      edgeLock: 92,
      aaIntent: 68,
      ramp: 16,
      ditherZone: 22,
      indexedMode: "off",
      materialAware: true,
      outlineEnabled: false,
      outlineThickness: 1,
      outlineColor: "#101010",
      previewMode: "normal",
      exportMetadata: true,
      exportPaletteLut: false,
      exportMaterialMap: true,
      exportNormalMap: true,
      exportAoMap: true,
    },
    webgl_indexed: {
      paletteClamp: true,
      palette: 96,
      orderedDither: true,
      ditherStrength: 22,
      noiseJitter: 10,
      sharpen: 10,
      gridSensitivity: 66,
      powerOfTwo: true,
      adaptivePalette: 46,
      clusterSize: 6,
      lightNormalize: 8,
      edgeLock: 78,
      aaIntent: 58,
      ramp: 18,
      ditherZone: 36,
      indexedMode: "shader",
      materialAware: false,
      outlineEnabled: false,
      outlineThickness: 1,
      outlineColor: "#101010",
      previewMode: "normal",
      exportMetadata: true,
      exportPaletteLut: true,
      exportMaterialMap: false,
      exportNormalMap: false,
      exportAoMap: false,
    },
    lut_256: {
      paletteClamp: true,
      palette: 160,
      orderedDither: true,
      ditherStrength: 28,
      noiseJitter: 18,
      sharpen: 12,
      gridSensitivity: 64,
      powerOfTwo: true,
      adaptivePalette: 40,
      clusterSize: 8,
      lightNormalize: 10,
      edgeLock: 74,
      aaIntent: 60,
      ramp: 20,
      ditherZone: 42,
      indexedMode: "shader",
      materialAware: false,
      outlineEnabled: false,
      outlineThickness: 1,
      outlineColor: "#101010",
      previewMode: "normal",
      exportMetadata: true,
      exportPaletteLut: true,
      exportMaterialMap: false,
      exportNormalMap: false,
      exportAoMap: false,
    },
    retro_gba: {
      paletteClamp: true,
      palette: 16,
      orderedDither: false,
      ditherStrength: 0,
      noiseJitter: 0,
      sharpen: 6,
      gridSensitivity: 72,
      powerOfTwo: true,
      adaptivePalette: 60,
      clusterSize: 4,
      lightNormalize: 24,
      edgeLock: 96,
      aaIntent: 74,
      ramp: 36,
      ditherZone: 14,
      indexedMode: "retro",
      materialAware: false,
      outlineEnabled: true,
      outlineThickness: 1,
      outlineColor: "#141014",
      previewMode: "normal",
      exportMetadata: true,
      exportPaletteLut: true,
      exportMaterialMap: false,
      exportNormalMap: false,
      exportAoMap: false,
    },
  };

  const preset = presets[profile];
  if (!preset || profile === "custom") {
    applyCompositePreset(null);
    return;
  }

  applyCompositePreset({
    ...preset,
    showHeatmap: false,
  });
}

function getSafeQuickPreset(presetKey, preset) {
  if (!preset || typeof preset !== "object") {
    return preset;
  }

  const safePreset = { ...preset };
  const likelyNativePixelArt = Boolean(state.sourceLooksPixelArt && state.sourcePixelScale <= 1.35);
  const indexedIntent = presetKey === "retro_handheld" || presetKey === "shader_ready_indexed";
  const preserveIntent = presetKey === "source_preserve";

  if (!preserveIntent) {
    safePreset.mixelGuard = Math.max(
      clampInteger(safePreset.mixelGuard, 0, 100, 96),
      96
    );
    safePreset.mixel = likelyNativePixelArt
      ? Math.min(clampInteger(safePreset.mixel, 0, 100, 0), 6)
      : 0;
    safePreset.adaptivePalette = Math.min(
      clampInteger(safePreset.adaptivePalette, 0, 100, 0),
      indexedIntent ? 32 : 22
    );
    safePreset.ramp = Math.min(
      clampInteger(safePreset.ramp, 0, 100, 0),
      likelyNativePixelArt ? 16 : 8
    );
    safePreset.ditherZone = Math.min(
      clampInteger(safePreset.ditherZone, 0, 100, 0),
      likelyNativePixelArt ? 32 : 18
    );
  }

  if (!likelyNativePixelArt) {
    safePreset.despeckle = Math.min(clampInteger(safePreset.despeckle, 0, 3, 0), 1);
    safePreset.adaptivePalette = Math.min(safePreset.adaptivePalette, indexedIntent ? 18 : 10);
    safePreset.ramp = Math.min(safePreset.ramp, 8);
    safePreset.ditherZone = Math.min(safePreset.ditherZone, 18);

    if (!indexedIntent) {
      safePreset.paletteClamp = false;
      safePreset.orderedDither = false;
      safePreset.ditherStrength = 0;
      safePreset.noiseJitter = 0;
    } else {
      safePreset.palette = Math.max(clampInteger(safePreset.palette, 2, 256, 64), 48);
      safePreset.ditherStrength = Math.min(clampInteger(safePreset.ditherStrength, 0, 100, 0), 12);
      safePreset.noiseJitter = Math.min(clampInteger(safePreset.noiseJitter, 0, 100, 0), 8);
    }
  }

  return safePreset;
}

function applyQuickTuningPreset(presetKey) {
  const preset = QUICK_TUNING_PRESETS[presetKey];
  if (!preset || presetKey === "custom") {
    applyCompositePreset(null);
    return;
  }

  const safePreset = getSafeQuickPreset(presetKey, preset);
  applyCompositePreset(safePreset);

  if (safePreset !== preset) {
    const likelyNativePixelArt = Boolean(state.sourceLooksPixelArt && state.sourcePixelScale <= 1.35);
    if (!likelyNativePixelArt) {
      setStatus("Quick preset applied with conservative anti-banding safeguards for this source.");
    }
  }
}

function getGridThreshold() {
  const ratio = clampNumber(Number(elements.gridSensitivityRange.value) / 100, 0, 1, 0.5);
  return Number((0.45 - (ratio * 0.4)).toFixed(2));
}

function formatPercent(value) {
  return `${Math.round(clampNumber(value, 0, 100, 0))}%`;
}

function formatPassLabel(value) {
  return value === 1 ? "1 pass" : `${value} passes`;
}

function syncInputs() {
  elements.widthInput.value = String(state.exportWidth);
  elements.heightInput.value = String(state.exportHeight);
}

function syncScaleLabel() {
  if (!state.processed) {
    elements.scaleValue.textContent = "1.00x";
    return;
  }

  const baseWidth = state.processed.grid.detectedWidth;
  const baseHeight = state.processed.grid.detectedHeight;
  const scaleX = state.exportWidth / baseWidth;
  const scaleY = state.exportHeight / baseHeight;
  const clampedSliderValue = clampScale(scaleX);

  elements.scaleRange.value = String(clampedSliderValue);

  if (Math.abs(scaleX - scaleY) < 0.001) {
    elements.scaleValue.textContent = `${scaleX.toFixed(2)}x`;
  } else {
    elements.scaleValue.textContent = `${scaleX.toFixed(2)}x / ${scaleY.toFixed(2)}x`;
  }
}

function refreshControls() {
  const hasSource = Boolean(state.sourceImageData);
  const hasProcessed = Boolean(state.processed);
  const hasExport = Boolean(state.exportImageData);
  const disabled = state.busy;
  const skipSnap = Boolean(elements.bypassSnap.checked);
  const hasAssistSuggestions = Boolean(
    state.analytics &&
    Array.isArray(state.analytics.assistSuggestions) &&
    state.analytics.assistSuggestions.length
  );

  elements.reprocessButton.textContent = skipSnap
    ? "Rebuild"
    : state.processed?.mode === "source"
      ? "Snap Now"
      : "Re-snap";
  elements.resetSizeButton.textContent = skipSnap ? "Use Source Size" : "Use Detected Grid";

  elements.bypassSnap.disabled = !hasSource || disabled;
  elements.sampleScaleRange.disabled = !state.fullSourceImageData || disabled;
  elements.exportPaddingRange.disabled = !hasSource || disabled;
  elements.paletteClampEnabled.disabled = !hasSource || disabled;
  elements.paletteRange.disabled = !hasSource || disabled || !elements.paletteClampEnabled.checked;
  elements.quickTuningPreset.disabled = !hasProcessed || disabled;
  elements.reprocessButton.disabled = !hasSource || disabled;
  elements.scaleRange.disabled = !hasProcessed || disabled;
  elements.widthInput.disabled = !hasProcessed || disabled;
  elements.heightInput.disabled = !hasProcessed || disabled;
  elements.aspectLock.disabled = !hasProcessed || disabled;
  elements.orderedDither.disabled = !hasProcessed || disabled || skipSnap;
  elements.paletteBalanceRange.disabled = !hasProcessed || disabled || skipSnap;
  elements.gridSensitivityRange.disabled = !hasProcessed || disabled || skipSnap;
  elements.sharpenRange.disabled = !hasProcessed || disabled || skipSnap;
  elements.ditherRange.disabled = !hasProcessed || disabled || skipSnap || !elements.orderedDither.checked;
  elements.noiseJitterRange.disabled = !hasProcessed || disabled || skipSnap || !elements.orderedDither.checked;
  elements.despeckleRange.disabled = !hasProcessed || disabled || skipSnap;
  elements.mixelRange.disabled = !hasProcessed || disabled || skipSnap;
  elements.mixelGuardRange.disabled = !hasProcessed || disabled || skipSnap || Number(elements.mixelRange.value) <= 0;
  elements.powerOfTwo.disabled = !hasProcessed || disabled;
  elements.resetSizeButton.disabled = !hasProcessed || disabled;
  elements.engineProfile.disabled = !hasProcessed || disabled;
  elements.exportMetadata.disabled = !hasProcessed || disabled;
  elements.exportPaletteLut.disabled = !hasProcessed || disabled;
  elements.exportMaterialMap.disabled = !hasProcessed || disabled;
  elements.exportNormalMap.disabled = !hasProcessed || disabled;
  elements.exportAoMap.disabled = !hasProcessed || disabled;
  elements.outlineEnabled.disabled = !hasProcessed || disabled;
  elements.outlineColor.disabled = !hasProcessed || disabled || !elements.outlineEnabled.checked;
  elements.outlineThickness.disabled = !hasProcessed || disabled || !elements.outlineEnabled.checked;
  elements.adaptivePaletteRange.disabled = !hasProcessed || disabled;
  elements.clusterSizeRange.disabled = !hasProcessed || disabled;
  elements.lightNormalizeRange.disabled = !hasProcessed || disabled;
  elements.edgeLockRange.disabled = !hasProcessed || disabled;
  elements.aaIntentRange.disabled = !hasProcessed || disabled;
  elements.rampRange.disabled = !hasProcessed || disabled;
  elements.ditherZoneRange.disabled = !hasProcessed || disabled;
  elements.indexedMode.disabled = !hasProcessed || disabled;
  elements.materialAware.disabled = !hasProcessed || disabled;
  elements.showHeatmap.disabled = !hasProcessed || disabled;
  elements.batchNormalize.disabled = !hasProcessed || disabled;
  elements.previewMode.disabled = !hasProcessed || disabled;
  elements.previewSurface.disabled = !hasProcessed || disabled;
  elements.semanticAssist.disabled = !hasProcessed || disabled;
  elements.subjectMaskAssist.disabled = !hasProcessed || disabled;
  elements.smartTuneAssist.disabled = !hasProcessed || disabled;
  elements.assistStrengthRange.disabled = !hasProcessed || disabled || !elements.smartTuneAssist.checked;
  elements.assistPassesRange.disabled = !hasProcessed || disabled || !elements.smartTuneAssist.checked;
  elements.applyAssistButton.disabled = !hasProcessed || disabled || !hasAssistSuggestions;
  elements.downloadButton.disabled = !hasExport || disabled;
}

async function downloadCurrentImage() {
  const progressToken = beginTaskProgress("Preparing export...", 0.08);
  setBusy(true, "Encoding PNG for download...");

  try {
    const baseName = `${state.fileName}-${state.exportWidth}x${state.exportHeight}`;
    const profile = elements.engineProfile.value || "custom";
    const exportSelections = getExportSelections();
    const exportImageData = await buildDownloadExportImage(progressToken);
    const imageBlob = await imageDataToBlob(exportImageData);

    triggerDownload(imageBlob, `${baseName}.png`);

    if (exportSelections.metadata) {
      const metadata = buildExportMetadata(baseName, profile, exportSelections);
      const metadataBlob = new Blob(
        [JSON.stringify(metadata, null, 2)],
        { type: "application/json" }
      );
      triggerDownload(metadataBlob, `${baseName}${profile === "custom" ? "" : `-${profile}`}.json`);
    }

    if (exportSelections.paletteLut) {
      const lutImageData = buildPaletteLutImageData(exportImageData, elements.indexedMode.value);
      if (lutImageData) {
        const lutBlob = await imageDataToBlob(lutImageData);
        triggerDownload(lutBlob, `${baseName}-palette-lut.png`);
      }
    }

    if (exportSelections.materialMap) {
      const materialMap = buildMaterialMapImageData(exportImageData, getStyleSettings().clusterSize);
      const materialBlob = await imageDataToBlob(materialMap);
      triggerDownload(materialBlob, `${baseName}-material-map.png`);
    }

    if (exportSelections.normalMap) {
      const normalMap = buildNormalMapImageData(exportImageData);
      const normalBlob = await imageDataToBlob(normalMap);
      triggerDownload(normalBlob, `${baseName}-normal-map.png`);
    }

    if (exportSelections.aoMap) {
      const aoMap = buildAmbientOcclusionMapImageData(exportImageData);
      const aoBlob = await imageDataToBlob(aoMap);
      triggerDownload(aoBlob, `${baseName}-ao-map.png`);
    }

    setStatus(
      hasExtraExports(exportSelections)
        ? `Downloaded ${baseName}.png with selected sidecar exports.`
        : `Downloaded ${baseName}.png.`
    );
    endTaskProgress(progressToken);
  } catch (error) {
    endTaskProgress(progressToken);
    handleError(error);
  } finally {
    state.busy = false;
    refreshControls();
  }
}

async function buildDownloadExportImage(progressToken = null) {
  if (!state.processed) {
    throw new Error("No processed image is available for export.");
  }

  const settings = getStyleSettings();
  let baseImage;

  if (shouldUseInteractiveStyleProxy()) {
    updateTaskProgress(progressToken, 0.18, "Building full-resolution styled export...");
    baseImage = await buildStyledImage(state.processed.snappedImageData, settings, {
      progressToken,
      updateBatchAnchor: false,
    });
  } else {
    baseImage = state.styledBaseImageData ?? state.processed.snappedImageData;
  }

  if (!baseImage) {
    throw new Error("Could not build the export image.");
  }

  updateTaskProgress(progressToken, 0.78, "Resampling export...");
  const exportBaseImage = resampleWithEdgeLock(
    baseImage,
    state.exportWidth,
    state.exportHeight,
    settings.edgeLock
  );
  await yieldForResponsiveWork(exportBaseImage);

  updateTaskProgress(progressToken, 0.92, "Applying export finishing...");
  const paddedExportBaseImage = applyConfiguredExportPadding(exportBaseImage);
  const finalImage = settings.outlineEnabled
    ? applyOutline(paddedExportBaseImage, settings.outlineColor, settings.outlineThickness)
    : paddedExportBaseImage;

  state.exportImageData = finalImage;
  return finalImage;
}

function getExportSelections() {
  return {
    metadata: Boolean(elements.exportMetadata.checked),
    paletteLut: Boolean(elements.exportPaletteLut.checked),
    materialMap: Boolean(elements.exportMaterialMap.checked),
    normalMap: Boolean(elements.exportNormalMap.checked),
    aoMap: Boolean(elements.exportAoMap.checked),
  };
}

function hasExtraExports(selections) {
  return Boolean(
    selections &&
    (selections.metadata ||
      selections.paletteLut ||
      selections.materialMap ||
      selections.normalMap ||
      selections.aoMap)
  );
}

function setBusy(isBusy, message) {
  state.busy = isBusy;
  if (message) {
    setStatus(message);
  }
  refreshControls();
}

function setStatus(message) {
  elements.statusText.textContent = message;
}

function handleError(error) {
  console.error(error);
  state.progressToken += 1;
  if (elements.previewProgress) {
    elements.previewProgress.hidden = true;
    elements.previewProgress.classList.remove("is-active");
  }
  if (elements.previewProgressBar) {
    elements.previewProgressBar.style.width = "0%";
  }
  if (elements.previewProgressLabel) {
    elements.previewProgressLabel.textContent = "Idle";
  }
  state.processed = null;
  state.previewLayers = null;
  state.styledBaseImageData = null;
  state.analytics = null;
  state.exportImageData = null;
  updatePreviewTabVisibility();
  if (elements.previewSurface) {
    elements.previewSurface.value = "final";
  }
  drawPlaceholderCanvas();
  updateMetadata();
  updateDiagnostics(null);
  renderEmptyPalette();
  setStatus(error instanceof Error ? error.message : "Something went wrong while processing the image.");
}

async function fileToImageData(file) {
  if (state.processWorkerReady && state.processWorker && typeof createImageBitmap === "function") {
    try {
      const workerBitmap = await createImageBitmap(file);
      return await requestRasterizedImage(workerBitmap, state.progressToken);
    } catch (workerError) {
      console.warn("Worker rasterization failed, falling back to main-thread pixel read.", workerError);
    }
  }

  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
        context.drawImage(bitmap, 0, 0);

        return context.getImageData(0, 0, bitmap.width, bitmap.height);
      } finally {
        if (typeof bitmap.close === "function") {
          bitmap.close();
        }
      }
    } catch (error) {
      console.warn("createImageBitmap failed, falling back to Image element decode.", error);
    }
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageElement(imageUrl);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d", { alpha: true, willReadFrequently: true });
    if (!context) {
      throw new Error("Could not create a 2D drawing context.");
    }
    context.drawImage(image, 0, 0);

    return context.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function sizePreviewCanvas(width, height) {
  const stage = elements.previewStage;
  const canvas = elements.previewCanvas;

  if (!stage || !canvas || width <= 0 || height <= 0) {
    return;
  }

  const stageRect = stage.getBoundingClientRect();
  const panelRect = stage.closest(".preview-panel")?.getBoundingClientRect();
  const measuredWidth = stageRect.width > 40
    ? stageRect.width
    : Math.max((panelRect?.width ?? width) - 36, 64);
  const measuredHeight = stageRect.height > 40
    ? stageRect.height
    : Math.max((panelRect?.height ?? height) * 0.38, 220);
  const maxWidth = Math.max(measuredWidth - 20, 64);
  const maxHeight = Math.max(measuredHeight - 20, 64);
  const fitScale = Math.min(maxWidth / width, maxHeight / height);

  let displayScale;
  if (fitScale >= 1) {
    displayScale = Math.max(1, Math.floor(fitScale));
  } else {
    displayScale = fitScale;
  }

  const displayWidth = Math.max(1, Math.floor(width * displayScale));
  const displayHeight = Math.max(1, Math.floor(height * displayScale));

  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;
}

function isSupportedImage(file) {
  if (!file) {
    return false;
  }

  if (typeof file.type === "string" && file.type.startsWith("image/")) {
    return true;
  }

  return /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name || "");
}

function getTransferFile(dataTransfer) {
  if (!dataTransfer) {
    return null;
  }

  if (dataTransfer.files && dataTransfer.files.length > 0) {
    return dataTransfer.files[0];
  }

  if (dataTransfer.items) {
    for (const item of dataTransfer.items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          return file;
        }
      }
    }
  }

  return null;
}

function setCanvasDisplaySize(width, height) {
  elements.previewCanvas.style.width = `${width}px`;
  elements.previewCanvas.style.height = `${height}px`;
}

function clearCanvasDisplaySize() {
  elements.previewCanvas.style.width = "";
  elements.previewCanvas.style.height = "";
}

function getPreviewPlaceholderSize() {
  const stage = elements.previewStage;
  if (!stage) {
    return 24;
  }

  return Math.max(24, Math.min(160, Math.floor(Math.min(stage.clientWidth, stage.clientHeight) * 0.35)));
}

function drawPlaceholderCanvas() {
  const size = getPreviewPlaceholderSize();
  const canvas = elements.previewCanvas;
  canvas.width = size;
  canvas.height = size;
  setCanvasDisplaySize(size, size);

  const context = canvas.getContext("2d", { alpha: true });
  context.clearRect(0, 0, size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const isBright = (x + y) % 2 === 0;
      context.fillStyle = isBright ? "rgba(124, 255, 212, 0.18)" : "rgba(130, 168, 255, 0.12)";
      context.fillRect(x, y, 1, 1);
    }
  }
}

window.addEventListener("resize", () => {
  if (state.exportImageData) {
    sizePreviewCanvas(state.exportImageData.width, state.exportImageData.height);
    return;
  }

  if (state.sourceImageData && !state.processed) {
    sizePreviewCanvas(state.sourceImageData.width, state.sourceImageData.height);
    return;
  }

  drawPlaceholderCanvas();
});

function drawPlaceholderCanvasLegacy() {
  const canvas = elements.previewCanvas;
  canvas.width = 24;
  canvas.height = 24;

  const context = canvas.getContext("2d", { alpha: true });
  context.clearRect(0, 0, 24, 24);

  for (let y = 0; y < 24; y += 1) {
    for (let x = 0; x < 24; x += 1) {
      const isBright = (x + y) % 2 === 0;
      context.fillStyle = isBright ? "rgba(124, 255, 212, 0.18)" : "rgba(130, 168, 255, 0.12)";
      context.fillRect(x, y, 1, 1);
    }
  }
}

function extractPalette(imageData, limit) {
  const counts = new Map();
  const { data } = imageData;

  for (let offset = 0; offset < data.length; offset += 4) {
    const alpha = data[offset + 3];
    if (alpha === 0) {
      continue;
    }

    const key = `${data[offset]},${data[offset + 1]},${data[offset + 2]},${alpha}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([key]) => key.split(",").map(Number));
}

function colorToCss([red, green, blue, alpha]) {
  return `rgba(${red}, ${green}, ${blue}, ${(alpha / 255).toFixed(3)})`;
}

function updateDiagnostics(analytics, exportImageData = null) {
  if (!analytics) {
    elements.paletteScore.textContent = "-";
    elements.readabilityScore.textContent = "-";
    elements.lightDirection.textContent = "-";
    elements.densityCheck.textContent = "-";
    elements.materialReport.textContent = "-";
    elements.integrityReport.textContent = "No analysis yet.";
    if (elements.semanticGuess) {
      elements.semanticGuess.textContent = "Assist disabled";
    }
    if (elements.subjectProfile) {
      elements.subjectProfile.textContent = "Enable semantic read or smart suggestions in the Assist tab.";
    }
    if (elements.assistRecommendations) {
      elements.assistRecommendations.textContent = "No local assist recommendations yet.";
    }
    renderPieChart(elements.materialPie, [], "No Data");
    renderChartLegend(elements.materialLegend, []);
    renderPieChart(elements.lightPie, [], "Light");
    renderChartLegend(elements.lightLegend, []);
    return;
  }

  const readabilityScore = exportImageData
    ? computeReadabilityScore(exportImageData)
    : analytics.readabilityScore;

  elements.paletteScore.textContent = `${analytics.paletteScore}/100`;
  elements.readabilityScore.textContent = `${readabilityScore}/100`;
  elements.lightDirection.textContent = analytics.lightDirection;
  elements.densityCheck.textContent = analytics.densitySummary;
  elements.materialReport.textContent = analytics.materialSummary;
  elements.integrityReport.textContent = analytics.integritySummary;
  if (elements.semanticGuess) {
    elements.semanticGuess.textContent = analytics.semanticGuess;
  }
  if (elements.subjectProfile) {
    elements.subjectProfile.textContent = analytics.subjectSummary;
  }
  if (elements.assistRecommendations) {
    elements.assistRecommendations.textContent = analytics.assistSummary;
  }
  renderPieChart(elements.materialPie, analytics.materialBreakdown, analytics.materialPrimaryLabel);
  renderChartLegend(elements.materialLegend, analytics.materialBreakdown, 6);
  renderPieChart(elements.lightPie, analytics.lightBreakdown, analytics.lightPrimaryLabel);
  renderChartLegend(elements.lightLegend, analytics.lightBreakdown, 4);
}

function buildAnalytics(imageData, settings) {
  const palette = reorderPaletteForIndexMode(extractPalette(imageData, 48), settings.indexedMode);
  const paletteScore = computePaletteCoherenceScore(palette);
  const lightInfo = inferLightInfo(imageData);
  const densityInfo = state.processed?.mode === "bypass" || state.processed?.mode === "source"
    ? { score: 100, summary: "Source locked 100%" }
    : analyzeDensityConsistency(state.processed ? state.processed.grid : null);
  const materialInfo = summarizeMaterialClassification(imageData, settings.clusterSize);
  const integrity = validatePixelIntegrity(imageData);
  const assistInfo = buildLocalAssistInsights(imageData, settings, {
    palette,
    paletteScore,
    readabilityScore: computeReadabilityScore(imageData),
    lightInfo,
    densityInfo,
    materialInfo,
    integrity,
  });

  return {
    paletteScore,
    readabilityScore: assistInfo.readabilityScore,
    lightDirection: lightInfo.summary,
    lightBreakdown: lightInfo.breakdown,
    lightPrimaryLabel: lightInfo.primaryLabel,
    densitySummary: densityInfo.summary,
    materialSummary: materialInfo.summary,
    materialBreakdown: materialInfo.breakdown,
    materialPrimaryLabel: materialInfo.primaryLabel,
    integritySummary: integrity.summary,
    semanticGuess: assistInfo.semanticGuess,
    subjectSummary: assistInfo.subjectSummary,
    assistSummary: assistInfo.assistSummary,
    assistSuggestions: assistInfo.assistSuggestions,
  };
}

function buildLocalAssistInsights(imageData, settings, context) {
  if (!settings.semanticAssist && !settings.smartTuneAssist) {
    return {
      readabilityScore: context.readabilityScore,
      semanticGuess: "Assist disabled",
      subjectSummary: "Enable local semantic read to profile the current sprite.",
      assistSummary: "Enable smart tuning suggestions to generate optional local recommendations.",
      assistSuggestions: [],
    };
  }

  const subject = analyzeSubjectProfile(imageData, settings.subjectMaskAssist);
  const semantic = inferSemanticGuess(subject, context.materialInfo, context.lightInfo, context.integrity);
  const assistSuggestions = settings.smartTuneAssist
    ? buildAssistSuggestions(imageData, settings, subject, context, semantic)
    : [];

  const semanticGuess = (settings.semanticAssist || settings.smartTuneAssist)
    ? `${semantic.label} (${semantic.confidence}%)`
    : "Assist disabled";

  const subjectSummary = (settings.semanticAssist || settings.smartTuneAssist)
    ? subject.summary
    : "Enable local semantic read to profile the current sprite.";

  const assistSummary = settings.smartTuneAssist
    ? formatAssistSummary(assistSuggestions)
    : "Enable smart tuning suggestions to generate optional local recommendations.";

  return {
    readabilityScore: context.readabilityScore,
    semanticGuess,
    subjectSummary,
    assistSummary,
    assistSuggestions,
  };
}

function analyzeSubjectProfile(imageData, useSubjectMask) {
  const { width, height, data } = imageData;
  const totalPixels = width * height;
  const edgeMap = computeEdgeMap(imageData);
  const hasTransparency = hasTransparentPixels(imageData);
  const background = useSubjectMask && !hasTransparency
    ? sampleCornerBackground(imageData)
    : null;
  const subjectMask = new Uint8Array(totalPixels);
  let subjectCount = 0;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let edgeTotal = 0;
  let weightedX = 0;
  let weightedY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = ((y * width) + x) * 4;
      const index = (y * width) + x;
      const alpha = data[offset + 3];
      let isSubject = alpha > 0;

      if (background) {
        const distance = rgbDistance(
          data[offset],
          data[offset + 1],
          data[offset + 2],
          background[0],
          background[1],
          background[2]
        );
        isSubject = distance >= 24;
      }

      if (!isSubject) {
        continue;
      }

      subjectMask[index] = 1;
      subjectCount += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      edgeTotal += edgeMap[index];
      weightedX += x;
      weightedY += y;
    }
  }

  if (!subjectCount) {
    return {
      coverage: 0,
      aspectRatio: 1,
      bboxCoverage: 0,
      symmetry: 0,
      edgeDensity: 0,
      centerBias: 0,
      summary: "No visible subject silhouette.",
    };
  }

  const bboxWidth = Math.max(1, (maxX - minX) + 1);
  const bboxHeight = Math.max(1, (maxY - minY) + 1);
  const bboxArea = bboxWidth * bboxHeight;
  const centerX = weightedX / subjectCount;
  const centerY = weightedY / subjectCount;
  const normalizedCenterX = Math.abs((centerX / Math.max(1, width - 1)) - 0.5) * 2;
  const normalizedCenterY = Math.abs((centerY / Math.max(1, height - 1)) - 0.5) * 2;
  const symmetry = computeMaskSymmetry(subjectMask, width, minX, minY, maxX, maxY);
  const coverage = subjectCount / Math.max(1, totalPixels);
  const bboxCoverage = bboxArea / Math.max(1, totalPixels);
  const edgeDensity = edgeTotal / subjectCount;
  const centerBias = 1 - Math.min(1, (normalizedCenterX * 0.55) + (normalizedCenterY * 0.45));

  return {
    coverage,
    aspectRatio: bboxWidth / Math.max(1, bboxHeight),
    bboxCoverage,
    symmetry,
    edgeDensity,
    centerBias,
    summary: `${Math.round(coverage * 100)}% cover | ${Math.round(edgeDensity * 100)}% edge lock | ${Math.round(symmetry * 100)}% symmetry`,
  };
}

function inferSemanticGuess(subject, materialInfo, lightInfo, integrity) {
  const dominantMaterial = materialInfo.breakdown?.[0]?.key || "stone";
  const dominantLightShare = getMaxSliceShare(lightInfo.breakdown);
  let label = "General sprite / prop";
  let confidence = 52;

  if (subject.coverage <= 0.16 && subject.aspectRatio >= 0.78 && subject.aspectRatio <= 1.22) {
    label = "UI icon / pickup";
    confidence = 84;
  } else if (subject.aspectRatio >= 1.8 && subject.coverage >= 0.32) {
    label = "Environment strip / wide prop";
    confidence = 78;
  } else if (subject.aspectRatio <= 0.72 && subject.coverage >= 0.22) {
    label = "Portrait / standing subject";
    confidence = 74;
  } else if (dominantMaterial === "emissive" && subject.coverage <= 0.3) {
    label = "Effect / spell / pickup";
    confidence = 81;
  } else if ((dominantMaterial === "metal" || dominantMaterial === "glass") && subject.coverage <= 0.58) {
    label = "Weapon / mechanical prop";
    confidence = 72;
  } else if (
    dominantMaterial === "organic" ||
    dominantMaterial === "leather" ||
    dominantMaterial === "cloth"
  ) {
    label = subject.aspectRatio > 1.25
      ? "Character / creature bust"
      : "Creature / boss asset";
    confidence = 69;
  }

  if (subject.symmetry >= 0.7) {
    confidence += 4;
  }

  if (subject.centerBias < 0.42) {
    confidence -= 5;
  }

  if ((integrity.totalIssues ?? 0) > 28) {
    confidence -= 6;
  }

  if (dominantLightShare > 40) {
    confidence += 2;
  }

  return {
    label,
    confidence: clampInteger(confidence, 20, 96, 52),
  };
}

function buildAssistSuggestions(imageData, settings, subject, context, semantic) {
  const distinctColors = extractPalette(imageData, 256).length;
  const dominantMaterial = context.materialInfo.breakdown?.[0]?.key || "stone";
  const dominantLightShare = getMaxSliceShare(context.lightInfo.breakdown);
  const strength = settings.assistStrength;
  const passes = settings.assistPasses;
  const issueWeight = Math.min(1, (context.integrity.totalIssues ?? 0) / 36);
  const gradientNeed = clampNumber((1 - subject.edgeDensity) + ((100 - context.paletteScore) / 140), 0, 1, 0.4);
  const readabilityNeed = clampNumber((60 - context.readabilityScore) / 60, 0, 1, 0);
  const passBias = (passes - 1) / 5;

  const suggestions = [];

  if (!settings.bypassSnap) {
    const paletteTarget = clampInteger(
      Math.round(
        Math.max(8, Math.min(
          160,
          (distinctColors * (0.38 + (strength * 0.45))) + (subject.coverage > 0.45 ? 8 : 0)
        ))
      ),
      2,
      256,
      clampInteger(elements.paletteRange.value, 2, 256, 16)
    );

    const orderedDither = gradientNeed > 0.34 && dominantMaterial !== "metal";
    const ditherStrength = orderedDither
      ? clampInteger(Math.round((gradientNeed * 52) + (passBias * 12)), 0, 100, 0)
      : 0;
    const jitterStrength = orderedDither
      ? clampInteger(Math.round((gradientNeed * 28) + (passBias * 8)), 0, 100, 0)
      : 0;

    suggestions.push(
      { type: "range", key: "paletteRange", value: paletteTarget },
      { type: "checkbox", key: "orderedDither", value: orderedDither },
      { type: "range", key: "ditherRange", value: ditherStrength },
      { type: "range", key: "noiseJitterRange", value: jitterStrength },
      {
        type: "range",
        key: "sharpenRange",
        value: clampInteger(Math.round((readabilityNeed * 46) + (subject.edgeDensity < 0.3 ? 12 : 0)), 0, 100, 0),
      },
      {
        type: "range",
        key: "mixelRange",
        value: clampInteger(Math.round((issueWeight * 58) + 18), 0, 100, 35),
      },
      {
        type: "range",
        key: "despeckleRange",
        value: clampInteger(Math.round(1 + (issueWeight * 2)), 0, 3, 1),
      }
    );
  }

  const enableOutline = context.readabilityScore < 48 && subject.coverage >= 0.12 && subject.coverage <= 0.82;
  const outlineColor = dominantMaterial === "emissive"
    ? "#120f1a"
    : dominantMaterial === "stone"
      ? "#101418"
      : "#101010";

  suggestions.push(
    {
      type: "range",
      key: "adaptivePaletteRange",
      value: clampInteger(Math.round(((100 - context.paletteScore) * 0.38) + (passBias * 10)), 0, 100, 0),
    },
    {
      type: "range",
      key: "edgeLockRange",
      value: clampInteger(Math.round(68 + (subject.edgeDensity * 24) + (readabilityNeed * 10)), 0, 100, 65),
    },
    {
      type: "range",
      key: "lightNormalizeRange",
      value: clampInteger(Math.round(((dominantLightShare < 26 ? 18 : 8) + (passBias * 6))), 0, 100, 0),
    },
    {
      type: "checkbox",
      key: "materialAware",
      value: ["metal", "glass", "liquid", "organic", "leather"].includes(dominantMaterial),
    },
    {
      type: "checkbox",
      key: "outlineEnabled",
      value: enableOutline,
    },
    {
      type: "range",
      key: "outlineThickness",
      value: semantic.label.includes("Environment") ? 2 : 1,
    },
    {
      type: "color",
      key: "outlineColor",
      value: outlineColor,
    }
  );

  return suggestions;
}

function formatAssistSummary(suggestions) {
  if (!suggestions.length) {
    return "No strong suggestion. The current settings already read as stable.";
  }

  const summaryParts = [];

  for (const suggestion of suggestions) {
    if (suggestion.key === "paletteRange") {
      summaryParts.push(`Palette ${suggestion.value}`);
    } else if (suggestion.key === "sharpenRange") {
      summaryParts.push(`Sharpen ${suggestion.value}%`);
    } else if (suggestion.key === "ditherRange" && suggestion.value > 0) {
      summaryParts.push(`Dither ${suggestion.value}%`);
    } else if (suggestion.key === "edgeLockRange") {
      summaryParts.push(`Edge lock ${suggestion.value}%`);
    } else if (suggestion.key === "outlineEnabled" && suggestion.value) {
      summaryParts.push("Outline on");
    }

    if (summaryParts.length >= 4) {
      break;
    }
  }

  return summaryParts.length
    ? summaryParts.join(" | ")
    : "Optional assist ready. Use Apply Suggested Settings to stage the recommended values.";
}

async function applyAssistSuggestions() {
  const suggestions = Array.isArray(state.analytics?.assistSuggestions)
    ? state.analytics.assistSuggestions
    : [];

  if (!suggestions.length) {
    setStatus("No assist suggestions are available for the current image.");
    return;
  }

  for (const suggestion of suggestions) {
    applySettingSuggestion(suggestion);
  }

  updateTuningOutputs();
  updateAdvancedOutputs();
  updateAssistOutputs();
  refreshControls();

  if (state.sourceImageData && !state.busy) {
    await runSnapPipeline({ allowUnsafeGrid: true });
  }
}

function applySettingSuggestion(suggestion) {
  const element = elements[suggestion.key];
  if (!element) {
    return;
  }

  if (suggestion.type === "range") {
    setRangeControl(element, suggestion.value);
    return;
  }

  if (suggestion.type === "checkbox") {
    setCheckboxControl(element, suggestion.value);
    return;
  }

  if (suggestion.type === "color") {
    element.value = suggestion.value;
  }
}

function hasTransparentPixels(imageData) {
  const { data } = imageData;
  for (let offset = 3; offset < data.length; offset += 4) {
    if (data[offset] < 250) {
      return true;
    }
  }
  return false;
}

function sampleCornerBackground(imageData) {
  const { width, height, data } = imageData;
  const sampleRadius = Math.max(1, Math.min(3, Math.floor(Math.min(width, height) / 12)));
  const corners = [
    [0, 0],
    [Math.max(0, width - sampleRadius), 0],
    [0, Math.max(0, height - sampleRadius)],
    [Math.max(0, width - sampleRadius), Math.max(0, height - sampleRadius)],
  ];
  let sumRed = 0;
  let sumGreen = 0;
  let sumBlue = 0;
  let count = 0;

  for (const [startX, startY] of corners) {
    for (let y = startY; y < Math.min(height, startY + sampleRadius); y += 1) {
      for (let x = startX; x < Math.min(width, startX + sampleRadius); x += 1) {
        const offset = ((y * width) + x) * 4;
        sumRed += data[offset];
        sumGreen += data[offset + 1];
        sumBlue += data[offset + 2];
        count += 1;
      }
    }
  }

  if (!count) {
    return [0, 0, 0];
  }

  return [
    Math.round(sumRed / count),
    Math.round(sumGreen / count),
    Math.round(sumBlue / count),
  ];
}

function computeMaskSymmetry(mask, width, minX, minY, maxX, maxY) {
  let matches = 0;
  let comparisons = 0;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const mirrorX = maxX - (x - minX);
      if (mirrorX < minX || mirrorX > maxX || mirrorX <= x) {
        continue;
      }

      const left = mask[(y * width) + x];
      const right = mask[(y * width) + mirrorX];
      comparisons += 1;
      if (left === right) {
        matches += 1;
      }
    }
  }

  if (!comparisons) {
    return 1;
  }

  return matches / comparisons;
}

function getMaxSliceShare(slices) {
  if (!Array.isArray(slices) || !slices.length) {
    return 0;
  }

  let maxShare = 0;
  for (const slice of slices) {
    maxShare = Math.max(maxShare, slice?.share ?? 0);
  }
  return maxShare;
}

function renderPieChart(element, slices, centerLabel) {
  if (!element) {
    return;
  }

  const label = element.querySelector(".pie-chart__label");
  const normalized = Array.isArray(slices)
    ? slices.filter((slice) => slice && slice.value > 0)
    : [];

  if (!normalized.length) {
    element.style.removeProperty("--pie-fill");
    if (label) {
      label.textContent = centerLabel || "No Data";
    }
    return;
  }

  const total = normalized.reduce((sum, slice) => sum + slice.value, 0);
  let cursor = 0;
  const stops = normalized.map((slice) => {
    const share = total > 0
      ? (slice.value / total) * 100
      : 0;
    const start = cursor;
    cursor += share;
    return `${slice.color} ${start.toFixed(2)}% ${Math.min(100, cursor).toFixed(2)}%`;
  });

  if (cursor < 100) {
    stops.push(`rgba(255, 255, 255, 0.05) ${cursor.toFixed(2)}% 100%`);
  }

  element.style.setProperty("--pie-fill", `conic-gradient(from -90deg, ${stops.join(", ")})`);
  if (label) {
    label.textContent = centerLabel || normalized[0].label;
  }
}

function renderChartLegend(container, slices, limit = 6) {
  if (!container) {
    return;
  }

  const normalized = Array.isArray(slices)
    ? slices
      .filter((slice) => slice && slice.value > 0)
      .slice()
      .sort((left, right) => right.value - left.value)
      .slice(0, Math.max(1, limit))
    : [];

  container.replaceChildren();

  if (!normalized.length) {
    const empty = document.createElement("span");
    empty.className = "chart-legend__empty";
    empty.textContent = "No breakdown yet.";
    container.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const slice of normalized) {
    const row = document.createElement("div");
    row.className = "chart-legend__item";

    const swatch = document.createElement("span");
    swatch.className = "chart-legend__swatch";
    swatch.style.backgroundColor = slice.color;

    const name = document.createElement("span");
    name.className = "chart-legend__name";
    name.textContent = slice.label;

    const value = document.createElement("span");
    value.className = "chart-legend__value";
    value.textContent = `${slice.share}%`;

    row.append(swatch, name, value);
    fragment.appendChild(row);
  }

  container.appendChild(fragment);
}

function normalizeLightSectorIndex(value) {
  return ((value % LIGHT_SECTOR_STYLES.length) + LIGHT_SECTOR_STYLES.length) % LIGHT_SECTOR_STYLES.length;
}

function getMaterialStyle(material) {
  return MATERIAL_STYLES[material] ?? MATERIAL_STYLES.stone;
}

function createMaterialCountMap() {
  const counts = {};
  Object.keys(MATERIAL_STYLES).forEach((material) => {
    counts[material] = 0;
  });
  return counts;
}

function reorderPaletteForIndexMode(colors, mode) {
  if (!Array.isArray(colors) || colors.length === 0 || mode === "off") {
    return colors;
  }

  const nextColors = colors.slice();

  if (mode === "perceptual") {
    nextColors.sort((left, right) => {
      const leftHsl = rgbToHsl(left[0], left[1], left[2]);
      const rightHsl = rgbToHsl(right[0], right[1], right[2]);
      const hueDelta = leftHsl.h - rightHsl.h;
      if (Math.abs(hueDelta) > 0.06) {
        return hueDelta;
      }
      return leftHsl.l - rightHsl.l;
    });
    return nextColors;
  }

  if (mode === "shader") {
    nextColors.sort((left, right) => {
      const leftHsl = rgbToHsl(left[0], left[1], left[2]);
      const rightHsl = rgbToHsl(right[0], right[1], right[2]);
      const leftBand = Math.floor(leftHsl.h * 8);
      const rightBand = Math.floor(rightHsl.h * 8);
      if (leftBand !== rightBand) {
        return leftBand - rightBand;
      }
      if (Math.abs(leftHsl.l - rightHsl.l) > 0.05) {
        return leftHsl.l - rightHsl.l;
      }
      return leftHsl.s - rightHsl.s;
    });
    return nextColors;
  }

  if (mode === "retro") {
    nextColors.sort((left, right) => {
      const leftLuma = luminance(left[0], left[1], left[2]);
      const rightLuma = luminance(right[0], right[1], right[2]);
      const leftBucket = Math.floor(leftLuma * 5);
      const rightBucket = Math.floor(rightLuma * 5);
      if (leftBucket !== rightBucket) {
        return leftBucket - rightBucket;
      }
      return left[1] - right[1];
    });
  }

  return nextColors;
}

function computePaletteCoherenceScore(palette) {
  if (!palette.length) {
    return 0;
  }

  const hslPalette = palette.map((color) => rgbToHsl(color[0], color[1], color[2]));
  const luminanceValues = hslPalette.map((color) => color.l).sort((left, right) => left - right);
  const saturationValues = hslPalette.map((color) => color.s);
  const hueValues = hslPalette.map((color) => color.h).sort((left, right) => left - right);

  const hueGaps = [];
  for (let index = 0; index < hueValues.length; index += 1) {
    const nextIndex = (index + 1) % hueValues.length;
    const nextHue = nextIndex === 0 ? hueValues[0] + 1 : hueValues[nextIndex];
    hueGaps.push(nextHue - hueValues[index]);
  }

  const steps = [];
  for (let index = 1; index < luminanceValues.length; index += 1) {
    steps.push(luminanceValues[index] - luminanceValues[index - 1]);
  }

  const hueHarmony = 1 - Math.min(1, standardDeviation(hueGaps) * 3.2);
  const saturationDiscipline = 1 - Math.min(1, standardDeviation(saturationValues) * 1.8);
  const valueBanding = Math.min(1, countDistinctBands(luminanceValues, 0.08) / Math.max(4, palette.length * 0.5));
  const contrastLadder = steps.length > 0
    ? 1 - Math.min(1, standardDeviation(steps) * 5.5)
    : 1;

  const score = (
    (hueHarmony * 0.28) +
    (saturationDiscipline * 0.22) +
    (valueBanding * 0.24) +
    (contrastLadder * 0.26)
  ) * 100;

  return clampInteger(Math.round(score), 0, 100, 0);
}

function inferLightInfo(imageData) {
  const { width, height, data } = imageData;
  const centerX = (width - 1) * 0.5;
  const centerY = (height - 1) * 0.5;
  const sectorWeights = new Array(LIGHT_SECTOR_STYLES.length).fill(0);
  let weightedX = 0;
  let weightedY = 0;
  let weightTotal = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = ((y * width) + x) * 4;
      const alpha = data[offset + 3];
      if (alpha === 0) {
        continue;
      }

      const brightness = luminance(data[offset], data[offset + 1], data[offset + 2]);
      const weight = brightness * (alpha / 255);
      const deltaX = x - centerX;
      const deltaY = y - centerY;
      const distance = Math.hypot(deltaX, deltaY);
      const radialWeight = Math.max(0.18, distance / Math.max(1, Math.hypot(centerX || 1, centerY || 1)));
      weightedX += deltaX * weight;
      weightedY += deltaY * weight;
      weightTotal += weight;

      if (weight > 0) {
        const sectorIndex = normalizeLightSectorIndex(
          Math.round((Math.atan2(deltaY, deltaX) + (Math.PI / 2)) / (Math.PI / 4))
        );
        sectorWeights[sectorIndex] += weight * radialWeight;
      }
    }
  }

  if (weightTotal <= 0) {
    return {
      x: 0,
      y: 0,
      label: "Centered",
      summary: "Centered",
      primaryLabel: "No Data",
      breakdown: [],
    };
  }

  const radius = Math.max(1, Math.hypot(centerX || 1, centerY || 1));
  const x = weightedX / weightTotal / radius;
  const y = weightedY / weightTotal / radius;
  const magnitude = Math.hypot(x, y);
  const breakdown = LIGHT_SECTOR_STYLES.map((sector, index) => ({
    key: sector.key,
    label: sector.label,
    color: sector.color,
    value: sectorWeights[index],
    share: 0,
  }));
  const directionalTotal = breakdown.reduce((sum, slice) => sum + slice.value, 0);

  if (directionalTotal > 0) {
    breakdown.forEach((slice) => {
      slice.share = clampInteger(Math.round((slice.value / directionalTotal) * 100), 0, 100, 0);
    });
  }

  const dominantSlice = breakdown
    .slice()
    .sort((left, right) => right.value - left.value)[0];

  if (magnitude < 0.08) {
    if (!dominantSlice || dominantSlice.share < 18) {
      return {
        x,
        y,
        label: "Centered",
        summary: "Centered / diffuse",
        primaryLabel: "Diffuse",
        breakdown,
      };
    }
  }
  const vertical = y < -0.08 ? "Top" : y > 0.08 ? "Bottom" : "";
  const horizontal = x < -0.08 ? "Left" : x > 0.08 ? "Right" : "";
  const vectorLabel = `${vertical}${vertical && horizontal ? "-" : ""}${horizontal}` || "Centered";
  const dominantLabel = dominantSlice?.label || vectorLabel;
  const dominantShare = dominantSlice?.share ?? 0;

  return {
    x,
    y,
    label: vectorLabel,
    summary: `${dominantLabel} bias ${dominantShare}%`,
    primaryLabel: `${dominantLabel} ${dominantShare}%`,
    breakdown,
  };
}

function analyzeDensityConsistency(grid) {
  if (!grid) {
    return { score: 0, summary: "-" };
  }

  const colSteps = diffCuts(grid.columns);
  const rowSteps = diffCuts(grid.rows);
  const colCv = coefficientOfVariation(colSteps);
  const rowCv = coefficientOfVariation(rowSteps);
  const skew = Math.abs(meanNumber(colSteps) - meanNumber(rowSteps)) / Math.max(1, meanNumber(colSteps), meanNumber(rowSteps));
  const penalty = Math.min(1, (colCv * 1.6) + (rowCv * 1.6) + (skew * 0.9));
  const score = clampInteger(Math.round((1 - penalty) * 100), 0, 100, 0);

  if (score >= 85) {
    return { score, summary: `Stable ${score}%` };
  }

  if (score >= 65) {
    return { score, summary: `Minor drift ${score}%` };
  }

  return { score, summary: `Inconsistent ${score}%` };
}

function summarizeMaterialClassification(imageData, clusterSize) {
  const counts = classifyMaterialTiles(imageData, clusterSize);
  const entries = Object.entries(counts)
    .filter((entry) => entry[1] > 0)
    .sort((left, right) => right[1] - left[1]);

  if (!entries.length) {
    return {
      summary: "No opaque pixels",
      breakdown: [],
      primaryLabel: "No Data",
    };
  }

  const total = entries.reduce((sum, entry) => sum + entry[1], 0);
  const breakdown = entries.map(([material, count]) => {
    const style = getMaterialStyle(material);
    return {
      key: material,
      label: style.label,
      color: style.color,
      value: count,
      share: clampInteger(Math.round((count / total) * 100), 0, 100, 0),
    };
  });
  const secondary = entries[1];
  const topSlice = breakdown[0];

  if (!secondary) {
    return {
      summary: `${topSlice.label} ${topSlice.share}%`,
      breakdown,
      primaryLabel: `${topSlice.label} ${topSlice.share}%`,
    };
  }

  const secondaryStyle = getMaterialStyle(secondary[0]);
  const secondaryShare = clampInteger(Math.round((secondary[1] / total) * 100), 0, 100, 0);
  return {
    summary: `${topSlice.label} ${topSlice.share}% | ${secondaryStyle.label} ${secondaryShare}%`,
    breakdown,
    primaryLabel: `${topSlice.label} ${topSlice.share}%`,
  };
}

function validatePixelIntegrity(imageData) {
  const { width, height, data } = imageData;
  let speckles = 0;
  let mixels = 0;
  let stairSteps = 0;
  let banding = 0;
  let tangents = 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const offset = ((y * width) + x) * 4;
      const alpha = data[offset + 3];
      if (alpha === 0) {
        continue;
      }

      const centerKey = packColorValue(data[offset], data[offset + 1], data[offset + 2], alpha);
      let matching = 0;
      let diagonalOpaque = 0;
      let orthogonalOpaque = 0;

      for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
        for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
          if (xOffset === 0 && yOffset === 0) {
            continue;
          }

          const sampleOffset = (((y + yOffset) * width) + (x + xOffset)) * 4;
          const sampleKey = packColorValue(
            data[sampleOffset],
            data[sampleOffset + 1],
            data[sampleOffset + 2],
            data[sampleOffset + 3]
          );

          if (sampleKey === centerKey) {
            matching += 1;
          }

          if (Math.abs(xOffset) + Math.abs(yOffset) === 1) {
            if (data[sampleOffset + 3] > 0) {
              orthogonalOpaque += 1;
            }
          } else if (data[sampleOffset + 3] > 0) {
            diagonalOpaque += 1;
          }
        }
      }

      if (matching <= 1) {
        speckles += 1;
      }

      if (diagonalOpaque > 0 && orthogonalOpaque <= 1) {
        tangents += 1;
      }
    }
  }

  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const offsets = [
        ((y * width) + x) * 4,
        ((y * width) + x + 1) * 4,
        ((((y + 1) * width) + x) * 4),
        ((((y + 1) * width) + x + 1) * 4),
      ];
      const keys = offsets.map((offset) => packColorValue(
        data[offset],
        data[offset + 1],
        data[offset + 2],
        data[offset + 3]
      ));
      const distinct = new Set(keys);

      if (distinct.size === 2) {
        const a = keys[0] === keys[3] && keys[0] !== keys[1] && keys[1] === keys[2];
        const b = keys[0] === keys[1] && keys[0] !== keys[2] && keys[2] === keys[3];
        const c = keys[0] === keys[2] && keys[0] !== keys[1] && keys[1] === keys[3];
        if (a || c) {
          mixels += 1;
          stairSteps += c ? 1 : 0;
        }
        if (b) {
          banding += 1;
        }
      }
    }
  }

  const totalIssues = speckles + mixels + stairSteps + banding + tangents;
  const severity = totalIssues <= 6 ? "Clean" : totalIssues <= 22 ? "Watch" : "Needs cleanup";
  return {
    summary: `${severity} | Mixels ${mixels}, Speckles ${speckles}, Stair ${stairSteps}, Banding ${banding}, Tangents ${tangents}`,
    severity,
    totalIssues,
    speckles,
    mixels,
    stairSteps,
    banding,
    tangents,
  };
}

function computeReadabilityScore(imageData) {
  const sampleWidth = Math.max(1, Math.round(imageData.width * 0.25));
  const sampleHeight = Math.max(1, Math.round(imageData.height * 0.25));
  const reduced = resamplePixelArt(imageData, sampleWidth, sampleHeight);
  const { data } = reduced;
  let opaqueCount = 0;
  let luminanceTotal = 0;
  const values = [];

  for (let offset = 0; offset < data.length; offset += 4) {
    if (data[offset + 3] === 0) {
      continue;
    }

    const value = luminance(data[offset], data[offset + 1], data[offset + 2]);
    values.push(value);
    luminanceTotal += value;
    opaqueCount += 1;
  }

  if (!opaqueCount) {
    return 0;
  }

  const coverage = opaqueCount / (reduced.width * reduced.height);
  const averageLuma = luminanceTotal / opaqueCount;
  const lumaSpread = standardDeviation(values) / 255;
  const silhouetteDiscipline = 1 - Math.min(1, Math.abs(coverage - 0.42) * 2.4);
  const contrastClarity = Math.min(1, lumaSpread * 2.8);
  const midtoneBias = 1 - Math.min(1, Math.abs((averageLuma / 255) - 0.52) * 1.7);

  const score = (
    (silhouetteDiscipline * 0.38) +
    (contrastClarity * 0.42) +
    (midtoneBias * 0.20)
  ) * 100;

  return clampInteger(Math.round(score), 0, 100, 0);
}

function applyAdaptivePaletteReduction(imageData, amount, clusterSize) {
  if (amount <= 0) {
    return cloneImageDataLocal(imageData);
  }

  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);
  const tileSize = Math.max(2, clusterSize);
  const localPaletteSize = amount >= 0.72 ? 2 : amount >= 0.38 ? 3 : 4;
  const remapThreshold = 20 + (amount * 72);

  for (let startY = 0; startY < height; startY += tileSize) {
    const endY = Math.min(startY + tileSize, height);

    for (let startX = 0; startX < width; startX += tileSize) {
      const endX = Math.min(startX + tileSize, width);
      const palette = collectRegionPalette(imageData, startX, startY, endX, endY, localPaletteSize);

      if (palette.length < 2) {
        continue;
      }

      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const offset = ((y * width) + x) * 4;
          const alpha = data[offset + 3];
          if (alpha === 0) {
            continue;
          }

          const nearest = findNearestPaletteColor(
            [data[offset], data[offset + 1], data[offset + 2]],
            palette
          );
          const distance = rgbDistance(
            data[offset],
            data[offset + 1],
            data[offset + 2],
            nearest[0],
            nearest[1],
            nearest[2]
          );

          if (distance <= remapThreshold) {
            output[offset] = nearest[0];
            output[offset + 1] = nearest[1];
            output[offset + 2] = nearest[2];
          }
        }
      }
    }
  }

  return new ImageData(output, width, height);
}

function applySubpixelIntentCleanup(imageData, aaIntent) {
  const threshold = 12 + (aaIntent * 84);
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const offset = ((y * width) + x) * 4;
      const alpha = data[offset + 3];
      if (alpha === 0) {
        continue;
      }

      const dominant = getDominantNeighborColor(imageData, x, y);
      if (!dominant || dominant.matching < 4) {
        continue;
      }

      const distance = rgbDistance(
        data[offset],
        data[offset + 1],
        data[offset + 2],
        dominant.color[0],
        dominant.color[1],
        dominant.color[2]
      );

      if (distance > threshold) {
        output[offset] = dominant.color[0];
        output[offset + 1] = dominant.color[1];
        output[offset + 2] = dominant.color[2];
        output[offset + 3] = dominant.color[3];
      }
    }
  }

  return new ImageData(output, width, height);
}

function applyColorRampRemap(imageData, amount, indexedMode) {
  if (amount <= 0) {
    return cloneImageDataLocal(imageData);
  }

  const palette = reorderPaletteForIndexMode(extractPalette(imageData, 24), indexedMode)
    .filter((color) => color[3] > 0)
    .sort((left, right) => luminance(left[0], left[1], left[2]) - luminance(right[0], right[1], right[2]));

  if (palette.length < 3) {
    return cloneImageDataLocal(imageData);
  }

  const ramp = buildColorRamp(palette);
  const flatnessThreshold = 18 + ((1 - amount) * 24);
  const remapThreshold = 28 + (amount * 56);
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const offset = ((y * width) + x) * 4;
      if (data[offset + 3] === 0) {
        continue;
      }

      const neighborAverage = getAverageNeighborColor(imageData, x, y);
      const flatness = rgbDistance(
        data[offset],
        data[offset + 1],
        data[offset + 2],
        neighborAverage[0],
        neighborAverage[1],
        neighborAverage[2]
      );

      if (flatness > flatnessThreshold) {
        continue;
      }

      const nearest = findNearestPaletteColor(
        [data[offset], data[offset + 1], data[offset + 2]],
        ramp
      );
      const distance = rgbDistance(
        data[offset],
        data[offset + 1],
        data[offset + 2],
        nearest[0],
        nearest[1],
        nearest[2]
      );

      if (distance <= remapThreshold) {
        output[offset] = nearest[0];
        output[offset + 1] = nearest[1];
        output[offset + 2] = nearest[2];
      }
    }
  }

  return new ImageData(output, width, height);
}

function applyLightNormalization(imageData, amount) {
  if (amount <= 0) {
    return cloneImageDataLocal(imageData);
  }

  const light = inferLightInfo(imageData);
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);
  const centerX = Math.max(1, (width - 1) * 0.5);
  const centerY = Math.max(1, (height - 1) * 0.5);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = ((y * width) + x) * 4;
      const alpha = data[offset + 3];
      if (alpha === 0) {
        continue;
      }

      const xNormal = (x - centerX) / centerX;
      const yNormal = (y - centerY) / centerY;
      const influence = ((xNormal * light.x) + (yNormal * light.y)) * 0.5;
      const delta = influence * amount * 42;

      output[offset] = clampByte(data[offset] + delta);
      output[offset + 1] = clampByte(data[offset + 1] + delta);
      output[offset + 2] = clampByte(data[offset + 2] + delta);
    }
  }

  return new ImageData(output, width, height);
}

function applyMaterialEnhancement(imageData, clusterSize) {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);
  const tileSize = Math.max(2, clusterSize);

  for (let startY = 0; startY < height; startY += tileSize) {
    const endY = Math.min(startY + tileSize, height);

    for (let startX = 0; startX < width; startX += tileSize) {
      const endX = Math.min(startX + tileSize, width);
      const material = classifyTileMaterial(imageData, startX, startY, endX, endY);
      const profile = getMaterialAdjustments(material);

      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const offset = ((y * width) + x) * 4;
          const alpha = data[offset + 3];
          if (alpha === 0) {
            continue;
          }

          let red = data[offset];
          let green = data[offset + 1];
          let blue = data[offset + 2];
          let [hue, saturation, lightness] = hslTuple(rgbToHsl(red, green, blue));

          saturation = clampNumber(saturation * profile.saturation, 0, 1, saturation);
          lightness = clampNumber(((lightness - 0.5) * profile.contrast) + 0.5 + profile.lift, 0, 1, lightness);

          if (profile.emissiveBoost > 0 && lightness > 0.65) {
            lightness = clampNumber(lightness + profile.emissiveBoost, 0, 1, lightness);
          }

          [red, green, blue] = hslToRgb(hue, saturation, lightness);
          output[offset] = red;
          output[offset + 1] = green;
          output[offset + 2] = blue;
        }
      }
    }
  }

  return new ImageData(output, width, height);
}

function applyBatchStyleNormalization(imageData, anchor) {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);

  for (let offset = 0; offset < data.length; offset += 4) {
    if (data[offset + 3] === 0) {
      continue;
    }

    const hsl = rgbToHsl(data[offset], data[offset + 1], data[offset + 2]);
    const hue = blendCircularHue(hsl.h, anchor.hue, 0.08);
    const saturation = clampNumber(hsl.s + ((anchor.saturation - hsl.s) * 0.18), 0, 1, hsl.s);
    const lightness = clampNumber(hsl.l + ((anchor.lightness - hsl.l) * 0.16), 0, 1, hsl.l);
    const [red, green, blue] = hslToRgb(hue, saturation, lightness);

    output[offset] = red;
    output[offset + 1] = green;
    output[offset + 2] = blue;
  }

  return new ImageData(output, width, height);
}

function applySelectiveDitherZones(imageData, amount) {
  if (amount <= 0) {
    return cloneImageDataLocal(imageData);
  }

  const palette = extractPalette(imageData, 16)
    .filter((color) => color[3] > 0)
    .sort((left, right) => luminance(left[0], left[1], left[2]) - luminance(right[0], right[1], right[2]));

  if (palette.length < 3) {
    return cloneImageDataLocal(imageData);
  }

  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);
  const tileSize = 4;
  const gradientThreshold = 10 + ((1 - amount) * 50);
  const matrix = [
    [0, 2],
    [3, 1],
  ];

  for (let startY = 0; startY < height; startY += tileSize) {
    const endY = Math.min(startY + tileSize, height);

    for (let startX = 0; startX < width; startX += tileSize) {
      const endX = Math.min(startX + tileSize, width);
      const stats = measureRegionLuminance(imageData, startX, startY, endX, endY);

      if (stats.range < gradientThreshold || stats.uniqueColors < 3) {
        continue;
      }

      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const offset = ((y * width) + x) * 4;
          if (data[offset + 3] === 0) {
            continue;
          }

          const currentLuma = luminance(data[offset], data[offset + 1], data[offset + 2]) * 255;
          const pair = findPaletteBounds(palette, currentLuma);
          if (!pair.lower || !pair.upper) {
            continue;
          }

          const lowerLuma = luminance(pair.lower[0], pair.lower[1], pair.lower[2]);
          const upperLuma = luminance(pair.upper[0], pair.upper[1], pair.upper[2]);
          const range = Math.max(1, upperLuma - lowerLuma);
          const ratio = (currentLuma - lowerLuma) / range;
          const threshold = (matrix[y & 1][x & 1] + 0.5) / 4;
          const target = ratio > threshold ? pair.upper : pair.lower;

          output[offset] = target[0];
          output[offset + 1] = target[1];
          output[offset + 2] = target[2];
        }
      }
    }
  }

  return new ImageData(output, width, height);
}

function resampleWithEdgeLock(sourceImageData, targetWidth, targetHeight, amount) {
  const dominant = resamplePixelArt(sourceImageData, targetWidth, targetHeight);
  if (amount <= 0 || (targetWidth >= sourceImageData.width && targetHeight >= sourceImageData.height)) {
    return dominant;
  }

  const { width: srcWidth, height: srcHeight } = sourceImageData;
  const edgeMap = computeEdgeMap(sourceImageData);
  const centerSample = resampleCenterPixel(sourceImageData, targetWidth, targetHeight);
  const output = new Uint8ClampedArray(dominant.data);
  const threshold = 0.08 + ((1 - amount) * 0.22);

  for (let y = 0; y < targetHeight; y += 1) {
    const startY = Math.floor((y * srcHeight) / targetHeight);
    const endY = Math.max(startY + 1, Math.ceil(((y + 1) * srcHeight) / targetHeight));

    for (let x = 0; x < targetWidth; x += 1) {
      const startX = Math.floor((x * srcWidth) / targetWidth);
      const endX = Math.max(startX + 1, Math.ceil(((x + 1) * srcWidth) / targetWidth));
      const edgeStrength = averageEdgeStrength(edgeMap, srcWidth, startX, endX, startY, endY);

      if (edgeStrength < threshold) {
        continue;
      }

      const offset = ((y * targetWidth) + x) * 4;
      output[offset] = centerSample.data[offset];
      output[offset + 1] = centerSample.data[offset + 1];
      output[offset + 2] = centerSample.data[offset + 2];
      output[offset + 3] = centerSample.data[offset + 3];
    }
  }

  return new ImageData(output, targetWidth, targetHeight);
}

function buildExteriorTransparencyMask(imageData, passableAlpha = 10) {
  const { width, height, data } = imageData;
  const visited = new Uint8Array(width * height);
  const queue = [];
  let head = 0;

  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) {
      return;
    }

    const index = (y * width) + x;
    if (visited[index]) {
      return;
    }

    const offset = index * 4;
    if (data[offset + 3] > passableAlpha) {
      return;
    }

    visited[index] = 1;
    queue.push(index);
  };

  for (let x = 0; x < width; x += 1) {
    tryPush(x, 0);
    tryPush(x, height - 1);
  }

  for (let y = 0; y < height; y += 1) {
    tryPush(0, y);
    tryPush(width - 1, y);
  }

  while (head < queue.length) {
    const index = queue[head];
    head += 1;

    const x = index % width;
    const y = Math.floor(index / width);

    tryPush(x - 1, y);
    tryPush(x + 1, y);
    tryPush(x, y - 1);
    tryPush(x, y + 1);
  }

  return visited;
}

function applyOutline(imageData, color, thickness) {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data);
  const radius = Math.max(1, thickness);
  const exteriorMask = buildExteriorTransparencyMask(imageData);
  const transparentAlphaThreshold = 10;
  const solidAlphaThreshold = 208;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = ((y * width) + x) * 4;
      const index = (y * width) + x;

      if (data[offset + 3] > transparentAlphaThreshold || !exteriorMask[index]) {
        continue;
      }

      let shouldStroke = false;

      for (let yOffset = -radius; yOffset <= radius && !shouldStroke; yOffset += 1) {
        const sampleY = y + yOffset;
        if (sampleY < 0 || sampleY >= height) {
          continue;
        }

        for (let xOffset = -radius; xOffset <= radius; xOffset += 1) {
          const sampleX = x + xOffset;
          if (sampleX < 0 || sampleX >= width) {
            continue;
          }

          if (Math.abs(xOffset) + Math.abs(yOffset) > radius) {
            continue;
          }

          const sampleOffset = ((sampleY * width) + sampleX) * 4;
          if (data[sampleOffset + 3] >= solidAlphaThreshold) {
            shouldStroke = true;
            break;
          }
        }
      }

      if (shouldStroke) {
        output[offset] = color[0];
        output[offset + 1] = color[1];
        output[offset + 2] = color[2];
        output[offset + 3] = 255;
      }
    }
  }

  return new ImageData(output, width, height);
}

function applyPreviewMode(imageData, mode) {
  if (mode === "grayscale") {
    return convertToGrayscale(imageData);
  }

  if (mode === "silhouette") {
    return convertToSilhouette(imageData);
  }

  if (mode === "scale_50") {
    return simulateReadabilityScale(imageData, 0.5);
  }

  if (mode === "scale_25") {
    return simulateReadabilityScale(imageData, 0.25);
  }

  if (mode === "scale_12") {
    return simulateReadabilityScale(imageData, 0.125);
  }

  return cloneImageDataLocal(imageData);
}

function overlayErrorHeatmap(baseImageData, referenceImageData) {
  const width = Math.min(baseImageData.width, referenceImageData.width);
  const height = Math.min(baseImageData.height, referenceImageData.height);
  if (width <= 0 || height <= 0) {
    return cloneImageDataLocal(baseImageData);
  }

  const output = new Uint8ClampedArray(width * height * 4);
  const baseWidth = baseImageData.width;
  const referenceWidth = referenceImageData.width;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const baseOffset = ((y * baseWidth) + x) * 4;
      const referenceOffset = ((y * referenceWidth) + x) * 4;
      const outputOffset = ((y * width) + x) * 4;
      output[outputOffset] = baseImageData.data[baseOffset];
      output[outputOffset + 1] = baseImageData.data[baseOffset + 1];
      output[outputOffset + 2] = baseImageData.data[baseOffset + 2];
      output[outputOffset + 3] = baseImageData.data[baseOffset + 3];
      const alpha = Math.max(
        baseImageData.data[baseOffset + 3],
        referenceImageData.data[referenceOffset + 3]
      );

      if (alpha === 0) {
        continue;
      }

      const delta = perceptualErrorAtOffset(
        baseImageData.data,
        baseOffset,
        referenceImageData.data,
        referenceOffset
      );
      if (delta < 0.08) {
        continue;
      }

      const intensity = Math.min(1, delta * 1.4);
      const heat = [
        clampByte(190 + (65 * intensity)),
        clampByte(40 + (120 * (1 - intensity))),
        clampByte(20 + (80 * (1 - intensity))),
      ];
      const blend = Math.min(0.6, 0.18 + (intensity * 0.42));

      output[outputOffset] = clampByte((baseImageData.data[baseOffset] * (1 - blend)) + (heat[0] * blend));
      output[outputOffset + 1] = clampByte((baseImageData.data[baseOffset + 1] * (1 - blend)) + (heat[1] * blend));
      output[outputOffset + 2] = clampByte((baseImageData.data[baseOffset + 2] * (1 - blend)) + (heat[2] * blend));
      output[outputOffset + 3] = baseImageData.data[baseOffset + 3];
    }
  }

  return new ImageData(output, width, height);
}

function buildExportMetadata(baseName, profile, exportSelections = getExportSelections()) {
  const settings = getStyleSettings();
  const exportPadding = getScaledExportPadding();
  const palette = reorderPaletteForIndexMode(
    extractPalette(state.exportImageData, 256),
    settings.indexedMode
  ).map((color) => `#${toHex(color[0])}${toHex(color[1])}${toHex(color[2])}`);

  return {
    version: 1,
    profile,
    source: (state.fullSourceImageData || state.sourceImageData)
      ? {
        width: (state.fullSourceImageData || state.sourceImageData).width,
        height: (state.fullSourceImageData || state.sourceImageData).height,
      }
      : null,
    working_sample: state.sourceImageData
      ? {
        width: state.sourceImageData.width,
        height: state.sourceImageData.height,
        percent: getWorkingSamplePercent(),
      }
      : null,
    detected_grid: state.processed
      ? {
        width: state.processed.grid.detectedWidth,
        height: state.processed.grid.detectedHeight,
      }
      : null,
    export: {
      width: state.exportWidth,
      height: state.exportHeight,
      final_width: state.exportImageData?.width ?? state.exportWidth,
      final_height: state.exportImageData?.height ?? state.exportHeight,
      power_of_two: Boolean(elements.powerOfTwo.checked),
      indexed_mode: settings.indexedMode,
      preview_mode: settings.previewMode,
    },
    padding: {
      source_pixels: getExportPaddingPixels(),
      export_pixels_x: exportPadding.x,
      export_pixels_y: exportPadding.y,
    },
    atlas: {
      image: `${baseName}.png`,
      columns: 1,
      rows: 1,
      frames: [
        {
          name: state.fileName,
          x: exportPadding.x,
          y: exportPadding.y,
          width: state.exportWidth,
          height: state.exportHeight,
        },
      ],
    },
    outline: {
      enabled: settings.outlineEnabled,
      color: `#${toHex(settings.outlineColor[0])}${toHex(settings.outlineColor[1])}${toHex(settings.outlineColor[2])}`,
      thickness: settings.outlineThickness,
    },
    extras: {
      metadata: exportSelections.metadata,
      palette_lut: exportSelections.paletteLut ? `${baseName}-palette-lut.png` : null,
      material_map: exportSelections.materialMap ? `${baseName}-material-map.png` : null,
      normal_map: exportSelections.normalMap ? `${baseName}-normal-map.png` : null,
      ao_map: exportSelections.aoMap ? `${baseName}-ao-map.png` : null,
    },
    palette,
    diagnostics: state.analytics,
  };
}

function buildPaletteLutImageData(imageData, mode) {
  const palette = reorderPaletteForIndexMode(extractPalette(imageData, 256), mode)
    .filter((color) => color[3] > 0);

  if (!palette.length) {
    return null;
  }

  const width = palette.length;
  const height = 1;
  const output = new Uint8ClampedArray(width * height * 4);

  for (let index = 0; index < palette.length; index += 1) {
    const offset = index * 4;
    output[offset] = palette[index][0];
    output[offset + 1] = palette[index][1];
    output[offset + 2] = palette[index][2];
    output[offset + 3] = 255;
  }

  return new ImageData(output, width, height);
}

function buildNormalMapImageData(imageData) {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = ((y * width) + x) * 4;
      const alpha = data[offset + 3];
      if (alpha === 0) {
        continue;
      }

      const left = sampleHeightAt(imageData, x - 1, y);
      const right = sampleHeightAt(imageData, x + 1, y);
      const up = sampleHeightAt(imageData, x, y - 1);
      const down = sampleHeightAt(imageData, x, y + 1);
      const dx = (left - right) / 255;
      const dy = (up - down) / 255;
      const dz = 1;
      const length = Math.max(0.0001, Math.hypot(dx, dy, dz));
      const nx = (dx / length * 0.5) + 0.5;
      const ny = (dy / length * 0.5) + 0.5;
      const nz = (dz / length * 0.5) + 0.5;

      output[offset] = clampByte(nx * 255);
      output[offset + 1] = clampByte(ny * 255);
      output[offset + 2] = clampByte(nz * 255);
      output[offset + 3] = alpha;
    }
  }

  return new ImageData(output, width, height);
}

function buildAmbientOcclusionMapImageData(imageData) {
  const { width, height, data } = imageData;
  const output = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = ((y * width) + x) * 4;
      const alpha = data[offset + 3];
      if (alpha === 0) {
        continue;
      }

      let occlusion = 0;
      let samples = 0;

      for (let yOffset = -2; yOffset <= 2; yOffset += 1) {
        for (let xOffset = -2; xOffset <= 2; xOffset += 1) {
          if (xOffset === 0 && yOffset === 0) {
            continue;
          }

          const distance = Math.abs(xOffset) + Math.abs(yOffset);
          if (distance > 3) {
            continue;
          }

          const sampleAlpha = sampleAlphaAt(imageData, x + xOffset, y + yOffset);
          occlusion += (sampleAlpha / 255) / Math.max(1, distance);
          samples += 1 / Math.max(1, distance);
        }
      }

      const normalized = samples > 0
        ? clampNumber(occlusion / samples, 0, 1, 0)
        : 0;
      const shade = clampByte((1 - (normalized * 0.72)) * 255);

      output[offset] = shade;
      output[offset + 1] = shade;
      output[offset + 2] = shade;
      output[offset + 3] = alpha;
    }
  }

  return new ImageData(output, width, height);
}

function buildMaterialMapImageData(imageData, clusterSize) {
  const output = new Uint8ClampedArray(imageData.data.length);
  const tileSize = Math.max(2, clusterSize);

  for (let startY = 0; startY < imageData.height; startY += tileSize) {
    const endY = Math.min(startY + tileSize, imageData.height);

    for (let startX = 0; startX < imageData.width; startX += tileSize) {
      const endX = Math.min(startX + tileSize, imageData.width);
      const material = classifyTileMaterial(imageData, startX, startY, endX, endY);
      const color = getMaterialStyle(material).rgb;

      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          const sourceOffset = ((y * imageData.width) + x) * 4;
          if (imageData.data[sourceOffset + 3] === 0) {
            continue;
          }

          output[sourceOffset] = color[0];
          output[sourceOffset + 1] = color[1];
          output[sourceOffset + 2] = color[2];
          output[sourceOffset + 3] = 255;
        }
      }
    }
  }

  return new ImageData(output, imageData.width, imageData.height);
}

function collectRegionPalette(imageData, startX, startY, endX, endY, limit) {
  const counts = new Map();
  const { width, data } = imageData;

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const offset = ((y * width) + x) * 4;
      const alpha = data[offset + 3];
      if (alpha === 0) {
        continue;
      }

      const key = packColorValue(data[offset], data[offset + 1], data[offset + 2], alpha);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map((entry) => unpackColorValue(entry[0]));
}

function findNearestPaletteColor(color, palette) {
  let best = palette[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of palette) {
    const distance = rgbDistance(
      color[0],
      color[1],
      color[2],
      candidate[0],
      candidate[1],
      candidate[2]
    );

    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  return best;
}

function getDominantNeighborColor(imageData, x, y) {
  const { width, data } = imageData;
  const counts = new Map();

  for (let yOffset = -1; yOffset <= 1; yOffset += 1) {
    for (let xOffset = -1; xOffset <= 1; xOffset += 1) {
      if (xOffset === 0 && yOffset === 0) {
        continue;
      }

      const offset = (((y + yOffset) * width) + (x + xOffset)) * 4;
      const alpha = data[offset + 3];
      if (alpha === 0) {
        continue;
      }

      const key = packColorValue(data[offset], data[offset + 1], data[offset + 2], alpha);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  let bestKey = null;
  let bestCount = 0;
  for (const [key, count] of counts.entries()) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }

  if (bestKey === null) {
    return null;
  }

  return {
    color: unpackColorValue(bestKey),
    matching: bestCount,
  };
}

function buildColorRamp(palette) {
  const picks = [0, 0.33, 0.66, 1];
  return picks.map((ratio) => {
    const index = Math.min(palette.length - 1, Math.round((palette.length - 1) * ratio));
    return palette[index];
  });
}

function getAverageNeighborColor(imageData, x, y) {
  const { width, data } = imageData;
  let sumRed = 0;
  let sumGreen = 0;
  let sumBlue = 0;
  let count = 0;

  const neighbors = [
    [0, -1],
    [-1, 0],
    [1, 0],
    [0, 1],
  ];

  for (const [xOffset, yOffset] of neighbors) {
    const offset = (((y + yOffset) * width) + (x + xOffset)) * 4;
    const alpha = data[offset + 3];
    if (alpha === 0) {
      continue;
    }

    sumRed += data[offset];
    sumGreen += data[offset + 1];
    sumBlue += data[offset + 2];
    count += 1;
  }

  if (!count) {
    const centerOffset = ((y * width) + x) * 4;
    return [data[centerOffset], data[centerOffset + 1], data[centerOffset + 2]];
  }

  return [
    Math.round(sumRed / count),
    Math.round(sumGreen / count),
    Math.round(sumBlue / count),
  ];
}

function hslTuple(color) {
  return [color.h, color.s, color.l];
}

function computeBatchStyleAnchor(imageData) {
  const { data } = imageData;
  let sumCos = 0;
  let sumSin = 0;
  let sumSaturation = 0;
  let sumLightness = 0;
  let count = 0;

  for (let offset = 0; offset < data.length; offset += 4) {
    if (data[offset + 3] === 0) {
      continue;
    }

    const hsl = rgbToHsl(data[offset], data[offset + 1], data[offset + 2]);
    const radians = hsl.h * Math.PI * 2;
    sumCos += Math.cos(radians);
    sumSin += Math.sin(radians);
    sumSaturation += hsl.s;
    sumLightness += hsl.l;
    count += 1;
  }

  if (!count) {
    return {
      hue: 0,
      saturation: 0.5,
      lightness: 0.5,
    };
  }

  const hue = ((Math.atan2(sumSin / count, sumCos / count) / (Math.PI * 2)) + 1) % 1;
  return {
    hue,
    saturation: sumSaturation / count,
    lightness: sumLightness / count,
  };
}

function blendBatchStyleAnchors(left, right, amount) {
  return {
    hue: blendCircularHue(left.hue, right.hue, amount),
    saturation: left.saturation + ((right.saturation - left.saturation) * amount),
    lightness: left.lightness + ((right.lightness - left.lightness) * amount),
  };
}

function classifyMaterialTiles(imageData, clusterSize) {
  const counts = createMaterialCountMap();
  const tileSize = Math.max(2, clusterSize);

  for (let startY = 0; startY < imageData.height; startY += tileSize) {
    const endY = Math.min(startY + tileSize, imageData.height);
    for (let startX = 0; startX < imageData.width; startX += tileSize) {
      const endX = Math.min(startX + tileSize, imageData.width);
      const stats = measureRegionLuminance(imageData, startX, startY, endX, endY);
      if (stats.opaqueCount === 0) {
        continue;
      }
      const material = classifyTileMaterial(imageData, startX, startY, endX, endY);
      counts[material] += 1;
    }
  }

  return counts;
}

function classifyTileMaterial(imageData, startX, startY, endX, endY) {
  const stats = measureRegionLuminance(imageData, startX, startY, endX, endY);
  if (stats.opaqueCount === 0) {
    return "stone";
  }

  if (stats.brightRatio > 0.24 && stats.averageSaturation > 0.4 && stats.highSatRatio > 0.18) {
    return "emissive";
  }

  if (
    stats.coolRatio > 0.42 &&
    stats.averageLightness > 0.52 &&
    stats.averageSaturation < 0.32 &&
    stats.contrast < 0.24 &&
    stats.lowSatRatio > 0.24
  ) {
    return "glass";
  }

  if (stats.contrast > 0.28 && stats.brightRatio > 0.08 && stats.lowSatRatio > 0.18 && stats.deviation > 0.12) {
    return "metal";
  }

  if (
    stats.coolRatio > 0.32 &&
    stats.averageSaturation > 0.26 &&
    stats.averageSaturation < 0.62 &&
    stats.averageLightness > 0.26 &&
    stats.averageLightness < 0.68 &&
    stats.deviation < 0.18
  ) {
    return "liquid";
  }

  if (
    stats.warmRatio > 0.44 &&
    stats.averageSaturation > 0.14 &&
    stats.averageSaturation < 0.5 &&
    stats.averageLightness > 0.2 &&
    stats.averageLightness < 0.62 &&
    (stats.uniqueColors >= 4 || stats.deviation > 0.08 || stats.contrast > 0.16) &&
    stats.contrast < 0.3
  ) {
    return "wood";
  }

  if (
    stats.warmRatio > 0.62 &&
    stats.averageSaturation > 0.1 &&
    stats.averageSaturation < 0.36 &&
    stats.averageLightness < 0.42 &&
    stats.uniqueColors <= 3 &&
    stats.deviation < 0.09 &&
    stats.contrast < 0.16
  ) {
    return "leather";
  }

  if (stats.averageSaturation > 0.48 && stats.highSatRatio > 0.28) {
    return "organic";
  }

  if (stats.averageSaturation < 0.18 || (stats.lowSatRatio > 0.45 && stats.contrast < 0.22)) {
    return "stone";
  }

  if (stats.deviation < 0.1 && stats.contrast < 0.16) {
    return "cloth";
  }

  return "cloth";
}

function getMaterialAdjustments(material) {
  if (material === "metal") {
    return { contrast: 1.14, saturation: 0.96, lift: 0.02, emissiveBoost: 0 };
  }

  if (material === "glass") {
    return { contrast: 1.06, saturation: 0.92, lift: 0.04, emissiveBoost: 0.01 };
  }

  if (material === "liquid") {
    return { contrast: 1.05, saturation: 1.06, lift: 0.02, emissiveBoost: 0.02 };
  }

  if (material === "wood") {
    return { contrast: 1.03, saturation: 0.94, lift: 0, emissiveBoost: 0 };
  }

  if (material === "leather") {
    return { contrast: 1.04, saturation: 0.96, lift: 0, emissiveBoost: 0 };
  }

  if (material === "cloth") {
    return { contrast: 0.95, saturation: 1.02, lift: 0.01, emissiveBoost: 0 };
  }

  if (material === "organic") {
    return { contrast: 1.02, saturation: 1.08, lift: 0.01, emissiveBoost: 0 };
  }

  if (material === "emissive") {
    return { contrast: 1.08, saturation: 1.12, lift: 0.03, emissiveBoost: 0.05 };
  }

  return { contrast: 1.08, saturation: 0.9, lift: -0.01, emissiveBoost: 0 };
}

function measureRegionLuminance(imageData, startX, startY, endX, endY) {
  const { width, data } = imageData;
  let minimum = 255;
  let maximum = 0;
  let total = 0;
  let totalSaturation = 0;
  let totalLightness = 0;
  let totalHueX = 0;
  let totalHueY = 0;
  let opaqueCount = 0;
  let brightCount = 0;
  let warmCount = 0;
  let coolCount = 0;
  let highSatCount = 0;
  let lowSatCount = 0;
  let darkCount = 0;
  const colors = new Set();
  const samples = [];

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const offset = ((y * width) + x) * 4;
      const alpha = data[offset + 3];
      if (alpha === 0) {
        continue;
      }

      const value = luminance(data[offset], data[offset + 1], data[offset + 2]) * 255;
      const hsl = rgbToHsl(data[offset], data[offset + 1], data[offset + 2]);
      const hueRadians = hsl.h * Math.PI * 2;
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
      total += value;
      totalSaturation += hsl.s;
      totalLightness += hsl.l;
      totalHueX += Math.cos(hueRadians);
      totalHueY += Math.sin(hueRadians);
      opaqueCount += 1;
      colors.add(packColorValue(data[offset], data[offset + 1], data[offset + 2], alpha));
      samples.push(value);

      if (hsl.l > 0.72) {
        brightCount += 1;
      }

      if (hsl.l < 0.28) {
        darkCount += 1;
      }

      if (hsl.s >= 0.5) {
        highSatCount += 1;
      }

      if (hsl.s <= 0.18) {
        lowSatCount += 1;
      }

      if (hsl.h <= 0.18 || hsl.h >= 0.92) {
        warmCount += 1;
      }

      if (hsl.h >= 0.46 && hsl.h <= 0.72) {
        coolCount += 1;
      }
    }
  }

  if (!opaqueCount) {
    return {
      range: 0,
      contrast: 0,
      averageSaturation: 0,
      brightRatio: 0,
      uniqueColors: 0,
      opaqueCount: 0,
      mean: 0,
      deviation: 0,
      averageLightness: 0,
      averageHue: 0,
      warmRatio: 0,
      coolRatio: 0,
      highSatRatio: 0,
      lowSatRatio: 0,
      darkRatio: 0,
    };
  }

  return {
    range: maximum - minimum,
    contrast: (maximum - minimum) / 255,
    averageSaturation: totalSaturation / opaqueCount,
    brightRatio: brightCount / opaqueCount,
    uniqueColors: colors.size,
    opaqueCount,
    mean: total / opaqueCount,
    deviation: standardDeviation(samples) / 255,
    averageLightness: totalLightness / opaqueCount,
    averageHue: ((Math.atan2(totalHueY / opaqueCount, totalHueX / opaqueCount) / (Math.PI * 2)) + 1) % 1,
    warmRatio: warmCount / opaqueCount,
    coolRatio: coolCount / opaqueCount,
    highSatRatio: highSatCount / opaqueCount,
    lowSatRatio: lowSatCount / opaqueCount,
    darkRatio: darkCount / opaqueCount,
  };
}

function findPaletteBounds(palette, value) {
  let lower = palette[0];
  let upper = palette[palette.length - 1];

  for (let index = 0; index < palette.length; index += 1) {
    const color = palette[index];
    const luma = luminance(color[0], color[1], color[2]) * 255;

    if (luma <= value) {
      lower = color;
    }

    if (luma >= value) {
      upper = color;
      break;
    }
  }

  return { lower, upper };
}

function computeEdgeMap(imageData) {
  const { width, height, data } = imageData;
  const map = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const topLeft = sampleLuminanceAt(data, width, x - 1, y - 1);
      const top = sampleLuminanceAt(data, width, x, y - 1);
      const topRight = sampleLuminanceAt(data, width, x + 1, y - 1);
      const left = sampleLuminanceAt(data, width, x - 1, y);
      const right = sampleLuminanceAt(data, width, x + 1, y);
      const bottomLeft = sampleLuminanceAt(data, width, x - 1, y + 1);
      const bottom = sampleLuminanceAt(data, width, x, y + 1);
      const bottomRight = sampleLuminanceAt(data, width, x + 1, y + 1);
      const gx = (-topLeft - (2 * left) - bottomLeft) + topRight + (2 * right) + bottomRight;
      const gy = (-topLeft - (2 * top) - topRight) + bottomLeft + (2 * bottom) + bottomRight;
      map[(y * width) + x] = Math.min(1, Math.hypot(gx, gy) / 2.8);
    }
  }

  return map;
}

function resampleCenterPixel(imageData, targetWidth, targetHeight) {
  const { width: srcWidth, height: srcHeight, data } = imageData;
  const output = new Uint8ClampedArray(targetWidth * targetHeight * 4);

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(
      srcHeight - 1,
      Math.floor((((y + 0.5) * srcHeight) / targetHeight))
    );

    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(
        srcWidth - 1,
        Math.floor((((x + 0.5) * srcWidth) / targetWidth))
      );
      const sourceOffset = ((sourceY * srcWidth) + sourceX) * 4;
      const offset = ((y * targetWidth) + x) * 4;

      output[offset] = data[sourceOffset];
      output[offset + 1] = data[sourceOffset + 1];
      output[offset + 2] = data[sourceOffset + 2];
      output[offset + 3] = data[sourceOffset + 3];
    }
  }

  return new ImageData(output, targetWidth, targetHeight);
}

function averageEdgeStrength(edgeMap, width, startX, endX, startY, endY) {
  let total = 0;
  let count = 0;

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      total += edgeMap[(y * width) + x];
      count += 1;
    }
  }

  return count ? total / count : 0;
}

function convertToGrayscale(imageData) {
  const output = new Uint8ClampedArray(imageData.data);

  for (let offset = 0; offset < output.length; offset += 4) {
    const alpha = output[offset + 3];
    if (alpha === 0) {
      continue;
    }

    const value = clampByte(luminance(output[offset], output[offset + 1], output[offset + 2]) * 255);
    output[offset] = value;
    output[offset + 1] = value;
    output[offset + 2] = value;
  }

  return new ImageData(output, imageData.width, imageData.height);
}

function convertToSilhouette(imageData) {
  const output = new Uint8ClampedArray(imageData.data);

  for (let offset = 0; offset < output.length; offset += 4) {
    const alpha = output[offset + 3];
    if (alpha === 0) {
      continue;
    }

    output[offset] = 240;
    output[offset + 1] = 244;
    output[offset + 2] = 255;
  }

  return new ImageData(output, imageData.width, imageData.height);
}

function simulateReadabilityScale(imageData, ratio) {
  const reduced = resamplePixelArt(
    imageData,
    Math.max(1, Math.round(imageData.width * ratio)),
    Math.max(1, Math.round(imageData.height * ratio))
  );
  return resamplePixelArt(reduced, imageData.width, imageData.height);
}

function perceptualErrorAtOffset(leftData, leftOffset, rightData, rightOffset) {
  const redDelta = (leftData[leftOffset] - rightData[rightOffset]) / 255;
  const greenDelta = (leftData[leftOffset + 1] - rightData[rightOffset + 1]) / 255;
  const blueDelta = (leftData[leftOffset + 2] - rightData[rightOffset + 2]) / 255;
  const alphaDelta = (leftData[leftOffset + 3] - rightData[rightOffset + 3]) / 255;
  return Math.sqrt(
    (redDelta * redDelta * 0.3) +
    (greenDelta * greenDelta * 0.59) +
    (blueDelta * blueDelta * 0.11) +
    (alphaDelta * alphaDelta * 0.2)
  );
}

function setRangeControl(input, value) {
  if (!input) {
    return;
  }

  const minimum = Number(input.min || 0);
  const maximum = Number(input.max || value);
  const step = Number(input.step || 1);
  const clamped = clampNumber(value, minimum, maximum, minimum);
  const stepped = step > 0 ? Math.round(clamped / step) * step : clamped;
  input.value = String(clampNumber(stepped, minimum, maximum, minimum));
}

function setCheckboxControl(input, checked) {
  if (input) {
    input.checked = Boolean(checked);
  }
}

function setSelectControl(input, value) {
  if (input) {
    input.value = value;
  }
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}

function parseHexColor(value) {
  const match = /^#?([0-9a-f]{6})$/i.exec(value || "");
  if (!match) {
    return [16, 16, 16, 255];
  }

  return [
    Number.parseInt(match[1].slice(0, 2), 16),
    Number.parseInt(match[1].slice(2, 4), 16),
    Number.parseInt(match[1].slice(4, 6), 16),
    255,
  ];
}

function cloneImageDataLocal(imageData) {
  return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
}

function packColorValue(red, green, blue, alpha) {
  return ((((red * 256) + green) * 256 + blue) * 256) + alpha;
}

function unpackColorValue(value) {
  const alpha = value % 256;
  const blue = Math.floor(value / 256) % 256;
  const green = Math.floor(value / 65536) % 256;
  const red = Math.floor(value / 16777216) % 256;
  return [red, green, blue, alpha];
}

function rgbDistance(r1, g1, b1, r2, g2, b2) {
  const red = r1 - r2;
  const green = g1 - g2;
  const blue = b1 - b2;
  return Math.sqrt((red * red) + (green * green) + (blue * blue));
}

function luminance(red, green, blue) {
  return ((red * 0.299) + (green * 0.587) + (blue * 0.114)) / 255;
}

function sampleLuminanceAt(data, width, x, y) {
  const offset = ((y * width) + x) * 4;
  if (data[offset + 3] === 0) {
    return 0;
  }

  return luminance(data[offset], data[offset + 1], data[offset + 2]);
}

function sampleHeightAt(imageData, x, y) {
  const sampleX = clampInteger(x, 0, imageData.width - 1, 0);
  const sampleY = clampInteger(y, 0, imageData.height - 1, 0);
  const offset = ((sampleY * imageData.width) + sampleX) * 4;
  if (imageData.data[offset + 3] === 0) {
    return 0;
  }

  return luminance(
    imageData.data[offset],
    imageData.data[offset + 1],
    imageData.data[offset + 2]
  ) * (imageData.data[offset + 3] / 255) * 255;
}

function sampleAlphaAt(imageData, x, y) {
  if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
    return 0;
  }

  const offset = ((y * imageData.width) + x) * 4;
  return imageData.data[offset + 3];
}

function clampByte(value) {
  return clampInteger(value, 0, 255, 0);
}

function rgbToHsl(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const delta = maximum - minimum;
  let hue = 0;
  let saturation = 0;
  const lightness = (maximum + minimum) * 0.5;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs((2 * lightness) - 1));

    if (maximum === r) {
      hue = (((g - b) / delta) % 6) / 6;
    } else if (maximum === g) {
      hue = (((b - r) / delta) + 2) / 6;
    } else {
      hue = (((r - g) / delta) + 4) / 6;
    }
  }

  if (hue < 0) {
    hue += 1;
  }

  return {
    h: hue,
    s: Number.isFinite(saturation) ? saturation : 0,
    l: lightness,
  };
}

function hslToRgb(hue, saturation, lightness) {
  if (saturation === 0) {
    const value = clampByte(lightness * 255);
    return [value, value, value];
  }

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - (lightness * saturation);
  const p = (2 * lightness) - q;

  return [
    clampByte(hueToRgb(p, q, hue + (1 / 3)) * 255),
    clampByte(hueToRgb(p, q, hue) * 255),
    clampByte(hueToRgb(p, q, hue - (1 / 3)) * 255),
  ];
}

function hueToRgb(p, q, t) {
  let next = t;
  if (next < 0) {
    next += 1;
  }
  if (next > 1) {
    next -= 1;
  }
  if (next < (1 / 6)) {
    return p + ((q - p) * 6 * next);
  }
  if (next < 0.5) {
    return q;
  }
  if (next < (2 / 3)) {
    return p + ((q - p) * ((2 / 3) - next) * 6);
  }
  return p;
}

function blendCircularHue(from, to, amount) {
  const delta = ((((to - from) + 0.5) % 1) + 1) % 1 - 0.5;
  return (from + (delta * amount) + 1) % 1;
}

function diffCuts(cuts) {
  if (!Array.isArray(cuts) || cuts.length < 2) {
    return [1];
  }

  const diffs = [];
  for (let index = 1; index < cuts.length; index += 1) {
    diffs.push(Math.max(1, cuts[index] - cuts[index - 1]));
  }
  return diffs;
}

function meanNumber(values) {
  if (!values.length) {
    return 0;
  }

  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total / values.length;
}

function standardDeviation(values) {
  if (values.length <= 1) {
    return 0;
  }

  const average = meanNumber(values);
  let variance = 0;

  for (const value of values) {
    const delta = value - average;
    variance += delta * delta;
  }

  return Math.sqrt(variance / values.length);
}

function coefficientOfVariation(values) {
  const average = meanNumber(values);
  if (average <= 0) {
    return 0;
  }

  return standardDeviation(values) / average;
}

function countDistinctBands(values, threshold) {
  if (!values.length) {
    return 0;
  }

  let count = 1;
  let anchor = values[0];

  for (let index = 1; index < values.length; index += 1) {
    if ((values[index] - anchor) >= threshold) {
      count += 1;
      anchor = values[index];
    }
  }

  return count;
}

function capitalize(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : "";
}

function toHex(value) {
  return clampByte(value).toString(16).padStart(2, "0");
}

function clampScale(value) {
  const min = Number(elements.scaleRange.min);
  const max = Number(elements.scaleRange.max);
  const step = Number(elements.scaleRange.step || SCALE_STEP);
  const safeValue = Number.isFinite(value) ? value : 1;
  const stepped = step > 0 ? Math.round(safeValue / step) * step : safeValue;
  return Math.max(min, Math.min(max, Number(stepped.toFixed(2))));
}

function normalizeExportDimension(value, fallback) {
  const clamped = clampInteger(value, 1, MAX_EXPORT_DIMENSION, fallback);
  if (!elements.powerOfTwo || !elements.powerOfTwo.checked) {
    return clamped;
  }

  return nearestPowerOfTwo(clamped);
}

function nearestPowerOfTwo(value) {
  const safeValue = clampInteger(value, 1, MAX_EXPORT_DIMENSION, 1);
  if (safeValue <= 1) {
    return 1;
  }

  const lowerExponent = Math.floor(Math.log2(safeValue));
  const upperExponent = Math.ceil(Math.log2(safeValue));
  const lower = 2 ** lowerExponent;
  const upper = Math.min(2 ** upperExponent, MAX_EXPORT_DIMENSION);

  if (safeValue - lower <= upper - safeValue) {
    return lower;
  }

  return upper;
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

function formatSize(width, height) {
  return `${width} x ${height}`;
}

function stripExtension(fileName) {
  return fileName.replace(/\.[^/.]+$/, "");
}

function detectExistingPixelArt(imageData) {
  const pixelCount = imageData.width * imageData.height;
  if (pixelCount <= 0) {
    return false;
  }

  if (pixelCount > 262144) {
    return false;
  }

  const { width, height, data } = imageData;
  const distinct = new Set();
  let opaqueCount = 0;
  let semiTransparentCount = 0;
  let repeatedEdges = 0;
  let edgeComparisons = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = ((y * width) + x) * 4;
      const alpha = data[offset + 3];
      if (alpha === 0) {
        continue;
      }

      opaqueCount += 1;
      if (alpha < 250) {
        semiTransparentCount += 1;
      }

      if (distinct.size <= 512) {
        distinct.add(packColorValue(data[offset], data[offset + 1], data[offset + 2], alpha));
      }

      if (x + 1 < width) {
        const rightOffset = offset + 4;
        if (data[rightOffset + 3] > 0) {
          edgeComparisons += 1;
          if (rgbDistance(
            data[offset],
            data[offset + 1],
            data[offset + 2],
            data[rightOffset],
            data[rightOffset + 1],
            data[rightOffset + 2]
          ) <= 10) {
            repeatedEdges += 1;
          }
        }
      }

      if (y + 1 < height) {
        const downOffset = offset + (width * 4);
        if (data[downOffset + 3] > 0) {
          edgeComparisons += 1;
          if (rgbDistance(
            data[offset],
            data[offset + 1],
            data[offset + 2],
            data[downOffset],
            data[downOffset + 1],
            data[downOffset + 2]
          ) <= 10) {
            repeatedEdges += 1;
          }
        }
      }
    }
  }

  if (!opaqueCount) {
    return false;
  }

  const distinctCount = distinct.size;
  const semiRatio = semiTransparentCount / opaqueCount;
  const repeatedRatio = edgeComparisons ? repeatedEdges / edgeComparisons : 0;
  const sizeLooksSprite = width <= 256 && height <= 256;
  const paletteThreshold = Math.max(32, Math.min(256, Math.round(Math.sqrt(pixelCount) * 4)));
  const paletteLooksLimited = distinctCount <= paletteThreshold;

  if (sizeLooksSprite && paletteLooksLimited && semiRatio <= 0.22) {
    return true;
  }

  return (
    width <= 384 &&
    height <= 384 &&
    paletteLooksLimited &&
    repeatedRatio >= 0.32 &&
    semiRatio <= 0.18
  );
}

function estimateSourcePixelScale(imageData) {
  const { width, height, data } = imageData;
  const divisibilityCounts = new Array(9).fill(0);
  let runSampleCount = 0;
  const rowStride = Math.max(1, Math.ceil(height / 96));
  const columnStride = Math.max(1, Math.ceil(width / 96));

  const pushRun = (runLength) => {
    if (runLength <= 0 || runLength > 12) {
      return;
    }

    runSampleCount += 1;
    for (let candidate = 2; candidate <= 8; candidate += 1) {
      if (runLength % candidate === 0) {
        divisibilityCounts[candidate] += 1;
      }
    }
  };

  for (let y = 0; y < height; y += rowStride) {
    let runKey = null;
    let runLength = 0;

    for (let x = 0; x < width; x += 1) {
      const offset = ((y * width) + x) * 4;
      const alpha = data[offset + 3];
      const key = alpha === 0
        ? null
        : packColorValue(data[offset], data[offset + 1], data[offset + 2], alpha);

      if (key !== null && key === runKey) {
        runLength += 1;
        continue;
      }

      pushRun(runLength);
      runKey = key;
      runLength = key === null ? 0 : 1;
    }

    pushRun(runLength);
  }

  for (let x = 0; x < width; x += columnStride) {
    let runKey = null;
    let runLength = 0;

    for (let y = 0; y < height; y += 1) {
      const offset = ((y * width) + x) * 4;
      const alpha = data[offset + 3];
      const key = alpha === 0
        ? null
        : packColorValue(data[offset], data[offset + 1], data[offset + 2], alpha);

      if (key !== null && key === runKey) {
        runLength += 1;
        continue;
      }

      pushRun(runLength);
      runKey = key;
      runLength = key === null ? 0 : 1;
    }

    pushRun(runLength);
  }

  if (runSampleCount < 12) {
    return 1;
  }

  for (let candidate = 8; candidate >= 2; candidate -= 1) {
    const ratio = divisibilityCounts[candidate] / runSampleCount;
    if (ratio >= 0.72) {
      return candidate;
    }
  }

  return 1;
}

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The selected image could not be decoded."));
    image.src = url;
  });
}

function nextFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}
})();

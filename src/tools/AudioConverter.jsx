// src/tools/AudioConverter.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  AlertCircle,
  AudioLines,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileAudio,
  Gauge,
  HardDrive,
  HelpCircle,
  Info,
  Loader2,
  Music,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Audio Converter",
  path: "/audio-converter",
  category: "Audio Tools",
  description:
    "Convert MP3, WAV, AAC, M4A, OGG, and FLAC audio files privately in your browser with format-specific quality controls and instant download.",
  metaTitle:
    "Free Audio Converter – MP3, WAV, AAC, M4A, OGG & FLAC",
  metaDescription:
    "Convert MP3, WAV, AAC, M4A, OGG, and FLAC files online. Choose quality, sample rate, and audio channels, then preview and download privately from your browser.",
};

const SITE_URL = "https://nextonlinetools.com";
const canonicalUrl = `${SITE_URL}/tool${toolData.path}`;

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const LARGE_FILE_WARNING_MB = 50;
const ACCEPTED_EXTENSIONS = ["mp3", "wav", "aac", "m4a", "ogg", "flac"];

// You can self-host these files and set VITE_FFMPEG_CORE_BASE_URL=/ffmpeg.
// For Vite, the official ffmpeg.wasm docs use the ESM build.
const FFMPEG_CORE_BASE_URL =
  import.meta.env?.VITE_FFMPEG_CORE_BASE_URL ||
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

const FORMAT_OPTIONS = [
  {
    id: "mp3",
    label: "MP3",
    description: "Small size and broad compatibility",
    extension: "mp3",
    mime: "audio/mpeg",
  },
  {
    id: "wav",
    label: "WAV",
    description: "Uncompressed audio for editing",
    extension: "wav",
    mime: "audio/wav",
  },
  {
    id: "aac",
    label: "AAC",
    description: "Efficient compressed audio stream",
    extension: "aac",
    mime: "audio/aac",
  },
  {
    id: "m4a",
    label: "M4A",
    description: "Modern AAC audio container",
    extension: "m4a",
    mime: "audio/mp4",
  },
  {
    id: "ogg",
    label: "OGG",
    description: "Open OGG Vorbis audio",
    extension: "ogg",
    mime: "audio/ogg",
  },
  {
    id: "flac",
    label: "FLAC",
    description: "Lossless compressed audio",
    extension: "flac",
    mime: "audio/flac",
  },
];

const QUALITY_OPTIONS = {
  mp3: [
    { value: "128k", label: "128 kbps", note: "Small" },
    { value: "192k", label: "192 kbps", note: "Balanced" },
    { value: "256k", label: "256 kbps", note: "High" },
    { value: "320k", label: "320 kbps", note: "Best" },
  ],
  aac: [
    { value: "96k", label: "96 kbps", note: "Small" },
    { value: "128k", label: "128 kbps", note: "Standard" },
    { value: "192k", label: "192 kbps", note: "Balanced" },
    { value: "256k", label: "256 kbps", note: "High" },
  ],
  m4a: [
    { value: "128k", label: "128 kbps", note: "Standard" },
    { value: "192k", label: "192 kbps", note: "Balanced" },
    { value: "256k", label: "256 kbps", note: "High" },
  ],
  ogg: [
    { value: "3", label: "Small", note: "Quality 3" },
    { value: "5", label: "Balanced", note: "Quality 5" },
    { value: "7", label: "High", note: "Quality 7" },
    { value: "9", label: "Best", note: "Quality 9" },
  ],
  wav: [
    { value: "16", label: "16-bit PCM", note: "Standard" },
    { value: "24", label: "24-bit PCM", note: "High quality" },
  ],
  flac: [
    { value: "0", label: "Fast conversion", note: "Lossless" },
    { value: "5", label: "Balanced", note: "Lossless" },
    { value: "8", label: "Smaller file", note: "Lossless" },
  ],
};

const DEFAULT_QUALITY = {
  mp3: "192k",
  wav: "16",
  aac: "192k",
  m4a: "192k",
  ogg: "5",
  flac: "5",
};

const SAMPLE_RATE_OPTIONS = [
  { value: "original", label: "Keep original" },
  { value: "44100", label: "44.1 kHz" },
  { value: "48000", label: "48 kHz" },
  { value: "96000", label: "96 kHz" },
];

const CHANNEL_OPTIONS = [
  { value: "original", label: "Keep original" },
  { value: "1", label: "Mono" },
  { value: "2", label: "Stereo" },
];

const FORMAT_RECOMMENDATIONS = [
  { use: "Music sharing", format: "MP3" },
  { use: "Apple and mobile use", format: "M4A" },
  { use: "Audio editing", format: "WAV" },
  { use: "Lossless storage", format: "FLAC" },
  { use: "Open web audio", format: "OGG" },
  { use: "Efficient raw stream", format: "AAC" },
];

export default function AudioConverter() {
  const fileInputRef = useRef(null);
  const ffmpegRef = useRef(null);
  const ffmpegHelpersRef = useRef(null);
  const inputUrlRef = useRef("");
  const resultUrlRef = useRef("");
  const convertStartedAtRef = useRef(0);
  const mountedRef = useRef(true);

  const [file, setFile] = useState(null);
  const [inputUrl, setInputUrl] = useState("");
  const [metadata, setMetadata] = useState({
    duration: 0,
    sampleRate: null,
    channels: null,
  });

  const [outputFormat, setOutputFormat] = useState("mp3");
  const [qualityByFormat, setQualityByFormat] = useState(DEFAULT_QUALITY);
  const [sampleRate, setSampleRate] = useState("original");
  const [channels, setChannels] = useState("original");
  const [outputName, setOutputName] = useState("converted-audio.mp3");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [formatHelpOpen, setFormatHelpOpen] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [engineState, setEngineState] = useState("idle");
  const [conversionStage, setConversionStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedFormat = useMemo(
    () => FORMAT_OPTIONS.find((item) => item.id === outputFormat),
    [outputFormat]
  );

  const qualityOptions = QUALITY_OPTIONS[outputFormat] || [];
  const selectedQuality = qualityByFormat[outputFormat];
  const busy = engineState === "loading" || engineState === "converting";

  const inputExtension = useMemo(
    () => getFileExtension(file?.name || ""),
    [file]
  );

  const estimatedSaving = useMemo(() => {
    if (!file?.size || !result?.size) return null;
    return Math.round((1 - result.size / file.size) * 100);
  }, [file, result]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      revokeInputUrl();
      revokeResultUrl();
      try {
        ffmpegRef.current?.terminate?.();
      } catch {
        // Ignore worker cleanup errors during unmount.
      }
    };
  }, []);

  useEffect(() => {
    if (engineState !== "converting") return undefined;

    const timer = window.setInterval(() => {
      setElapsedSeconds(
        Math.max(0, Math.round((performance.now() - convertStartedAtRef.current) / 1000))
      );
    }, 500);

    return () => window.clearInterval(timer);
  }, [engineState]);

  useEffect(() => {
    const nextBaseName = file ? getFileBaseName(file.name) : "converted-audio";
    setOutputName(`${nextBaseName}.${selectedFormat.extension}`);
    clearResult();
  }, [outputFormat, selectedFormat.extension]);

  const seoJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Audio Converter",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    url: canonicalUrl,
    description: toolData.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Convert MP3, WAV, AAC, M4A, OGG, and FLAC",
      "Format-specific audio quality controls",
      "Audio preview before and after conversion",
      "Browser-only processing",
      "No backend or account required",
    ],
  };

  function revokeInputUrl() {
    if (inputUrlRef.current) {
      URL.revokeObjectURL(inputUrlRef.current);
      inputUrlRef.current = "";
    }
  }

  function revokeResultUrl() {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = "";
    }
  }

  function resetFileInput() {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function clearResult() {
    revokeResultUrl();
    setResult(null);
    setProgress(0);
    setElapsedSeconds(0);
    if (engineState !== "loading" && engineState !== "converting") {
      setConversionStage("");
    }
  }

  async function handleFile(fileValue) {
    clearFeedback();
    clearResult();

    const validationError = validateAudioFile(fileValue);
    if (validationError) {
      setError(validationError);
      resetFileInput();
      return;
    }

    revokeInputUrl();

    const nextUrl = URL.createObjectURL(fileValue);
    inputUrlRef.current = nextUrl;
    setInputUrl(nextUrl);
    setFile(fileValue);

    const baseName = getFileBaseName(fileValue.name);
    setOutputName(`${baseName}.${selectedFormat.extension}`);
    setMetadata({ duration: 0, sampleRate: null, channels: null });

    try {
      const nextMetadata = await readAudioMetadata(fileValue, nextUrl);
      if (mountedRef.current) setMetadata(nextMetadata);
    } catch {
      // Audio preview may still work even if decoding metadata fails.
    }

    if (fileValue.size > LARGE_FILE_WARNING_MB * 1024 * 1024) {
      setSuccess(
        `Large file loaded (${formatBytes(fileValue.size)}). Browser conversion may take longer on this device.`
      );
    } else {
      setSuccess("Audio loaded. Choose the output format and convert.");
    }

    resetFileInput();
  }

  function handleInputChange(event) {
    const nextFile = event.target.files?.[0];
    if (nextFile) handleFile(nextFile);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    const nextFile = event.dataTransfer.files?.[0];
    if (nextFile) handleFile(nextFile);
  }

  function selectOutputFormat(formatId) {
    setOutputFormat(formatId);
    clearFeedback();
  }

  function updateQuality(nextValue) {
    setQualityByFormat((current) => ({
      ...current,
      [outputFormat]: nextValue,
    }));
    clearResult();
    clearFeedback();
  }

  async function loadEngine() {
    if (ffmpegRef.current?.loaded) return ffmpegRef.current;

    setEngineState("loading");
    setConversionStage("Preparing audio converter");
    setProgress(5);

    try {
      const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);

      const ffmpeg = new FFmpeg();

      ffmpeg.on("log", ({ message }) => {
        if (!mountedRef.current) return;

        if (/configuration:/i.test(message)) {
          setConversionStage("Loading audio codecs");
        } else if (/Input #0/i.test(message)) {
          setConversionStage("Reading source audio");
        } else if (/Output #0/i.test(message)) {
          setConversionStage(`Encoding ${selectedFormat.label}`);
        } else if (/size=.*time=/i.test(message)) {
          setConversionStage(`Encoding ${selectedFormat.label}`);
        } else if (/audio:/i.test(message)) {
          setConversionStage("Finalizing converted file");
        }
      });

      ffmpeg.on("progress", ({ progress: nextProgress }) => {
        if (!mountedRef.current || !Number.isFinite(nextProgress)) return;
        const percent = Math.min(96, Math.max(12, Math.round(nextProgress * 100)));
        setProgress(percent);
      });

      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`,
          "text/javascript"
        ),
        wasmURL: await toBlobURL(
          `${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`,
          "application/wasm"
        ),
      });

      ffmpegRef.current = ffmpeg;
      ffmpegHelpersRef.current = { fetchFile };
      setEngineState("ready");
      setConversionStage("Converter ready");
      setProgress(10);
      return ffmpeg;
    } catch (loadError) {
      ffmpegRef.current = null;
      ffmpegHelpersRef.current = null;
      setEngineState("idle");
      setProgress(0);
      setConversionStage("");
      throw loadError;
    }
  }

  async function convertAudio() {
    clearFeedback();
    clearResult();

    if (!file) {
      setError("Upload an audio file first.");
      return;
    }

    if (!selectedFormat) {
      setError("Choose an output format.");
      return;
    }

    setElapsedSeconds(0);
    convertStartedAtRef.current = performance.now();

    const virtualInputName = `input-${Date.now()}.${inputExtension || "audio"}`;
    const virtualOutputName = `output-${Date.now()}.${selectedFormat.extension}`;

    try {
      const ffmpeg = await loadEngine();
      const { fetchFile } = ffmpegHelpersRef.current || {};

      if (!fetchFile) throw new Error("Audio file loader is unavailable.");

      setEngineState("converting");
      setConversionStage("Preparing source audio");
      setProgress((current) => Math.max(current, 10));

      await ffmpeg.writeFile(virtualInputName, await fetchFile(file));

      setConversionStage(`Encoding ${selectedFormat.label}`);
      setProgress((current) => Math.max(current, 15));

      const command = buildFfmpegCommand({
        inputName: virtualInputName,
        outputName: virtualOutputName,
        outputFormat,
        quality: selectedQuality,
        sampleRate,
        channels,
      });

      const exitCode = await ffmpeg.exec(command);
      if (exitCode !== 0) {
        throw new Error(`FFmpeg exited with code ${exitCode}.`);
      }

      setConversionStage("Finalizing converted file");
      setProgress(97);

      const outputData = await ffmpeg.readFile(virtualOutputName);
      const arrayBuffer = getArrayBuffer(outputData);
      const outputBlob = new Blob([arrayBuffer], {
        type: selectedFormat.mime,
      });

      if (!outputBlob.size) {
        throw new Error("The converted audio file is empty.");
      }

      revokeResultUrl();
      const nextResultUrl = URL.createObjectURL(outputBlob);
      resultUrlRef.current = nextResultUrl;

      const processingTime = Math.max(
        0,
        Math.round((performance.now() - convertStartedAtRef.current) / 1000)
      );

      setResult({
        url: nextResultUrl,
        blob: outputBlob,
        size: outputBlob.size,
        format: selectedFormat.label,
        mime: selectedFormat.mime,
        name: ensureFileExtension(outputName, selectedFormat.extension),
        processingTime,
      });

      setProgress(100);
      setConversionStage("Conversion complete");
      setEngineState("ready");
      setSuccess(`${selectedFormat.label} conversion completed successfully.`);
    } catch (conversionError) {
      setEngineState("idle");
      setProgress(0);
      setConversionStage("");
      setError(getFriendlyConversionError(conversionError));
    } finally {
      await removeVirtualFile(virtualInputName);
      await removeVirtualFile(virtualOutputName);
    }
  }

  async function removeVirtualFile(name) {
    const ffmpeg = ffmpegRef.current;
    if (!ffmpeg || !name) return;

    try {
      await ffmpeg.deleteFile(name);
    } catch {
      // The file may not exist if conversion failed early.
    }
  }

  function cancelConversion() {
    if (engineState !== "loading" && engineState !== "converting") return;

    try {
      ffmpegRef.current?.terminate?.();
    } catch {
      // Ignore worker termination errors.
    }

    ffmpegRef.current = null;
    ffmpegHelpersRef.current = null;
    setEngineState("idle");
    setProgress(0);
    setElapsedSeconds(0);
    setConversionStage("");
    setSuccess("");
    setError("Conversion cancelled. The converter will reload when you try again.");
  }

  function downloadResult() {
    if (!result?.blob) {
      setError("Convert an audio file first.");
      return;
    }

    const link = document.createElement("a");
    const temporaryUrl = URL.createObjectURL(result.blob);

    link.href = temporaryUrl;
    link.download = ensureFileExtension(
      outputName || result.name,
      selectedFormat.extension
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(temporaryUrl), 1000);
  }

  function removeAudio() {
    if (busy) return;
    revokeInputUrl();
    clearResult();
    setFile(null);
    setInputUrl("");
    setMetadata({ duration: 0, sampleRate: null, channels: null });
    setOutputName(`converted-audio.${selectedFormat.extension}`);
    setError("");
    setSuccess("");
    resetFileInput();
  }

  function resetTool() {
    if (busy) cancelConversion();

    revokeInputUrl();
    revokeResultUrl();
    setFile(null);
    setInputUrl("");
    setMetadata({ duration: 0, sampleRate: null, channels: null });
    setOutputFormat("mp3");
    setQualityByFormat(DEFAULT_QUALITY);
    setSampleRate("original");
    setChannels("original");
    setOutputName("converted-audio.mp3");
    setAdvancedOpen(false);
    setFormatHelpOpen(false);
    setIsDragging(false);
    setEngineState(ffmpegRef.current?.loaded ? "ready" : "idle");
    setConversionStage("");
    setProgress(0);
    setElapsedSeconds(0);
    setResult(null);
    setError("");
    setSuccess("");
    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-8">
      <Helmet>
        <title>{toolData.metaTitle}</title>
        <meta name="description" content={toolData.metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={toolData.metaTitle} />
        <meta property="og:description" content={toolData.metaDescription} />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={toolData.metaTitle} />
        <meta name="twitter:description" content={toolData.metaDescription} />

        <script type="application/ld+json">{JSON.stringify(seoJsonLd)}</script>
      </Helmet>

      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.aac,.m4a,.ogg,.flac,audio/mpeg,audio/wav,audio/x-wav,audio/aac,audio/mp4,audio/ogg,audio/flac"
        onChange={handleInputChange}
        className="hidden"
      />

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <AudioLines size={29} className="text-[var(--primary)]" />
        </div>

        <p className="text-xs uppercase tracking-[0.22em] text-[var(--primary)] font-bold mb-2">
          Private Browser Conversion
        </p>

        <h1 className="text-3xl font-bold mb-3">Audio Converter</h1>

        <p className="text-[var(--text-secondary)] max-w-3xl">
          Convert MP3, WAV, AAC, M4A, OGG, and FLAC files directly in your
          browser. Choose quality, sample rate, and channels, preview the result,
          and download without uploading your audio to a conversion server.
        </p>
      </section>

      <section className="card p-4 sm:p-6 lg:p-8">
        <div className="grid lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.82fr)] gap-6 items-start">
          <div className="min-w-0 flex flex-col gap-5">
            {!file ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                className={`min-h-[330px] rounded-2xl border-2 border-dashed p-8 text-center flex flex-col items-center justify-center transition duration-200 ${
                  isDragging
                    ? "border-[var(--primary)] bg-[#f4edff] scale-[1.01]"
                    : "border-[var(--border)] bg-white hover:border-[var(--primary)] hover:bg-[#faf8ff]"
                }`}
              >
                <div className="h-16 w-16 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-5">
                  <Upload size={31} className="text-[var(--primary)]" />
                </div>

                <h2 className="text-xl font-bold">
                  {isDragging ? "Drop audio to convert" : "Upload or drop audio"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] max-w-md">
                  MP3, WAV, AAC, M4A, OGG, or FLAC. Maximum file size:
                  <strong> {MAX_FILE_SIZE_MB} MB</strong>.
                </p>

                <span className="btn-primary mt-5 inline-flex items-center justify-center gap-2">
                  <FileAudio size={18} />
                  Choose Audio File
                </span>
              </button>
            ) : (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-[#f4edff] flex items-center justify-center">
                    <Music size={23} className="text-[var(--primary)]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {inputExtension.toUpperCase()} · {formatBytes(file.size)}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={busy}
                      className="h-9 w-9 rounded-xl border border-[var(--border)] inline-flex items-center justify-center hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-40"
                      title="Replace audio"
                    >
                      <Upload size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={removeAudio}
                      disabled={busy}
                      className="h-9 w-9 rounded-xl border border-[var(--border)] inline-flex items-center justify-center hover:border-red-200 hover:text-red-600 disabled:opacity-40"
                      title="Remove audio"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                  <MetadataCard
                    icon={Clock}
                    label="Duration"
                    value={metadata.duration ? formatDuration(metadata.duration) : "Unknown"}
                  />
                  <MetadataCard
                    icon={Gauge}
                    label="Sample rate"
                    value={metadata.sampleRate ? formatSampleRate(metadata.sampleRate) : "Unknown"}
                  />
                  <MetadataCard
                    icon={Volume2}
                    label="Channels"
                    value={formatChannels(metadata.channels)}
                  />
                  <MetadataCard
                    icon={HardDrive}
                    label="File size"
                    value={formatBytes(file.size)}
                  />
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Output Format</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Select the format you need.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFormatHelpOpen((current) => !current)}
                  className="text-xs font-bold text-[var(--primary)] inline-flex items-center gap-1.5 hover:underline"
                >
                  <HelpCircle size={15} />
                  Which format?
                </button>
              </div>

              {formatHelpOpen && (
                <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold text-blue-900">Quick recommendation</p>
                      <p className="text-xs text-blue-800 mt-1">
                        Choose based on what you plan to do with the audio.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormatHelpOpen(false)}
                      className="h-8 w-8 rounded-lg inline-flex items-center justify-center hover:bg-blue-100 text-blue-800"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2">
                    {FORMAT_RECOMMENDATIONS.map((item) => (
                      <div
                        key={item.use}
                        className="rounded-xl bg-white/80 px-3 py-2 text-xs flex items-center justify-between gap-3"
                      >
                        <span className="text-blue-900">{item.use}</span>
                        <strong className="text-blue-700">{item.format}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FORMAT_OPTIONS.map((format) => (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() => selectOutputFormat(format.id)}
                    disabled={busy}
                    className={`rounded-2xl border p-4 text-left transition duration-200 disabled:opacity-50 ${
                      outputFormat === format.id
                        ? "border-[var(--primary)] bg-[#f4edff] shadow-sm -translate-y-0.5"
                        : "border-[var(--border)] bg-white hover:border-[var(--primary)] hover:bg-[#faf8ff] hover:-translate-y-0.5"
                    }`}
                  >
                    <span className="text-lg font-black text-[var(--primary)]">
                      {format.label}
                    </span>
                    <span className="block text-xs leading-5 text-[var(--text-secondary)] mt-2">
                      {format.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-bold">Conversion Settings</h2>
              </div>

              <div>
                <label className="text-sm font-bold block mb-3">
                  {outputFormat === "flac" ? "Compression" : outputFormat === "wav" ? "Audio depth" : "Quality"}
                </label>

                <div className={`grid gap-2 ${qualityOptions.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
                  {qualityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateQuality(option.value)}
                      disabled={busy}
                      className={`rounded-xl border px-3 py-3 text-center transition disabled:opacity-50 ${
                        selectedQuality === option.value
                          ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                          : "border-[var(--border)] bg-white hover:border-[var(--primary)]"
                      }`}
                    >
                      <span className="block text-sm font-bold">{option.label}</span>
                      <span className="block text-[10px] mt-1 opacity-75">{option.note}</span>
                    </button>
                  ))}
                </div>

                {outputFormat === "flac" && (
                  <p className="text-xs text-[var(--text-secondary)] mt-3">
                    All FLAC options remain lossless. This only changes compression effort and conversion speed.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setAdvancedOpen((current) => !current)}
                className="mt-5 w-full rounded-xl border border-[var(--border)] bg-[#fafafa] px-4 py-3 flex items-center justify-between gap-3 text-sm font-bold hover:border-[var(--primary)]"
              >
                <span>Advanced Settings</span>
                {advancedOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>

              {advancedOpen && (
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <SelectField
                    label="Sample rate"
                    value={sampleRate}
                    onChange={(value) => {
                      setSampleRate(value);
                      clearResult();
                    }}
                    options={SAMPLE_RATE_OPTIONS}
                    disabled={busy}
                  />

                  <SelectField
                    label="Audio channels"
                    value={channels}
                    onChange={(value) => {
                      setChannels(value);
                      clearResult();
                    }}
                    options={CHANNEL_OPTIONS}
                    disabled={busy}
                  />
                </div>
              )}

              <div className="mt-4">
                <label className="text-sm font-bold block mb-2">Output filename</label>
                <div className="flex rounded-xl border border-[var(--border)] bg-white overflow-hidden focus-within:border-[var(--primary)] focus-within:ring-4 focus-within:ring-[#f4edff]">
                  <input
                    type="text"
                    value={stripFileExtension(outputName)}
                    onChange={(event) => {
                      const clean = sanitizeFileName(event.target.value);
                      setOutputName(`${clean || "converted-audio"}.${selectedFormat.extension}`);
                    }}
                    disabled={busy}
                    className="min-w-0 flex-1 px-4 py-3 outline-none disabled:bg-gray-50"
                  />
                  <span className="px-4 flex items-center bg-gray-50 border-l border-[var(--border)] text-sm font-bold text-[var(--text-secondary)]">
                    .{selectedFormat.extension}
                  </span>
                </div>
              </div>

              {busy ? (
                <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Loader2 size={20} className="shrink-0 animate-spin text-[var(--primary)]" />
                      <div className="min-w-0">
                        <p className="font-bold truncate">{conversionStage || "Processing audio"}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {elapsedSeconds}s elapsed · Keep this tab open
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-[var(--primary)]">{progress}%</span>
                  </div>

                  <div className="h-2 rounded-full bg-white overflow-hidden border border-[var(--border)]">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300"
                      style={{ width: `${Math.max(3, progress)}%` }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={cancelConversion}
                    className="mt-4 btn-secondary w-full inline-flex items-center justify-center gap-2"
                  >
                    <Square size={15} />
                    Cancel Conversion
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={convertAudio}
                  disabled={!file}
                  className="btn-primary mt-5 w-full min-h-12 inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Sparkles size={18} />
                  Convert to {selectedFormat.label}
                </button>
              )}
            </div>

            {(error || success) && (
              <div
                className={`rounded-xl border p-4 text-sm flex items-start gap-3 ${
                  error
                    ? "border-red-100 bg-red-50 text-red-700"
                    : "border-green-100 bg-green-50 text-green-700"
                }`}
              >
                {error ? (
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                )}
                <p>{error || success}</p>
              </div>
            )}
          </div>

          <div className="min-w-0 lg:sticky lg:top-5 flex flex-col gap-5">
            <AudioPreviewCard
              title="Original Audio"
              subtitle={file ? `${inputExtension.toUpperCase()} · ${formatBytes(file.size)}` : "Upload an audio file to preview it"}
              url={inputUrl}
              empty={!file}
            />

            {result ? (
              <div className="rounded-2xl border border-green-200 bg-white overflow-hidden shadow-sm">
                <div className="bg-green-50 border-b border-green-100 p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-green-600 text-white flex items-center justify-center">
                      <CheckCircle2 size={23} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-green-950">Conversion Complete</h2>
                      <p className="text-xs text-green-800 mt-1">
                        Your {result.format} file is ready to preview and download.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <audio controls src={result.url} className="w-full" preload="metadata">
                    Your browser does not support audio preview.
                  </audio>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <ResultMetric label="Original" value={formatBytes(file.size)} />
                    <ResultMetric label="Converted" value={formatBytes(result.size)} />
                    <ResultMetric
                      label="Size change"
                      value={
                        estimatedSaving === null
                          ? "—"
                          : estimatedSaving >= 0
                            ? `${estimatedSaving}% smaller`
                            : `${Math.abs(estimatedSaving)}% larger`
                      }
                    />
                    <ResultMetric label="Time" value={`${result.processingTime}s`} />
                  </div>

                  <button
                    type="button"
                    onClick={downloadResult}
                    className="btn-primary w-full mt-5 inline-flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Download {selectedFormat.label}
                  </button>

                  <button
                    type="button"
                    onClick={clearResult}
                    className="btn-secondary w-full mt-3 inline-flex items-center justify-center gap-2"
                  >
                    <RotateCcw size={17} />
                    Change Settings and Convert Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-gray-50 p-6 min-h-[270px] flex items-center justify-center text-center">
                <div>
                  <Download size={50} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="font-bold">Converted Audio</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-sm">
                    Your converted audio player, file size comparison, and download button will appear here.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="mt-0.5 shrink-0 text-green-700" />
                <div>
                  <p className="text-sm font-bold text-green-900">Your audio stays private</p>
                  <p className="text-xs leading-5 text-green-800 mt-1">
                    Audio processing happens in your browser. The selected audio file is not sent to a conversion server or stored by this tool.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={resetTool}
              className="btn-secondary w-full inline-flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Reset Tool
            </button>
          </div>
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Info size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">Convert Audio Files Online</h2>
        </div>

        <div className="space-y-4 leading-7 text-[var(--text-secondary)]">
          <p>
            Upload an audio file, choose MP3, WAV, AAC, M4A, OGG, or FLAC, select the quality you need, and start the conversion. The converted file can be played before downloading.
          </p>
          <p>
            MP3 is useful for broad compatibility, M4A and AAC provide efficient compression, WAV is suited to editing, OGG is an open format, and FLAC preserves audio without lossy compression.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <InfoCard
            title="Six popular formats"
            text="Convert between MP3, WAV, AAC, M4A, OGG Vorbis, and FLAC."
          />
          <InfoCard
            title="Smart quality controls"
            text="The available options automatically change for the selected output format."
          />
          <InfoCard
            title="No backend required"
            text="The conversion engine runs through WebAssembly inside the browser."
          />
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-5">Audio Converter FAQ</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <FaqItem
            question="Is my audio uploaded?"
            answer="No. The component writes the selected file into an in-browser virtual filesystem and creates the converted download locally."
          />
          <FaqItem
            question="Why can large audio files take longer?"
            answer="Conversion uses your device's processor and memory. Large WAV and FLAC files can require more time and browser memory than small compressed files."
          />
          <FaqItem
            question="Does FLAC quality change?"
            answer="No. FLAC remains lossless. Its setting controls compression effort and output size, not lossy sound quality."
          />
          <FaqItem
            question="Why might audio preview be unavailable?"
            answer="Some browsers cannot play every AAC or FLAC variation directly. Conversion can still work even when the native browser audio player cannot preview the source."
          />
        </div>
      </section>

      <SuggestedTools currentToolId="audio-converter" />
    </div>
  );
}

function AudioPreviewCard({ title, subtitle, url, empty }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileAudio size={20} className="text-[var(--primary)]" />
        <div className="min-w-0">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">{subtitle}</p>
        </div>
      </div>

      {empty ? (
        <div className="min-h-[180px] rounded-xl border border-dashed border-[var(--border)] bg-gray-50 flex items-center justify-center text-center p-6">
          <div>
            <AudioLines size={44} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">No audio selected yet.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[#fafafa] p-4">
          <audio controls src={url} className="w-full" preload="metadata">
            Your browser does not support audio preview.
          </audio>
        </div>
      )}
    </div>
  );
}

function MetadataCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[#fafafa] p-3 min-w-0">
      <Icon size={15} className="text-[var(--primary)] mb-2" />
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
      <p className="text-xs font-bold mt-1 truncate" title={value}>{value}</p>
    </div>
  );
}

function ResultMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[#fafafa] p-3">
      <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">{label}</p>
      <p className="text-sm font-bold mt-1">{value}</p>
    </div>
  );
}

function SelectField({ label, value, onChange, options, disabled }) {
  return (
    <label>
      <span className="text-sm font-bold block mb-2">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 outline-none focus:border-[var(--primary)] disabled:bg-gray-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <h3 className="font-bold">{title}</h3>
      <p className="text-sm leading-6 text-[var(--text-secondary)] mt-2">{text}</p>
    </div>
  );
}

function FaqItem({ question, answer }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <h3 className="font-bold">{question}</h3>
      <p className="text-sm leading-6 text-[var(--text-secondary)] mt-2">{answer}</p>
    </div>
  );
}

function buildFfmpegCommand({
  inputName,
  outputName,
  outputFormat,
  quality,
  sampleRate,
  channels,
}) {
  const args = ["-hide_banner", "-y", "-i", inputName, "-vn"];

  if (sampleRate !== "original") {
    args.push("-ar", String(sampleRate));
  }

  if (channels !== "original") {
    args.push("-ac", String(channels));
  }

  if (outputFormat === "mp3") {
    args.push("-c:a", "libmp3lame", "-b:a", quality || "192k");
  }

  if (outputFormat === "wav") {
    args.push("-c:a", quality === "24" ? "pcm_s24le" : "pcm_s16le");
  }

  if (outputFormat === "aac") {
    args.push("-c:a", "aac", "-b:a", quality || "192k", "-f", "adts");
  }

  if (outputFormat === "m4a") {
    args.push(
      "-c:a",
      "aac",
      "-b:a",
      quality || "192k",
      "-movflags",
      "+faststart"
    );
  }

  if (outputFormat === "ogg") {
    args.push("-c:a", "libvorbis", "-q:a", quality || "5");
  }

  if (outputFormat === "flac") {
    args.push("-c:a", "flac", "-compression_level", quality || "5");
  }

  args.push(outputName);
  return args;
}

function validateAudioFile(file) {
  if (!file) return "Choose an audio file.";

  const extension = getFileExtension(file.name);
  const accepted = ACCEPTED_EXTENSIONS.includes(extension);

  if (!accepted) {
    return "Unsupported file. Upload MP3, WAV, AAC, M4A, OGG, or FLAC audio.";
  }

  if (!file.size) return "This audio file is empty.";

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Audio must be ${MAX_FILE_SIZE_MB} MB or smaller for browser conversion.`;
  }

  return "";
}

async function readAudioMetadata(file, objectUrl) {
  const fallbackDuration = await getAudioElementDuration(objectUrl).catch(() => 0);

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return {
        duration: fallbackDuration,
        sampleRate: null,
        channels: null,
      };
    }

    const context = new AudioContextClass();

    try {
      const buffer = await file.arrayBuffer();
      const decoded = await context.decodeAudioData(buffer.slice(0));

      return {
        duration: decoded.duration || fallbackDuration,
        sampleRate: decoded.sampleRate || null,
        channels: decoded.numberOfChannels || null,
      };
    } finally {
      await context.close().catch(() => {});
    }
  } catch {
    return {
      duration: fallbackDuration,
      sampleRate: null,
      channels: null,
    };
  }
}

function getAudioElementDuration(url) {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    const cleanup = () => {
      audio.removeAttribute("src");
      audio.load();
    };

    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      cleanup();
      resolve(duration);
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error("Could not read audio metadata."));
    };
    audio.src = url;
  });
}

function getFriendlyConversionError(error) {
  const message = String(error?.message || error || "");

  if (/memory|out of bounds|allocation/i.test(message)) {
    return "The browser ran out of memory while converting this file. Try a smaller audio file or close other tabs.";
  }

  if (/fetch|network|core|wasm|worker/i.test(message)) {
    return "The browser could not load the audio conversion engine. Check your connection or self-host the FFmpeg core files.";
  }

  if (/encoder|codec|unknown encoder|not found/i.test(message)) {
    return "This browser converter could not use the required audio codec. Check that the standard ffmpeg.wasm core build is installed.";
  }

  if (/cancel|terminate|abort/i.test(message)) {
    return "Conversion was cancelled.";
  }

  return "Could not convert this audio file. It may be damaged, unsupported, or too large for the available browser memory.";
}

function getArrayBuffer(data) {
  if (data instanceof Uint8Array) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  }

  if (data?.buffer instanceof ArrayBuffer) {
    return data.buffer;
  }

  return data;
}

function getFileExtension(name) {
  const match = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "";
}

function getFileBaseName(name) {
  return String(name || "audio")
    .replace(/\.[^.]+$/, "")
    .trim() || "audio";
}

function stripFileExtension(name) {
  return String(name || "").replace(/\.[^.]+$/, "");
}

function ensureFileExtension(name, extension) {
  const cleanBase = sanitizeFileName(stripFileExtension(name)) || "converted-audio";
  return `${cleanBase}.${extension}`;
}

function sanitizeFileName(value) {
  return String(value || "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
    : `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatSampleRate(value) {
  const sampleRate = Number(value);
  if (!sampleRate) return "Unknown";
  return `${(sampleRate / 1000).toFixed(sampleRate % 1000 === 0 ? 0 : 1)} kHz`;
}

function formatChannels(value) {
  if (value === 1) return "Mono";
  if (value === 2) return "Stereo";
  if (Number(value) > 2) return `${value} channels`;
  return "Unknown";
}

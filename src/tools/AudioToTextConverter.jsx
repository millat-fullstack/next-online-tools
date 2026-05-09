import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  Copy,
  Check,
  Mic,
  FileAudio,
  FileText,
  AlertCircle,
  CheckCircle,
  Languages,
  Brain,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Audio to Text Converter",
  path: "/audio-to-text-converter",
  category: "Audio Tools",
  description:
    "Convert audio, voice notes, and speech recordings into text. Upload an audio file and transcribe it online in your browser.",
  metaTitle: "Audio to Text Converter | Speech to Text Online Free",
  metaDescription:
    "Convert audio to text online for free. Upload voice notes, speech recordings, MP3, WAV, M4A, WEBM, or OGG files and get a text transcript.",
};

const LANGUAGE_OPTIONS = [
  { value: "auto", label: "Auto Detect" },
  { value: "english", label: "English" },
  { value: "bengali", label: "Bangla" },
  { value: "hindi", label: "Hindi" },
  { value: "arabic", label: "Arabic" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
];

const MODEL_ID = "Xenova/whisper-tiny";

export default function AudioToTextConverter() {
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const transcriberRef = useRef(null);

  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [transcript, setTranscript] = useState("");

  const [duration, setDuration] = useState(0);
  const [language, setLanguage] = useState("auto");

  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const [modelProgress, setModelProgress] = useState(0);
  const [modelStatus, setModelStatus] = useState("Not loaded");
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const clearTranscript = () => {
    setTranscript("");
    setCopied(false);
  };

  const isValidAudioFile = (selectedFile) => {
    return (
      selectedFile.type.startsWith("audio/") ||
      /\.(mp3|wav|m4a|aac|ogg|opus|webm|flac)$/i.test(selectedFile.name)
    );
  };

  const handleFile = (selectedFile) => {
    clearFeedback();
    clearTranscript();

    if (!selectedFile) return;

    if (!isValidAudioFile(selectedFile)) {
      setError(
        "Please upload a valid audio file such as MP3, WAV, M4A, OGG, OPUS, WEBM, or FLAC."
      );
      return;
    }

    const maxSize = 80 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("File is too large. Please upload an audio file under 80MB.");
      return;
    }

    if (audioUrl) URL.revokeObjectURL(audioUrl);

    const newUrl = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setAudioUrl(newUrl);
    setDuration(0);
    setSuccess("Audio uploaded successfully. Ready to transcribe.");
  };

  const handleInputChange = (e) => {
    handleFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleAudioMetadata = () => {
    const audio = audioRef.current;

    if (!audio) return;

    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
  };

  const getTranscriber = async () => {
    if (transcriberRef.current) {
      return transcriberRef.current;
    }

    setIsLoadingModel(true);
    setModelStatus("Loading AI model...");
    setModelProgress(0);

    try {
      const transformers = await import("@huggingface/transformers");
      const { pipeline, env } = transformers;

      env.allowLocalModels = false;
      env.useBrowserCache = true;

      const transcriber = await pipeline(
        "automatic-speech-recognition",
        MODEL_ID,
        {
          progress_callback: (data) => {
            if (data?.status) {
              setModelStatus(data.status);
            }

            if (typeof data?.progress === "number") {
              setModelProgress(Math.round(data.progress));
            }
          },
        }
      );

      transcriberRef.current = transcriber;
      setModelProgress(100);
      setModelStatus("Model ready");

      return transcriber;
    } catch {
      setModelStatus("Model failed");
      throw new Error("Could not load the speech recognition model.");
    } finally {
      setIsLoadingModel(false);
    }
  };

  const decodeAudioToMono16k = async (selectedFile) => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      throw new Error("Your browser does not support audio decoding.");
    }

    const audioContext = new AudioContextClass();
    const arrayBuffer = await selectedFile.arrayBuffer();

    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const mono = mixToMono(audioBuffer);
      const resampled = resampleAudio(
        mono,
        audioBuffer.sampleRate,
        16000
      );

      return resampled;
    } finally {
      await audioContext.close();
    }
  };

  const handleTranscribe = async () => {
    clearFeedback();
    clearTranscript();

    if (!file) {
      setError("Please upload an audio or voice note first.");
      return;
    }

    setIsTranscribing(true);

    try {
      setSuccess("");
      setModelStatus("Preparing audio...");

      const transcriber = await getTranscriber();
      const audioData = await decodeAudioToMono16k(file);

      setModelStatus("Transcribing audio...");

      const options = {
        task: "transcribe",
        chunk_length_s: 30,
        stride_length_s: 5,
      };

      if (language !== "auto") {
        options.language = language;
      }

      const result = await transcriber(audioData, options);

      const text =
        typeof result === "string"
          ? result
          : result?.text || result?.chunks?.map((item) => item.text).join(" ") || "";

      const cleanedText = cleanTranscript(text);

      if (!cleanedText) {
        setError(
          "No speech text was detected. Try a clearer audio file or a shorter voice note."
        );
        return;
      }

      setTranscript(cleanedText);
      setModelStatus("Transcription complete");
      setSuccess("Audio transcribed successfully.");
    } catch (err) {
      setError(
        "Could not transcribe this audio. Try MP3, WAV, M4A, WEBM, or a shorter/clearer voice note."
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopy = async () => {
    if (!transcript) return;

    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setError("");
      setSuccess("Transcript copied successfully.");

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setError("Copy failed. Please copy the transcript manually.");
    }
  };

  const handleDownload = () => {
    if (!transcript) {
      setError("Please transcribe audio first.");
      return;
    }

    const content = `Audio to Text Transcript

File: ${file?.name || "audio"}
Duration: ${formatTime(duration)}
Language: ${LANGUAGE_OPTIONS.find((item) => item.value === language)?.label || "Auto Detect"}

Transcript:
${transcript}`;

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "audio-transcript.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    setFile(null);
    setAudioUrl("");
    setTranscript("");
    setDuration(0);
    setLanguage("auto");
    setIsDragging(false);
    setIsTranscribing(false);
    setCopied(false);
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const stats = useMemo(() => {
    const words = transcript.trim()
      ? transcript.trim().split(/\s+/).filter(Boolean)
      : [];

    const textBytes = new Blob([transcript]).size;

    const reduction =
      file && transcript
        ? Math.max(0, Math.round(((file.size - textBytes) / file.size) * 100))
        : 0;

    return {
      words: words.length,
      characters: transcript.length,
      textBytes,
      reduction,
    };
  }, [transcript, file]);

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Mic size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Audio to Text Converter</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload voice notes, speech recordings, or audio files and convert them
          into editable text using browser-based AI speech recognition.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* UPLOAD */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
                isDragging
                  ? "border-[var(--primary)] bg-[var(--primary)]/5"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-white border shadow-sm flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-[var(--primary)]" />
              </div>

              <h2 className="text-xl font-semibold mb-2">
                Upload Audio or Voice Note
              </h2>

              <p className="text-sm text-[var(--text-secondary)] mb-5">
                Supports common audio files like MP3, WAV, M4A, OGG, OPUS, WEBM,
                and FLAC depending on browser support.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.opus,.webm,.flac"
                onChange={handleInputChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Upload size={18} />
                Choose Audio File
              </button>

              {file && (
                <p className="mt-4 text-sm font-medium text-[var(--text-primary)]">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {/* AUDIO PREVIEW */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileAudio size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Audio Preview</h3>
              </div>

              {audioUrl ? (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  controls
                  onLoadedMetadata={handleAudioMetadata}
                  className="w-full"
                />
              ) : (
                <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                  <FileAudio size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-[var(--text-secondary)]">
                    Audio preview will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* SETTINGS */}
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Languages size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Transcription Settings</h3>
              </div>

              <label className="block text-sm font-semibold mb-2">
                Spoken Language
              </label>

              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  clearTranscript();
                  clearFeedback();
                }}
                className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
              >
                {LANGUAGE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <div className="mt-4 bg-white border border-[var(--border)] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={18} className="text-[var(--primary)]" />
                  <p className="font-semibold">AI Model Status</p>
                </div>

                <p className="text-sm text-[var(--text-secondary)]">
                  {modelStatus}
                </p>

                {(isLoadingModel || modelProgress > 0) && (
                  <div className="mt-3">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-[var(--text-secondary)]">
                        Model loading
                      </span>
                      <span className="text-xs font-semibold">
                        {modelProgress}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--primary)] transition-all"
                        style={{ width: `${modelProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleTranscribe}
                disabled={!file || isTranscribing || isLoadingModel}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !file || isTranscribing || isLoadingModel
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <Zap size={18} />
                {isTranscribing || isLoadingModel
                  ? "Transcribing..."
                  : "Transcribe Audio"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>

            {/* FEEDBACK */}
            {error && (
              <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-sm text-yellow-800">
                This tool uses browser-based AI speech recognition. The model may
                download on first use, so first loading can take time. Short,
                clear voice notes work best.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-semibold">Transcript Output</h2>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Your converted text will appear here.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!transcript}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    transcript
                      ? copied
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-white text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--primary)]/5"
                      : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                  title="Copy transcript"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Transcript will appear here after processing..."
                rows="18"
                className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none bg-gray-50 resize-none"
              />
            </div>

            {/* DOWNLOAD BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!transcript}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !transcript ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied" : "Copy Text"}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!transcript}
                className={`btn-secondary flex-1 inline-flex items-center justify-center gap-2 ${
                  !transcript ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download TXT
              </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Audio Size"
                value={file ? formatBytes(file.size) : "-"}
              />

              <StatCard
                label="Duration"
                value={duration ? formatTime(duration) : "-"}
              />

              <StatCard label="Words" value={stats.words} />

              <StatCard label="Characters" value={stats.characters} />

              <StatCard
                label="Text Size"
                value={transcript ? formatBytes(stats.textBytes) : "-"}
              />

              <StatCard
                label="Output Reduction"
                value={transcript ? `${stats.reduction}%` : "-"}
                green
              />
            </div>

            {!transcript && (
              <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                <Mic size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-[var(--text-secondary)]">
                  Upload audio and click “Transcribe Audio” to convert voice to
                  text.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="audio-to-text-converter" />
    </div>
  );
}

function mixToMono(audioBuffer) {
  const { numberOfChannels, length } = audioBuffer;
  const mono = new Float32Array(length);

  for (let channel = 0; channel < numberOfChannels; channel += 1) {
    const channelData = audioBuffer.getChannelData(channel);

    for (let i = 0; i < length; i += 1) {
      mono[i] += channelData[i] / numberOfChannels;
    }
  }

  return mono;
}

function resampleAudio(audioData, inputSampleRate, outputSampleRate) {
  if (inputSampleRate === outputSampleRate) {
    return audioData;
  }

  const ratio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.floor((i + 1) * ratio);
    let sum = 0;
    let count = 0;

    for (let j = start; j < end && j < audioData.length; j += 1) {
      sum += audioData[j];
      count += 1;
    }

    result[i] = count > 0 ? sum / count : 0;
  }

  return result;
}

function cleanTranscript(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  if (!bytes) return "0 B";

  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes.length - 1
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${sizes[index]}`;
}

function formatTime(seconds) {
  if (!seconds) return "0 sec";

  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (minutes === 0) return `${remainingSeconds} sec`;
  if (remainingSeconds === 0) return `${minutes} min`;

  return `${minutes} min ${remainingSeconds} sec`;
}

function StatCard({ label, value, green = false }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-4 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p
        className={`text-xl font-bold break-all ${
          green ? "text-green-600" : "text-[var(--primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
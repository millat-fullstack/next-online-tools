import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  Zap,
  Music,
  FileAudio,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle,
  Play,
} from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Audio Joiner",
  path: "/audio-joiner",
  category: "Audio Tools",
  description:
    "Join multiple audio files online for free. Upload audio files, arrange the order, merge them, preview, and download as one file.",
  metaTitle: "Audio Joiner | Merge Audio Files Online Free",
  metaDescription:
    "Join audio files online for free. Merge MP3, WAV, M4A, OGG, and WEBM audio files in your browser and download one combined audio file.",
};

export default function AudioJoiner() {
  const fileInputRef = useRef(null);

  const [audioFiles, setAudioFiles] = useState([]);
  const [joinedUrl, setJoinedUrl] = useState("");
  const [joinedBlob, setJoinedBlob] = useState(null);
  const [joinedDuration, setJoinedDuration] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearOutput = () => {
    if (joinedUrl) {
      URL.revokeObjectURL(joinedUrl);
    }

    setJoinedUrl("");
    setJoinedBlob(null);
    setJoinedDuration(0);
  };

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const isValidAudioFile = (file) => {
    return (
      file.type.startsWith("audio/") ||
      /\.(mp3|wav|m4a|aac|ogg|webm|flac)$/i.test(file.name)
    );
  };

  const getAudioDuration = (file) => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const audio = document.createElement("audio");

      audio.preload = "metadata";

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(0);
      };

      audio.src = url;
    });
  };

  const handleFiles = async (files) => {
    clearFeedback();
    clearOutput();

    const selectedFiles = Array.from(files || []);

    if (!selectedFiles.length) return;

    const validFiles = selectedFiles.filter(isValidAudioFile);

    if (!validFiles.length) {
      setError("Please upload valid audio files such as MP3, WAV, M4A, OGG, or WEBM.");
      return;
    }

    const maxFileSize = 80 * 1024 * 1024;
    const tooLarge = validFiles.find((file) => file.size > maxFileSize);

    if (tooLarge) {
      setError("One or more files are too large. Please use files under 80MB each.");
      return;
    }

    const items = await Promise.all(
      validFiles.map(async (file, index) => {
        const duration = await getAudioDuration(file);

        return {
          id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type || "Audio file",
          duration,
        };
      })
    );

    setAudioFiles((prev) => [...prev, ...items]);
    setSuccess(`${items.length} audio file${items.length > 1 ? "s" : ""} added successfully.`);
  };

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const moveFile = (index, direction) => {
    clearOutput();

    setAudioFiles((prev) => {
      const updated = [...prev];
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= updated.length) {
        return updated;
      }

      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];

      return updated;
    });
  };

  const removeFile = (id) => {
    clearOutput();
    setAudioFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const encodeWav = (audioBuffer) => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numberOfChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i += 1) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    let offset = 0;

    writeString(offset, "RIFF");
    offset += 4;
    view.setUint32(offset, 36 + length, true);
    offset += 4;
    writeString(offset, "WAVE");
    offset += 4;
    writeString(offset, "fmt ");
    offset += 4;
    view.setUint32(offset, 16, true);
    offset += 4;
    view.setUint16(offset, 1, true);
    offset += 2;
    view.setUint16(offset, numberOfChannels, true);
    offset += 2;
    view.setUint32(offset, sampleRate, true);
    offset += 4;
    view.setUint32(offset, sampleRate * numberOfChannels * 2, true);
    offset += 4;
    view.setUint16(offset, numberOfChannels * 2, true);
    offset += 2;
    view.setUint16(offset, 16, true);
    offset += 2;
    writeString(offset, "data");
    offset += 4;
    view.setUint32(offset, length, true);
    offset += 4;

    const channelData = [];

    for (let channel = 0; channel < numberOfChannels; channel += 1) {
      channelData.push(audioBuffer.getChannelData(channel));
    }

    for (let i = 0; i < audioBuffer.length; i += 1) {
      for (let channel = 0; channel < numberOfChannels; channel += 1) {
        let sample = channelData[channel][i];

        sample = Math.max(-1, Math.min(1, sample));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;

        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }

    return new Blob([buffer], { type: "audio/wav" });
  };

  const handleJoinAudio = async () => {
    clearFeedback();
    clearOutput();

    if (audioFiles.length < 2) {
      setError("Please upload at least two audio files to join.");
      return;
    }

    setIsJoining(true);

    let audioContext;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        throw new Error("Web Audio API is not supported in this browser.");
      }

      audioContext = new AudioContextClass();

      const decodedBuffers = [];

      for (const item of audioFiles) {
        const arrayBuffer = await item.file.arrayBuffer();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        decodedBuffers.push(decodedBuffer);
      }

      const sampleRate = audioContext.sampleRate;
      const maxChannels = Math.max(
        ...decodedBuffers.map((buffer) => buffer.numberOfChannels)
      );

      const totalLength = decodedBuffers.reduce(
        (sum, buffer) => sum + buffer.length,
        0
      );

      const joinedBuffer = audioContext.createBuffer(
        maxChannels,
        totalLength,
        sampleRate
      );

      let offset = 0;

      decodedBuffers.forEach((buffer) => {
        for (let channel = 0; channel < maxChannels; channel += 1) {
          const sourceChannel = Math.min(channel, buffer.numberOfChannels - 1);
          const sourceData = buffer.getChannelData(sourceChannel);
          joinedBuffer.getChannelData(channel).set(sourceData, offset);
        }

        offset += buffer.length;
      });

      const wavBlob = encodeWav(joinedBuffer);
      const wavUrl = URL.createObjectURL(wavBlob);

      setJoinedBlob(wavBlob);
      setJoinedUrl(wavUrl);
      setJoinedDuration(joinedBuffer.duration);
      setSuccess("Audio files joined successfully. You can preview and download the WAV file.");
    } catch (err) {
      setError(
        "Could not join these audio files. Please try smaller files or formats supported by your browser."
      );
    } finally {
      if (audioContext) {
        audioContext.close();
      }

      setIsJoining(false);
    }
  };

  const handleDownload = () => {
    if (!joinedUrl) return;

    const link = document.createElement("a");
    link.href = joinedUrl;
    link.download = "joined-audio.wav";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    clearOutput();

    setAudioFiles([]);
    setIsDragging(false);
    setIsJoining(false);
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const totalInputSize = useMemo(() => {
    return audioFiles.reduce((sum, item) => sum + item.size, 0);
  }, [audioFiles]);

  const totalInputDuration = useMemo(() => {
    return audioFiles.reduce((sum, item) => sum + item.duration, 0);
  }, [audioFiles]);

  const getSizeChange = () => {
    if (!joinedBlob || !totalInputSize) return "-";

    const difference = joinedBlob.size - totalInputSize;
    const percentage = Math.abs((difference / totalInputSize) * 100).toFixed(1);

    if (difference > 0) return `${percentage}% larger`;
    if (difference < 0) return `${percentage}% smaller`;

    return "Same size";
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Music size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Audio Joiner</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Join multiple audio files online for free. Upload your audio files,
          arrange the order, merge them in your browser, preview the result, and
          download one combined WAV file.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-5">
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

              <h2 className="text-xl font-semibold mb-2">Upload Audio Files</h2>

              <p className="text-sm text-[var(--text-secondary)] mb-5">
                Drag and drop audio files here, or click the button below.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm,.flac"
                multiple
                onChange={handleInputChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Upload size={18} />
                Choose Audio Files
              </button>
            </div>

            {/* FILE LIST */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileAudio size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold">Audio File Order</h3>
              </div>

              {audioFiles.length ? (
                <div className="flex flex-col gap-3">
                  {audioFiles.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 border border-[var(--border)] rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {index + 1}. {item.name}
                        </p>

                        <p className="text-xs text-[var(--text-secondary)]">
                          {formatBytes(item.size)} • {formatTime(item.duration)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveFile(index, -1)}
                          disabled={index === 0}
                          className="w-9 h-9 rounded-lg border bg-white flex items-center justify-center disabled:opacity-40"
                          title="Move up"
                        >
                          <ArrowUp size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => moveFile(index, 1)}
                          disabled={index === audioFiles.length - 1}
                          className="w-9 h-9 rounded-lg border bg-white flex items-center justify-center disabled:opacity-40"
                          title="Move down"
                        >
                          <ArrowDown size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => removeFile(item.id)}
                          className="w-9 h-9 rounded-lg border bg-white text-red-600 flex items-center justify-center"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-[var(--border)] rounded-2xl bg-gray-50">
                  <FileAudio size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-[var(--text-secondary)]">
                    Uploaded audio files will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleJoinAudio}
                disabled={audioFiles.length < 2 || isJoining}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  audioFiles.length < 2 || isJoining
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <Zap size={18} />
                {isJoining ? "Joining..." : "Join Audio"}
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
                Version 1 exports the joined audio as WAV for best browser
                compatibility. WAV files may be larger than MP3. Supported input
                formats depend on your browser.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Play size={20} className="text-[var(--primary)]" />
                <h2 className="text-xl font-semibold">Joined Audio Preview</h2>
              </div>

              <div className="border border-[var(--border)] rounded-2xl p-5 bg-gray-50 min-h-[220px] flex items-center justify-center">
                {joinedUrl ? (
                  <div className="w-full">
                    <audio src={joinedUrl} controls className="w-full" />

                    <p className="text-sm text-[var(--text-secondary)] mt-4 text-center">
                      Preview your joined audio before downloading.
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Music size={44} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-[var(--text-secondary)]">
                      Joined audio preview will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* DOWNLOAD */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!joinedUrl}
                className={`btn-primary flex-1 inline-flex items-center justify-center gap-2 ${
                  !joinedUrl ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Download size={18} />
                Download WAV
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary flex-1 inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Clear All
              </button>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Files" value={audioFiles.length} />
              <StatCard label="Input Size" value={formatBytes(totalInputSize)} />
              <StatCard
                label="Input Duration"
                value={formatTime(totalInputDuration)}
              />
              <StatCard
                label="Output Duration"
                value={joinedUrl ? formatTime(joinedDuration) : "-"}
              />
              <StatCard
                label="Output Size"
                value={joinedBlob ? formatBytes(joinedBlob.size) : "-"}
              />
              <StatCard label="Size Result" value={getSizeChange()} green />
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="audio-joiner" />
    </div>
  );
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

  if (minutes === 0) {
    return `${remainingSeconds} sec`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

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
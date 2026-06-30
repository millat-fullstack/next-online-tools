import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  Eye,
  Film,
  GripVertical,
  Loader2,
  Plus,
  RotateCcw,
  Scissors,
  Settings2,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Smart Video Cutter",
  path: "/smart-video-cutter",
  category: "Video Tools",
  description:
    "Upload one or multiple videos, split clips, trim, arrange, preview, and export the final video.",
  metaTitle: "Smart Video Cutter Online Free | Split Arrange and Export Video",
  metaDescription:
    "Cut videos online with Smart Video Cutter. Upload one or multiple videos, split clips, trim unimportant parts, drag to reorder, preview, and download the final video.",
};

const MAX_FILE_SIZE_MB = 500;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MIN_CLIP_DURATION = 0.25;
const FFMPEG_CORE_VERSION = "0.12.6";

const EXPORT_MODES = [
  {
    value: "original",
    label: "Original Quality",
    description: "Keeps original quality with stream copy when formats match.",
  },
  {
    value: "compatible",
    label: "High Compatibility",
    description: "Better for mixed videos. May re-encode and take longer.",
  },
];

export default function SmartVideoCutter() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const ffmpegRef = useRef(null);
  const ffmpegLoadedRef = useRef(false);

  const [videos, setVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [clips, setClips] = useState([]);
  const [dragClipId, setDragClipId] = useState("");

  const [currentTime, setCurrentTime] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportMode, setExportMode] = useState("original");

  const [playMode, setPlayMode] = useState({ type: "normal", clipId: "", index: -1 });
  const [pendingPlayClipId, setPendingPlayClipId] = useState("");

  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  const [exportedBlob, setExportedBlob] = useState(null);
  const [exportedUrl, setExportedUrl] = useState("");
  const [showFinalPreview, setShowFinalPreview] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedVideo = useMemo(() => {
    return videos.find((video) => video.id === selectedVideoId) || videos[0] || null;
  }, [selectedVideoId, videos]);

  const selectedClip = useMemo(() => {
    return clips.find((clip) => clip.id === playMode.clipId) || null;
  }, [clips, playMode.clipId]);

  const totalTimelineDuration = useMemo(() => {
    return clips.reduce((sum, clip) => sum + getClipDuration(clip), 0);
  }, [clips]);

  const canSplit = Boolean(selectedVideo && !isProcessing);
  const canExport = Boolean(clips.length && !isProcessing);

  useEffect(() => {
    return () => {
      videos.forEach((video) => {
        if (video.url) URL.revokeObjectURL(video.url);
      });

      if (exportedUrl) {
        URL.revokeObjectURL(exportedUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingPlayClipId) return;

    const clip = clips.find((item) => item.id === pendingPlayClipId);

    if (!clip) {
      setPendingPlayClipId("");
      return;
    }

    if (selectedVideoId !== clip.videoId) {
      setSelectedVideoId(clip.videoId);
      return;
    }

    const video = videoRef.current;

    if (!video) return;

    const playClip = () => {
      try {
        video.currentTime = clip.start;
        setCurrentTime(clip.start);
        video.play().catch(() => {
          setError("Preview could not start automatically. Press play on the video.");
        });
      } catch {
        setError("Could not preview this clip.");
      } finally {
        setPendingPlayClipId("");
      }
    };

    if (video.readyState >= 1) {
      window.setTimeout(playClip, 80);
      return;
    }

    video.addEventListener("loadedmetadata", playClip, { once: true });

    return () => {
      video.removeEventListener("loadedmetadata", playClip);
    };
  }, [pendingPlayClipId, selectedVideoId, clips]);

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearExportOutput() {
    if (exportedUrl) {
      URL.revokeObjectURL(exportedUrl);
    }

    setExportedBlob(null);
    setExportedUrl("");
    setShowFinalPreview(false);
    setProcessingTimeMs(0);
  }

  function validateVideo(file) {
    if (!file) return "Please choose a video file.";

    const fileName = file.name.toLowerCase();
    const isVideo =
      file.type.startsWith("video/") ||
      fileName.endsWith(".mp4") ||
      fileName.endsWith(".webm") ||
      fileName.endsWith(".mov") ||
      fileName.endsWith(".m4v") ||
      fileName.endsWith(".mkv");

    if (!isVideo) {
      return "Please upload valid video files like MP4, WEBM, MOV, M4V, or MKV.";
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Each video must be under ${MAX_FILE_SIZE_MB} MB.`;
    }

    return "";
  }

  async function handleFiles(fileList) {
    if (isProcessing) return;

    const incomingFiles = Array.from(fileList || []);

    if (!incomingFiles.length) return;

    setIsProcessing(true);
    setProcessingPhase("Loading videos...");
    setProgress(0);
    setError("");
    setSuccess("");
    clearExportOutput();

    const startTime = performance.now();

    try {
      const validFiles = [];
      let rejectedCount = 0;

      incomingFiles.forEach((file) => {
        const validationError = validateVideo(file);

        if (validationError) {
          rejectedCount += 1;
          return;
        }

        validFiles.push(file);
      });

      if (!validFiles.length) {
        setError("Please upload valid video files.");
        return;
      }

      const newVideos = [];
      const newClips = [];

      for (let index = 0; index < validFiles.length; index += 1) {
        const file = validFiles[index];
        const objectUrl = URL.createObjectURL(file);

        setProcessingPhase(`Reading video ${index + 1} of ${validFiles.length}...`);

        try {
          const metadata = await loadVideoMetadata(objectUrl);
          const videoId = createId();
          const videoItem = {
            id: videoId,
            file,
            url: objectUrl,
            name: file.name,
            size: file.size,
            duration: metadata.duration,
            width: metadata.width,
            height: metadata.height,
            extension: getFileExtension(file.name),
          };

          newVideos.push(videoItem);

          if (metadata.duration > MIN_CLIP_DURATION) {
            newClips.push({
              id: createId(),
              videoId,
              videoName: file.name,
              start: 0,
              end: metadata.duration,
            });
          }
        } catch {
          URL.revokeObjectURL(objectUrl);
          rejectedCount += 1;
        }

        setProgress(Math.round(((index + 1) / validFiles.length) * 95));
      }

      if (!newVideos.length) {
        setError("Could not read the selected video files. MP4 works best.");
        return;
      }

      setVideos((current) => [...current, ...newVideos]);
      setClips((current) => [...current, ...newClips]);
      setSelectedVideoId((current) => current || newVideos[0].id);
      setProgress(100);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));
      setProcessingTimeMs(actualTime);

      const messages = [];
      messages.push(`${newVideos.length} video${newVideos.length === 1 ? "" : "s"} loaded.`);
      if (rejectedCount) messages.push(`${rejectedCount} file${rejectedCount === 1 ? "" : "s"} skipped.`);

      setSuccess(`${messages.join(" ")} Full clips were added to the timeline.`);
    } finally {
      setIsProcessing(false);
      resetFileInput();
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  function handleUploadInput(event) {
    handleFiles(event.target.files);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDraggingUpload(false);
    handleFiles(event.dataTransfer.files);
  }

  function handleDragOver(event) {
    event.preventDefault();

    if (!isProcessing) {
      setIsDraggingUpload(true);
    }
  }

  function handleDragLeave() {
    setIsDraggingUpload(false);
  }

  function handleLoadedMetadata() {
    const video = videoRef.current;

    if (!video) return;

    setCurrentTime(Number(video.currentTime || 0));
  }

  function handleTimeUpdate() {
    const video = videoRef.current;

    if (!video) return;

    const time = Number(video.currentTime || 0);
    setCurrentTime(time);

    if (playMode.type === "clip" && selectedClip && time >= selectedClip.end - 0.04) {
      video.pause();
      setPlayMode({ type: "normal", clipId: "", index: -1 });
      return;
    }

    if (playMode.type === "final" && selectedClip && time >= selectedClip.end - 0.04) {
      const nextIndex = playMode.index + 1;

      if (nextIndex >= clips.length) {
        video.pause();
        setPlayMode({ type: "normal", clipId: "", index: -1 });
        setSuccess("Final preview completed.");
        return;
      }

      playTimelineClip(nextIndex);
    }
  }

  function seekBy(seconds) {
    const video = videoRef.current;

    if (!video || !selectedVideo) return;

    video.currentTime = clampNumber(video.currentTime + seconds, 0, selectedVideo.duration);
    setCurrentTime(video.currentTime);
  }

  function splitAtCurrentTime() {
    if (!selectedVideo || !videoRef.current) {
      setError("Select a video first.");
      return;
    }

    clearExportOutput();
    clearFeedback();

    const time = Number(videoRef.current.currentTime || 0);

    if (time <= MIN_CLIP_DURATION || time >= selectedVideo.duration - MIN_CLIP_DURATION) {
      setError("Move the timeline inside the video before splitting.");
      return;
    }

    const clipToSplit = clips.find(
      (clip) =>
        clip.videoId === selectedVideo.id &&
        time > clip.start + MIN_CLIP_DURATION &&
        time < clip.end - MIN_CLIP_DURATION
    );

    if (!clipToSplit) {
      setError("This point is not inside an existing clip. Choose another time or add the full video again.");
      return;
    }

    const firstClip = {
      ...clipToSplit,
      id: createId(),
      end: roundTime(time),
    };

    const secondClip = {
      ...clipToSplit,
      id: createId(),
      start: roundTime(time),
    };

    setClips((current) =>
      current.flatMap((clip) => (clip.id === clipToSplit.id ? [firstClip, secondClip] : [clip]))
    );

    setSuccess(`Split at ${formatTime(time)}.`);
  }

  function addFullVideoClip(videoId = selectedVideo?.id) {
    const video = videos.find((item) => item.id === videoId);

    if (!video) return;

    clearExportOutput();
    clearFeedback();

    setClips((current) => [
      ...current,
      {
        id: createId(),
        videoId: video.id,
        videoName: video.name,
        start: 0,
        end: video.duration,
      },
    ]);

    setSuccess("Full video clip added to timeline.");
  }

  function updateClipTime(clipId, key, value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) return;

    clearExportOutput();
    clearFeedback();

    setClips((current) =>
      current.map((clip) => {
        if (clip.id !== clipId) return clip;

        const sourceVideo = videos.find((video) => video.id === clip.videoId);
        const maxDuration = sourceVideo?.duration || clip.end;
        let nextStart = clip.start;
        let nextEnd = clip.end;

        if (key === "start") {
          nextStart = clampNumber(numericValue, 0, Math.max(0, nextEnd - MIN_CLIP_DURATION));
        }

        if (key === "end") {
          nextEnd = clampNumber(numericValue, nextStart + MIN_CLIP_DURATION, maxDuration);
        }

        return {
          ...clip,
          start: roundTime(nextStart),
          end: roundTime(nextEnd),
        };
      })
    );
  }

  function removeClip(clipId) {
    clearExportOutput();
    clearFeedback();
    setClips((current) => current.filter((clip) => clip.id !== clipId));
  }

  function removeVideo(videoId) {
    clearExportOutput();
    clearFeedback();

    const video = videos.find((item) => item.id === videoId);

    if (video?.url) {
      URL.revokeObjectURL(video.url);
    }

    setVideos((current) => current.filter((item) => item.id !== videoId));
    setClips((current) => current.filter((clip) => clip.videoId !== videoId));

    if (selectedVideoId === videoId) {
      const nextVideo = videos.find((item) => item.id !== videoId);
      setSelectedVideoId(nextVideo?.id || "");
    }
  }

  function handleClipDragStart(clipId) {
    setDragClipId(clipId);
  }

  function handleClipDrop(targetClipId) {
    if (!dragClipId || dragClipId === targetClipId) {
      setDragClipId("");
      return;
    }

    clearExportOutput();

    setClips((current) => {
      const fromIndex = current.findIndex((clip) => clip.id === dragClipId);
      const toIndex = current.findIndex((clip) => clip.id === targetClipId);

      if (fromIndex < 0 || toIndex < 0) return current;

      const updated = [...current];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);

      return updated;
    });

    setDragClipId("");
  }

  function previewClip(clipId) {
    const clip = clips.find((item) => item.id === clipId);

    if (!clip) return;

    setPlayMode({ type: "clip", clipId: clip.id, index: -1 });
    setPendingPlayClipId(clip.id);
    setSuccess(`Previewing clip at ${formatTime(clip.start)}.`);
  }

  function playTimelineClip(index) {
    const clip = clips[index];

    if (!clip) return;

    setPlayMode({ type: "final", clipId: clip.id, index });
    setPendingPlayClipId(clip.id);
  }

  function previewFinalVideo() {
    if (!clips.length) {
      setError("Add at least one clip to preview.");
      return;
    }

    setError("");
    setSuccess("Previewing final video timeline.");
    playTimelineClip(0);
  }

  async function ensureFfmpegLoaded() {
    if (!ffmpegRef.current) {
      ffmpegRef.current = new FFmpeg();
    }

    const ffmpeg = ffmpegRef.current;

    if (ffmpegLoadedRef.current) return ffmpeg;

    setProcessingPhase("Loading video engine...");
    setProgress(8);

    const baseURL = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/umd`;

    ffmpeg.on("log", ({ message }) => {
      if (message?.toLowerCase?.().includes("error")) {
        console.warn(message);
      }
    });

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegLoadedRef.current = true;

    return ffmpeg;
  }

  async function exportFinalVideo() {
    if (!clips.length) {
      setError("Add at least one clip first.");
      return;
    }

    setError("");
    setSuccess("");
    clearExportOutput();

    setIsProcessing(true);
    setProgress(0);
    setProcessingTimeMs(0);
    setProcessingPhase("Preparing export...");

    const startTime = performance.now();

    try {
      const ffmpeg = await ensureFfmpegLoaded();
      const usedVideoIds = Array.from(new Set(clips.map((clip) => clip.videoId)));
      const inputMap = new Map();

      for (let index = 0; index < usedVideoIds.length; index += 1) {
        const video = videos.find((item) => item.id === usedVideoIds[index]);

        if (!video) continue;

        const inputName = `input_${index}.${getSafeExtension(video.extension)}`;

        setProcessingPhase(`Loading source video ${index + 1} of ${usedVideoIds.length}...`);
        setProgress(10 + Math.round((index / Math.max(1, usedVideoIds.length)) * 15));

        await safeDeleteFile(ffmpeg, inputName);
        await ffmpeg.writeFile(inputName, await fetchFile(video.file));

        inputMap.set(video.id, inputName);
      }

      const outputExtension = exportMode === "original"
        ? getSafeExtension(videos.find((video) => video.id === clips[0]?.videoId)?.extension || "mp4")
        : "mp4";

      const segmentNames = [];

      for (let index = 0; index < clips.length; index += 1) {
        const clip = clips[index];
        const inputName = inputMap.get(clip.videoId);
        const segmentName = `segment_${index}.${outputExtension}`;
        const duration = Math.max(MIN_CLIP_DURATION, clip.end - clip.start);

        if (!inputName) continue;

        setProcessingPhase(`Cutting clip ${index + 1} of ${clips.length}...`);
        setProgress(28 + Math.round((index / Math.max(1, clips.length)) * 42));

        await safeDeleteFile(ffmpeg, segmentName);

        const command = exportMode === "original"
          ? [
              "-ss",
              String(clip.start),
              "-i",
              inputName,
              "-t",
              String(duration),
              "-c",
              "copy",
              "-avoid_negative_ts",
              "make_zero",
              segmentName,
            ]
          : [
              "-ss",
              String(clip.start),
              "-i",
              inputName,
              "-t",
              String(duration),
              "-c:v",
              "mpeg4",
              "-q:v",
              "2",
              "-c:a",
              "aac",
              "-b:a",
              "192k",
              "-movflags",
              "+faststart",
              segmentName,
            ];

        await ffmpeg.exec(command);
        segmentNames.push(segmentName);
      }

      if (!segmentNames.length) {
        throw new Error("No clips were exported.");
      }

      setProcessingPhase("Arranging clips...");
      setProgress(78);

      const concatList = segmentNames.map((name) => `file '${name}'`).join("\n");
      const concatFileName = "concat_list.txt";
      const outputName = `smart-video-cutter-final.${outputExtension}`;

      await safeDeleteFile(ffmpeg, concatFileName);
      await safeDeleteFile(ffmpeg, outputName);

      await ffmpeg.writeFile(concatFileName, new TextEncoder().encode(concatList));

      setProcessingPhase("Creating final video...");
      setProgress(86);

      await ffmpeg.exec([
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        concatFileName,
        "-c",
        "copy",
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], {
        type: outputExtension === "webm" ? "video/webm" : "video/mp4",
      });
      const url = URL.createObjectURL(blob);

      setExportedBlob(blob);
      setExportedUrl(url);
      setShowFinalPreview(true);
      setProgress(100);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));
      setProcessingTimeMs(actualTime);
      setSuccess(`Final video created in ${(actualTime / 1000).toFixed(1)}s. Review it or download now.`);
    } catch (exportError) {
      console.error("Smart Video Cutter export error:", exportError);

      if (exportMode === "original") {
        setError("Original Quality export failed. Try High Compatibility mode from Settings, especially for mixed videos.");
      } else {
        setError("Could not export the final video. Try MP4 videos with fewer or shorter clips.");
      }
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 800);
    }
  }

  async function downloadExportedVideo() {
    if (!exportedBlob || !exportedUrl) {
      await exportFinalVideo();
      return;
    }

    setIsProcessing(true);
    setProgress(30);
    setProcessingPhase("Starting download...");

    const startTime = performance.now();

    try {
      const extension = exportedBlob.type === "video/webm" ? "webm" : "mp4";
      await saveBlob(exportedBlob, `smart-video-cutter-final.${extension}`);

      setProgress(100);

      const actualTime = Math.max(1, Math.round(performance.now() - startTime));
      setProcessingTimeMs(actualTime);
      setSuccess(`Download started in ${(actualTime / 1000).toFixed(1)}s.`);
    } catch {
      setError("Could not start download. Please try again.");
    } finally {
      setIsProcessing(false);
      window.setTimeout(() => setProgress(0), 700);
    }
  }

  function resetTool() {
    videos.forEach((video) => {
      if (video.url) URL.revokeObjectURL(video.url);
    });

    if (exportedUrl) {
      URL.revokeObjectURL(exportedUrl);
    }

    setVideos([]);
    setSelectedVideoId("");
    setClips([]);
    setDragClipId("");
    setCurrentTime(0);
    setSettingsOpen(false);
    setExportMode("original");
    setPlayMode({ type: "normal", clipId: "", index: -1 });
    setPendingPlayClipId("");
    setIsDraggingUpload(false);
    setIsProcessing(false);
    setProcessingPhase("");
    setProgress(0);
    setProcessingTimeMs(0);
    setExportedBlob(null);
    setExportedUrl("");
    setShowFinalPreview(false);
    setError("");
    setSuccess("");
    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Scissors size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Smart Video Cutter</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Upload one or multiple videos, split where needed, trim unimportant parts,
          drag clips into order, preview, and download the final video.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="flex flex-col gap-5">
          {!videos.length && (
            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`block border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
                isDraggingUpload
                  ? "border-[var(--primary)] bg-[#f4edff]"
                  : "border-[var(--border)] hover:bg-[#f8f4ff]"
              } ${isProcessing ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <Upload size={38} className="mx-auto mb-4 text-[var(--primary)]" />

              <h2 className="text-xl font-semibold mb-2">Choose or drop videos here</h2>

              <p className="text-sm text-[var(--text-secondary)]">
                Upload one or multiple videos. MP4 works best. Max{" "}
                <strong>{MAX_FILE_SIZE_MB} MB</strong> each.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v,.mkv"
                onChange={handleUploadInput}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          )}

          {videos.length > 0 && (
            <>
              <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Film size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-bold">Video Library</h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus size={17} />
                      Add More Videos
                    </button>

                    <button
                      type="button"
                      onClick={resetTool}
                      disabled={isProcessing}
                      className="btn-secondary inline-flex items-center justify-center gap-2 text-sm"
                    >
                      <RotateCcw size={17} />
                      Reset
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="video/mp4,video/webm,video/quicktime,video/x-m4v,.mp4,.webm,.mov,.m4v,.mkv"
                      onChange={handleUploadInput}
                      className="hidden"
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {videos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      selected={selectedVideo?.id === video.id}
                      onSelect={() => {
                        setSelectedVideoId(video.id);
                        setPlayMode({ type: "normal", clipId: "", index: -1 });
                        clearFeedback();
                      }}
                      onAddClip={() => addFullVideoClip(video.id)}
                      onRemove={() => removeVideo(video.id)}
                    />
                  ))}
                </div>
              </div>

              {selectedVideo && (
                <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
                  <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Video size={20} className="text-[var(--primary)]" />
                        <h2 className="font-bold text-lg">Cut Selected Video</h2>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                        {selectedVideo.name} • {formatTime(selectedVideo.duration)} • {selectedVideo.width}×{selectedVideo.height}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={splitAtCurrentTime}
                      disabled={!canSplit}
                      className={`btn-primary inline-flex items-center justify-center gap-2 ${
                        !canSplit ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Scissors size={18} />
                      Split Here
                    </button>
                  </div>

                  <div className="p-4 sm:p-5 grid lg:grid-cols-[minmax(0,1fr)_260px] gap-5">
                    <div className="min-w-0">
                      <div className="rounded-2xl overflow-hidden bg-black">
                        <video
                          ref={videoRef}
                          src={selectedVideo.url}
                          controls
                          playsInline
                          preload="metadata"
                          onLoadedMetadata={handleLoadedMetadata}
                          onTimeUpdate={handleTimeUpdate}
                          className="w-full max-h-[620px] bg-black"
                        />
                      </div>

                      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[#fafafa] p-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <p className="text-sm font-semibold">Current time</p>
                          <p className="text-xs font-bold text-[var(--primary)]">
                            {formatTime(currentTime)} / {formatTime(selectedVideo.duration)}
                          </p>
                        </div>

                        <input
                          type="range"
                          min="0"
                          max={Math.max(0, selectedVideo.duration)}
                          step="0.01"
                          value={Math.min(currentTime, selectedVideo.duration)}
                          onChange={(event) => {
                            const video = videoRef.current;
                            const nextTime = Number(event.target.value);
                            if (video) video.currentTime = nextTime;
                            setCurrentTime(nextTime);
                          }}
                          className="w-full accent-[var(--primary)]"
                        />

                        <div className="grid grid-cols-4 gap-2 mt-3">
                          <button type="button" onClick={() => seekBy(-1)} className="small-action-btn">-1s</button>
                          <button type="button" onClick={() => seekBy(-0.1)} className="small-action-btn">-0.1s</button>
                          <button type="button" onClick={() => seekBy(0.1)} className="small-action-btn">+0.1s</button>
                          <button type="button" onClick={() => seekBy(1)} className="small-action-btn">+1s</button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={splitAtCurrentTime}
                        disabled={!canSplit}
                        className={`btn-primary min-h-[56px] inline-flex items-center justify-center gap-2 ${
                          !canSplit ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Scissors size={18} />
                        Split at Current Time
                      </button>

                      <button
                        type="button"
                        onClick={() => addFullVideoClip(selectedVideo.id)}
                        disabled={isProcessing}
                        className="btn-secondary inline-flex items-center justify-center gap-2"
                      >
                        <Plus size={18} />
                        Add Full Clip
                      </button>

                      <div className="rounded-2xl border border-[var(--border)] bg-[#fafafa] p-4">
                        <p className="font-bold text-sm mb-1">Timeline</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {clips.length} clip{clips.length === 1 ? "" : "s"} • {formatTime(totalTimelineDuration)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setSettingsOpen((current) => !current)}
                          className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#f8f4ff] transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#f4edff] flex items-center justify-center shrink-0">
                              <Settings2 size={20} className="text-[var(--primary)]" />
                            </div>

                            <div>
                              <h3 className="font-semibold">Export Settings</h3>
                              <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {EXPORT_MODES.find((mode) => mode.value === exportMode)?.label}
                              </p>
                            </div>
                          </div>

                          <ChevronDown
                            size={20}
                            className={`text-[var(--primary)] transition-transform ${settingsOpen ? "rotate-180" : ""}`}
                          />
                        </button>

                        {settingsOpen && (
                          <div className="border-t border-[var(--border)] bg-[#fafafa] p-4 space-y-2">
                            {EXPORT_MODES.map((mode) => (
                              <button
                                key={mode.value}
                                type="button"
                                onClick={() => {
                                  setExportMode(mode.value);
                                  clearExportOutput();
                                }}
                                className={`w-full rounded-xl border p-3 text-left transition ${
                                  exportMode === mode.value
                                    ? "border-[var(--primary)] bg-[#f4edff]"
                                    : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
                                }`}
                              >
                                <p className="text-sm font-bold">{mode.label}</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                  {mode.description}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Scissors size={20} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-bold">Clip Timeline</h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={previewFinalVideo}
                      disabled={!clips.length || isProcessing}
                      className="btn-secondary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-40"
                    >
                      <Eye size={17} />
                      Preview Final Video
                    </button>

                    <button
                      type="button"
                      onClick={exportFinalVideo}
                      disabled={!canExport}
                      className={`btn-primary inline-flex items-center justify-center gap-2 text-sm ${
                        !canExport ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {isProcessing ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
                      Export & Download
                    </button>
                  </div>
                </div>

                {clips.length ? (
                  <div className="grid lg:grid-cols-2 gap-3">
                    {clips.map((clip, index) => (
                      <ClipCard
                        key={clip.id}
                        clip={clip}
                        index={index}
                        sourceVideo={videos.find((video) => video.id === clip.videoId)}
                        isDragging={dragClipId === clip.id}
                        onDragStart={() => handleClipDragStart(clip.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleClipDrop(clip.id)}
                        onPreview={() => previewClip(clip.id)}
                        onRemove={() => removeClip(clip.id)}
                        onStartChange={(value) => updateClipTime(clip.id, "start", value)}
                        onEndChange={(value) => updateClipTime(clip.id, "end", value)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-gray-50 p-8 text-center text-[var(--text-secondary)]">
                    No clips yet. Add a full clip or split a selected video.
                  </div>
                )}
              </div>

              {showFinalPreview && exportedUrl && (
                <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
                  <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">Final Video Preview</h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Review the exported video before saving.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={downloadExportedVideo}
                      disabled={isProcessing}
                      className="btn-primary inline-flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Download Final Video
                    </button>
                  </div>

                  <div className="p-4 bg-black">
                    <video
                      src={exportedUrl}
                      controls
                      playsInline
                      className="w-full max-h-[620px] bg-black"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {isProcessing && (
            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                <span>{processingPhase || "Processing..."}</span>
                <span>{progress}%</span>
              </div>

              <div className="w-full h-3 rounded-full bg-white border border-[var(--border)] overflow-hidden">
                <div
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start justify-between gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <p>{success}</p>
              </div>

              {processingTimeMs > 0 && (
                <span className="font-bold shrink-0">
                  {(processingTimeMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <style>{`
        .small-action-btn {
          min-height: 38px;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          background: white;
          padding: 0.45rem 0.75rem;
          font-size: 0.85rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          transition: 160ms ease;
        }
        .small-action-btn:hover:not(:disabled) {
          background: #f8f4ff;
          color: var(--primary);
        }
        .tool-input {
          width: 100%;
          height: 40px;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 0 0.75rem;
          background: white;
          outline: none;
          font-weight: 700;
        }
        .tool-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(155, 108, 227, 0.16);
        }
      `}</style>

      <SuggestedTools currentToolId="smart-video-cutter" />
    </div>
  );
}

function VideoCard({ video, selected, onSelect, onAddClip, onRemove }) {
  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        selected
          ? "border-[var(--primary)] bg-[#f4edff]"
          : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <p className="font-bold truncate">{video.name}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {formatTime(video.duration)} • {video.width}×{video.height} • {formatBytes(video.size)}
        </p>
      </button>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          type="button"
          onClick={onAddClip}
          className="small-action-btn text-[var(--primary)]"
          title="Add full video to timeline"
        >
          <Plus size={15} />
          Add Clip
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="small-action-btn text-red-600"
          title="Remove video"
        >
          <Trash2 size={15} />
          Remove
        </button>
      </div>
    </div>
  );
}

function ClipCard({
  clip,
  index,
  sourceVideo,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onPreview,
  onRemove,
  onStartChange,
  onEndChange,
}) {
  const duration = getClipDuration(clip);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`rounded-2xl border bg-white p-4 transition ${
        isDragging
          ? "border-[var(--primary)] opacity-60"
          : "border-[var(--border)] hover:border-[var(--primary)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#f4edff] text-[var(--primary)] flex items-center justify-center shrink-0 cursor-grab">
          <GripVertical size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold">Clip {index + 1}</p>
              <p className="text-xs text-[var(--text-secondary)] truncate mt-1">
                {sourceVideo?.name || clip.videoName}
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={onPreview}
                className="h-9 w-9 rounded-xl border border-[var(--border)] inline-flex items-center justify-center hover:bg-[#f8f4ff] hover:text-[var(--primary)]"
                title="Preview clip"
              >
                <Eye size={16} />
              </button>

              <button
                type="button"
                onClick={onRemove}
                className="h-9 w-9 rounded-xl border border-red-200 bg-red-50 text-red-600 inline-flex items-center justify-center hover:bg-red-100"
                title="Remove clip"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <label className="block">
              <span className="text-xs font-bold text-[var(--text-secondary)]">Start</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={Number(clip.start.toFixed(2))}
                onChange={(event) => onStartChange(event.target.value)}
                className="tool-input mt-1"
              />
            </label>

            <label className="block">
              <span className="text-xs font-bold text-[var(--text-secondary)]">End</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={Number(clip.end.toFixed(2))}
                onChange={(event) => onEndChange(event.target.value)}
                className="tool-input mt-1"
              />
            </label>

            <div className="rounded-xl border border-[var(--border)] bg-[#fafafa] p-3">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Clock size={14} />
                Duration
              </div>
              <p className="font-bold mt-1">{formatTime(duration)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

async function safeDeleteFile(ffmpeg, fileName) {
  try {
    await ffmpeg.deleteFile(fileName);
  } catch {
    // Ignore missing files.
  }
}

function loadVideoMetadata(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
    };

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const duration = Number(video.duration || 0);

      if (!Number.isFinite(duration) || duration <= 0) {
        cleanup();
        reject(new Error("Invalid video duration."));
        return;
      }

      const metadata = {
        duration,
        width: video.videoWidth || 0,
        height: video.videoHeight || 0,
      };

      cleanup();
      resolve(metadata);
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Could not load video."));
    };

    video.src = url;
  });
}

async function saveBlob(blob, filename) {
  const safeBlob = blob instanceof Blob ? blob : new Blob([blob], { type: "application/octet-stream" });
  const safeName = sanitizeDownloadFileName(filename || "smart-video-cutter-final.mp4");
  const file = new File([safeBlob], safeName, { type: safeBlob.type || "video/mp4" });

  const canShareFile =
    isIosLikeDevice() &&
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function" &&
    navigator.canShare({ files: [file] });

  if (canShareFile) {
    await navigator.share({
      files: [file],
      title: safeName,
    });
    return;
  }

  const url = URL.createObjectURL(safeBlob);
  const link = document.createElement("a");

  link.href = url;
  link.download = safeName;
  link.rel = "noopener";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function isIosLikeDevice() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";

  return (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && Number(navigator.maxTouchPoints || 0) > 1)
  );
}

function getClipDuration(clip) {
  return Math.max(0, Number(clip.end || 0) - Number(clip.start || 0));
}

function getFileExtension(fileName) {
  const match = String(fileName || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || "mp4";
}

function getSafeExtension(extension) {
  const clean = String(extension || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "");

  if (["mp4", "webm", "mov", "m4v", "mkv"].includes(clean)) {
    return clean;
  }

  return "mp4";
}

function sanitizeDownloadFileName(fileName) {
  const cleanName = String(fileName || "download")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  return cleanName || "download";
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function roundTime(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function formatTime(seconds) {
  const value = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const wholeSeconds = Math.floor(value % 60);
  const centiseconds = Math.floor((value % 1) * 100);

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, sizeIndex);

  return `${size.toFixed(sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
}

function clampNumber(value, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) return min;

  return Math.min(max, Math.max(min, number));
}

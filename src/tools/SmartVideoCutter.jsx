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
  MousePointer2,
  Plus,
  RotateCcw,
  Scissors,
  Settings2,
  Music,
  Type,
  Volume2,
  VolumeX,
  Trash2,
  Upload,
  Video,
  ZoomIn,
  ZoomOut,
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
const TEXT_FONT_OPTIONS = [
  "Arial",
  "Helvetica",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Georgia",
  "Times New Roman",
  "Garamond",
  "Palatino",
  "Courier New",
  "Lucida Console",
  "Impact",
  "Comic Sans MS",
  "Brush Script MT",
  "Lucida Handwriting",
  "Segoe Script",
  "Great Vibes",
  "Dancing Script",
  "Pacifico",
  "Playfair Display",
  "Montserrat",
  "Poppins",
  "Roboto",
  "Lora",
  "Cinzel",
  "Cormorant Garamond",
  "Merriweather",
  "Baskerville",
];

const TEXT_POSITION_OPTIONS = [
  { value: "top", label: "Top" },
  { value: "center", label: "Center" },
  { value: "bottom", label: "Bottom" },
  { value: "custom", label: "Custom" },
];

const DEFAULT_TEXT_OVERLAY = {
  text: "Your text here",
  fontFamily: "Arial",
  fontSize: 42,
  color: "#ffffff",
  backgroundColor: "#000000",
  backgroundOpacity: 0,
  position: "center",
  xPercent: 50,
  yPercent: 50,
  start: 0,
  end: 5,
};


export default function SmartVideoCutter() {
  const fileInputRef = useRef(null);
  const musicInputRef = useRef(null);
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const zoomTimelineRef = useRef(null);
  const ffmpegRef = useRef(null);
  const ffmpegLoadedRef = useRef(false);

  const [videos, setVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [clips, setClips] = useState([]);
  const [dragClipId, setDragClipId] = useState("");
  const [selectedClipIds, setSelectedClipIds] = useState([]);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [thumbnailZoomOpen, setThumbnailZoomOpen] = useState(true);
  const [hoverTimeline, setHoverTimeline] = useState({ active: false, time: 0, x: 0 });
  const [resizeState, setResizeState] = useState(null);
  const [pendingSeek, setPendingSeek] = useState(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [textPanelOpen, setTextPanelOpen] = useState(false);
  const [musicPanelOpen, setMusicPanelOpen] = useState(false);
  const [exportMode, setExportMode] = useState("original");

  const [textOverlays, setTextOverlays] = useState([]);
  const [draftTextOverlay, setDraftTextOverlay] = useState(DEFAULT_TEXT_OVERLAY);

  const [musicFile, setMusicFile] = useState(null);
  const [musicUrl, setMusicUrl] = useState("");
  const [musicName, setMusicName] = useState("");
  const [muteOriginalAudio, setMuteOriginalAudio] = useState(false);
  const [musicVolume, setMusicVolume] = useState(85);
  const [originalAudioVolume, setOriginalAudioVolume] = useState(100);

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

  const timelineClips = useMemo(() => buildTimelineClips(clips), [clips]);

  const totalTimelineDuration = useMemo(() => {
    return clips.reduce((sum, clip) => sum + getClipDuration(clip), 0);
  }, [clips]);

  const timelinePixelsPerSecond = useMemo(() => getTimelinePixelsPerSecond(timelineZoom), [timelineZoom]);

  const timelinePlayheadTime = useMemo(() => {
    if (playMode.type === "final" && selectedClip) {
      const timelineClip = timelineClips.find((clip) => clip.id === selectedClip.id);

      if (timelineClip) {
        return clampNumber(
          timelineClip.timelineStart + (currentTime - selectedClip.start),
          0,
          totalTimelineDuration
        );
      }
    }

    if (selectedVideo) {
      const matchingClip = timelineClips.find(
        (clip) =>
          clip.videoId === selectedVideo.id &&
          currentTime >= clip.start &&
          currentTime <= clip.end
      );

      if (matchingClip) {
        return clampNumber(
          matchingClip.timelineStart + (currentTime - matchingClip.start),
          0,
          totalTimelineDuration
        );
      }
    }

    return 0;
  }, [currentTime, playMode.type, selectedClip, selectedVideo, timelineClips, totalTimelineDuration]);

  const canSplit = Boolean(selectedVideo && !isProcessing);
  const canExport = Boolean(clips.length && !isProcessing);
  const hasTextOverlays = textOverlays.length > 0;
  const hasMusicEdits = Boolean(musicFile || muteOriginalAudio);
  const needsEnhancedExport = hasTextOverlays || hasMusicEdits;

  useEffect(() => {
    return () => {
      videos.forEach((video) => {
        if (video.url) URL.revokeObjectURL(video.url);
        if (video.thumbnailUrl) URL.revokeObjectURL(video.thumbnailUrl);
      });

      if (exportedUrl) {
        URL.revokeObjectURL(exportedUrl);
      }

      if (musicUrl) {
        URL.revokeObjectURL(musicUrl);
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

  useEffect(() => {
    if (!pendingSeek) return;

    if (selectedVideoId !== pendingSeek.videoId) {
      setSelectedVideoId(pendingSeek.videoId);
      return;
    }

    const video = videoRef.current;

    if (!video) return;

    const applySeek = () => {
      try {
        video.currentTime = clampNumber(pendingSeek.time, 0, video.duration || pendingSeek.time);
        setCurrentTime(video.currentTime);
      } finally {
        setPendingSeek(null);
      }
    };

    if (video.readyState >= 1) {
      window.setTimeout(applySeek, 40);
      return;
    }

    video.addEventListener("loadedmetadata", applySeek, { once: true });

    return () => {
      video.removeEventListener("loadedmetadata", applySeek);
    };
  }, [pendingSeek, selectedVideoId]);

  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase?.();
      const isTyping = tagName === "input" || tagName === "textarea" || target?.isContentEditable;

      if (isTyping) return;

      if (event.key?.toLowerCase() === "s") {
        if (hoverTimeline.active && clips.length) {
          event.preventDefault();
          splitClipAtTimelineTime(hoverTimeline.time);
        } else {
          splitAtCurrentTime();
        }
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedClipIds.length) {
        event.preventDefault();
        removeSelectedClips();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hoverTimeline, clips, selectedClipIds]);

  useEffect(() => {
    if (!resizeState) return;

    function handlePointerMove(event) {
      const deltaSeconds = (event.clientX - resizeState.startClientX) / Math.max(1, resizeState.pixelsPerSecond);

      clearExportOutput();

      setClips((current) =>
        current.map((clip) => {
          if (clip.id !== resizeState.clipId) return clip;

          const sourceVideo = videos.find((video) => video.id === clip.videoId);
          const maxDuration = sourceVideo?.duration || resizeState.originalEnd;
          let nextStart = resizeState.originalStart;
          let nextEnd = resizeState.originalEnd;

          if (resizeState.side === "left") {
            nextStart = clampNumber(
              resizeState.originalStart + deltaSeconds,
              0,
              resizeState.originalEnd - MIN_CLIP_DURATION
            );
          }

          if (resizeState.side === "right") {
            nextEnd = clampNumber(
              resizeState.originalEnd + deltaSeconds,
              resizeState.originalStart + MIN_CLIP_DURATION,
              maxDuration
            );
          }

          return {
            ...clip,
            start: roundTime(nextStart),
            end: roundTime(nextEnd),
          };
        })
      );
    }

    function handlePointerUp() {
      setResizeState(null);
      setSuccess("Clip trim updated.");
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [resizeState, videos]);

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
          const thumbnailUrl = await generateVideoThumbnail(
            objectUrl,
            Math.min(Math.max(0.1, metadata.duration * 0.08), Math.max(0.1, metadata.duration - 0.1))
          ).catch(() => "");
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
            thumbnailUrl,
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

  function splitClipAtTimelineTime(timelineTime) {
    const timelineClip = findTimelineClipAtTime(timelineClips, timelineTime);

    if (!timelineClip) {
      setError("Move your mouse over a clip on the timeline, then press S or click Split.");
      return;
    }

    const sourceTime = timelineClip.start + (timelineTime - timelineClip.timelineStart);

    if (
      sourceTime <= timelineClip.start + MIN_CLIP_DURATION ||
      sourceTime >= timelineClip.end - MIN_CLIP_DURATION
    ) {
      setError("Split point is too close to the clip edge.");
      return;
    }

    const firstClip = {
      ...timelineClip,
      id: createId(),
      end: roundTime(sourceTime),
    };

    const secondClip = {
      ...timelineClip,
      id: createId(),
      start: roundTime(sourceTime),
    };

    delete firstClip.timelineStart;
    delete firstClip.timelineEnd;
    delete firstClip.timelineIndex;
    delete secondClip.timelineStart;
    delete secondClip.timelineEnd;
    delete secondClip.timelineIndex;

    clearExportOutput();
    clearFeedback();

    setClips((current) =>
      current.flatMap((clip) => (clip.id === timelineClip.id ? [firstClip, secondClip] : [clip]))
    );
    setSelectedClipIds([firstClip.id, secondClip.id]);
    setSuccess(`Timeline split at ${formatTime(timelineTime)}. Shortcut: S`);
  }

  function seekToTimelineTime(timelineTime) {
    const timelineClip = findTimelineClipAtTime(timelineClips, timelineTime);

    if (!timelineClip) return;

    const sourceTime = timelineClip.start + (timelineTime - timelineClip.timelineStart);

    setPlayMode({ type: "normal", clipId: "", index: -1 });
    setPendingSeek({ videoId: timelineClip.videoId, time: sourceTime });
    setSelectedClipIds([timelineClip.id]);
  }

  function handleTimelinePointerMove(event) {
    if (!timelineRef.current || !totalTimelineDuration) return;

    const timelineData = getTimelinePointerData(event, timelineRef.current, timelinePixelsPerSecond, totalTimelineDuration);

    setHoverTimeline({
      active: true,
      time: timelineData.time,
      x: timelineData.x,
    });
  }

  function handleTimelinePointerLeave() {
    setHoverTimeline((current) => ({ ...current, active: false }));
  }

  function handleTimelineClick(event) {
    if (!totalTimelineDuration) return;

    const timelineData = getTimelinePointerData(event, timelineRef.current, timelinePixelsPerSecond, totalTimelineDuration);
    seekToTimelineTime(timelineData.time);
  }

  function selectClip(clipId, event) {
    const multi = event?.shiftKey || event?.ctrlKey || event?.metaKey;

    setSelectedClipIds((current) => {
      if (!multi) return [clipId];

      return current.includes(clipId)
        ? current.filter((id) => id !== clipId)
        : [...current, clipId];
    });
  }

  function removeSelectedClips() {
    if (!selectedClipIds.length) return;

    clearExportOutput();
    clearFeedback();
    setClips((current) => current.filter((clip) => !selectedClipIds.includes(clip.id)));
    setSelectedClipIds([]);
    setSuccess("Selected clips deleted.");
  }

  function startTimelineTrim(clipId, side, event) {
    event.preventDefault();
    event.stopPropagation();

    const clip = clips.find((item) => item.id === clipId);

    if (!clip) return;

    setSelectedClipIds((current) => current.length ? current : [clipId]);
    setResizeState({
      clipId,
      side,
      startClientX: event.clientX,
      originalStart: clip.start,
      originalEnd: clip.end,
      pixelsPerSecond: timelinePixelsPerSecond,
    });
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
    setSelectedClipIds((current) => current.filter((id) => id !== clipId));
  }

  function removeVideo(videoId) {
    clearExportOutput();
    clearFeedback();

    const video = videos.find((item) => item.id === videoId);

    if (video?.url) {
      URL.revokeObjectURL(video.url);
    }

    if (video?.thumbnailUrl) {
      URL.revokeObjectURL(video.thumbnailUrl);
    }

    setVideos((current) => current.filter((item) => item.id !== videoId));
    setClips((current) => current.filter((clip) => clip.videoId !== videoId));
    setSelectedClipIds((current) =>
      current.filter((id) => !clips.some((clip) => clip.id === id && clip.videoId === videoId))
    );

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

  function updateDraftTextOverlay(updates) {
    setDraftTextOverlay((current) => ({
      ...current,
      ...updates,
    }));
    clearExportOutput();
    clearFeedback();
  }

  function addTextOverlay() {
    const cleanText = String(draftTextOverlay.text || "").trim();

    if (!cleanText) {
      setError("Write text before adding it to the video.");
      return;
    }

    const fullTimelineEnd = totalTimelineDuration || 5;
    const requestedStart = Number(draftTextOverlay.start || 0);
    const requestedEnd = Number(draftTextOverlay.end || fullTimelineEnd);
    const shouldUseFullVideo = requestedStart === 0 && (requestedEnd === 5 || requestedEnd <= requestedStart);
    const safeStart = shouldUseFullVideo
      ? 0
      : clampNumber(requestedStart, 0, Math.max(0, fullTimelineEnd));

    const safeEnd = shouldUseFullVideo
      ? fullTimelineEnd
      : Math.max(safeStart + 0.25, requestedEnd);

    const overlay = {
      ...draftTextOverlay,
      id: createId(),
      text: cleanText,
      start: clampNumber(safeStart, 0, Math.max(0, fullTimelineEnd)),
      end: clampNumber(safeEnd, 0.25, Math.max(0.25, fullTimelineEnd)),
    };

    setTextOverlays((current) => [...current, overlay]);
    setDraftTextOverlay((current) => ({
      ...current,
      text: "",
      start: 0,
      end: fullTimelineEnd,
    }));
    clearExportOutput();
    setError("");
    setSuccess("Text added to the video timeline.");
  }

  function removeTextOverlay(id) {
    setTextOverlays((current) => current.filter((overlay) => overlay.id !== id));
    clearExportOutput();
    clearFeedback();
  }

  function handleMusicInput(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isAudio =
      file.type.startsWith("audio/") ||
      fileName.endsWith(".mp3") ||
      fileName.endsWith(".wav") ||
      fileName.endsWith(".m4a") ||
      fileName.endsWith(".aac") ||
      fileName.endsWith(".ogg");

    if (!isAudio) {
      setError("Please upload a valid music file like MP3, WAV, M4A, AAC, or OGG.");
      resetMusicInput();
      return;
    }

    if (musicUrl) {
      URL.revokeObjectURL(musicUrl);
    }

    const objectUrl = URL.createObjectURL(file);

    setMusicFile(file);
    setMusicUrl(objectUrl);
    setMusicName(file.name);
    setMusicPanelOpen(true);
    clearExportOutput();
    setError("");
    setSuccess("Music added. You can mute original video audio if needed.");
    resetMusicInput();
  }

  function removeMusic() {
    if (musicUrl) {
      URL.revokeObjectURL(musicUrl);
    }

    setMusicFile(null);
    setMusicUrl("");
    setMusicName("");
    clearExportOutput();
    clearFeedback();
  }

  function resetMusicInput() {
    if (musicInputRef.current) {
      musicInputRef.current.value = "";
    }
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

      const enhancedExport = needsEnhancedExport;
      const effectiveExportMode = enhancedExport ? "compatible" : exportMode;
      const outputExtension = effectiveExportMode === "original"
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

        const command = effectiveExportMode === "original"
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
      const baseOutputName = `smart-video-cutter-base.${outputExtension}`;
      const outputName = `smart-video-cutter-final.${outputExtension}`;

      await safeDeleteFile(ffmpeg, concatFileName);
      await safeDeleteFile(ffmpeg, baseOutputName);
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
        baseOutputName,
      ]);

      if (enhancedExport) {
        setProcessingPhase("Applying text and music...");
        setProgress(92);

        await applyTextAndMusicExport({
          ffmpeg,
          inputName: baseOutputName,
          outputName,
          textOverlays,
          musicFile,
          musicVolume,
          originalAudioVolume,
          muteOriginalAudio,
        });
      } else {
        await ffmpeg.exec(["-i", baseOutputName, "-c", "copy", outputName]);
      }

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

      if (needsEnhancedExport) {
        setError("Could not export with text/music. Try MP4 videos, shorter clips, or remove complex text/audio options.");
      } else if (exportMode === "original") {
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
      if (video.thumbnailUrl) URL.revokeObjectURL(video.thumbnailUrl);
    });

    if (exportedUrl) {
      URL.revokeObjectURL(exportedUrl);
    }

    setVideos([]);
    setSelectedVideoId("");
    setClips([]);
    setDragClipId("");
    setSelectedClipIds([]);
    setTimelineZoom(1);
    setThumbnailZoomOpen(true);
    setHoverTimeline({ active: false, time: 0, x: 0 });
    setResizeState(null);
    setPendingSeek(null);
    setCurrentTime(0);
    setSettingsOpen(false);
    setTextPanelOpen(false);
    setMusicPanelOpen(false);
    setExportMode("original");
    setTextOverlays([]);
    setDraftTextOverlay(DEFAULT_TEXT_OVERLAY);

    if (musicUrl) {
      URL.revokeObjectURL(musicUrl);
    }

    setMusicFile(null);
    setMusicUrl("");
    setMusicName("");
    setMuteOriginalAudio(false);
    setMusicVolume(85);
    setOriginalAudioVolume(100);
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
                        <h2 className="font-bold text-lg">Video Preview</h2>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
                        {selectedVideo.name} • {formatTime(selectedVideo.duration)} • {selectedVideo.width}×{selectedVideo.height}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
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

                      <button
                        type="button"
                        onClick={() => addFullVideoClip(selectedVideo.id)}
                        disabled={isProcessing}
                        className="btn-secondary inline-flex items-center justify-center gap-2"
                      >
                        <Plus size={18} />
                        Add Full Clip
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <QuickVideoToolbar
                      draft={draftTextOverlay}
                      textCount={textOverlays.length}
                      musicInputRef={musicInputRef}
                      musicName={musicName}
                      muteOriginalAudio={muteOriginalAudio}
                      musicVolume={musicVolume}
                      originalAudioVolume={originalAudioVolume}
                      onUpdateDraft={updateDraftTextOverlay}
                      onAddText={addTextOverlay}
                      onMusicInput={handleMusicInput}
                      onRemoveMusic={removeMusic}
                      onMuteChange={(value) => {
                        setMuteOriginalAudio(value);
                        clearExportOutput();
                      }}
                      onMusicVolumeChange={(value) => {
                        setMusicVolume(value);
                        clearExportOutput();
                      }}
                      onOriginalVolumeChange={(value) => {
                        setOriginalAudioVolume(value);
                        clearExportOutput();
                      }}
                    />

                    <div className="rounded-2xl overflow-hidden bg-black">
                      <video
                        ref={videoRef}
                        src={selectedVideo.url}
                        controls
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        className="w-full max-h-[560px] bg-black"
                      />
                    </div>

                    <TimelineTopBar
                      selectedCount={selectedClipIds.length}
                      canSplit={Boolean(hoverTimeline.active && findTimelineClipAtTime(timelineClips, hoverTimeline.time))}
                      canExport={canExport}
                      isProcessing={isProcessing}
                      onAddText={addTextOverlay}
                      onAddMusic={() => musicInputRef.current?.click()}
                      onDeleteSelected={removeSelectedClips}
                      onPreview={previewFinalVideo}
                      onSplit={() => splitClipAtTimelineTime(hoverTimeline.time)}
                      onExport={exportFinalVideo}
                    />

                    <TimelineEditor
                      timelineRef={timelineRef}
                      clips={timelineClips}
                      videos={videos}
                      totalDuration={totalTimelineDuration}
                      pixelsPerSecond={timelinePixelsPerSecond}
                      hoverTimeline={hoverTimeline}
                      playheadTime={timelinePlayheadTime}
                      selectedClipIds={selectedClipIds}
                      dragClipId={dragClipId}
                      onPointerMove={handleTimelinePointerMove}
                      onPointerLeave={handleTimelinePointerLeave}
                      onTimelineClick={handleTimelineClick}
                      onSplitAtHover={() => splitClipAtTimelineTime(hoverTimeline.time)}
                      onClipSelect={selectClip}
                      onDragStart={handleClipDragStart}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleClipDrop}
                      onPreview={previewClip}
                      onRemove={removeClip}
                      onTrimStart={startTimelineTrim}
                    />


                  </div>
                </div>
              )}

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
        .timeline-scrollbar::-webkit-scrollbar { height: 10px; }
        .timeline-scrollbar::-webkit-scrollbar-thumb { background: #c4b5fd; border-radius: 999px; }
        .timeline-scrollbar::-webkit-scrollbar-track { background: #ede9fe; border-radius: 999px; }
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

function QuickVideoToolbar({
  draft,
  textCount,
  musicInputRef,
  musicName,
  muteOriginalAudio,
  musicVolume,
  originalAudioVolume,
  onUpdateDraft,
  onAddText,
  onMusicInput,
  onRemoveMusic,
  onMuteChange,
  onMusicVolumeChange,
  onOriginalVolumeChange,
}) {
  return (
    <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[#fafafa] p-3">
      <div className="grid xl:grid-cols-[1.2fr_1fr_auto] gap-3 items-end">
        <label className="block">
          <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Text</span>
          <input
            value={draft.text}
            onChange={(event) => onUpdateDraft({ text: event.target.value })}
            placeholder="Add title or caption..."
            className="tool-input"
          />
        </label>

        <div className="grid grid-cols-[1fr_84px_52px] gap-2">
          <label className="block">
            <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Font</span>
            <select
              value={draft.fontFamily}
              onChange={(event) => onUpdateDraft({ fontFamily: event.target.value })}
              className="tool-input"
            >
              {TEXT_FONT_OPTIONS.map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Size</span>
            <input
              type="number"
              min="12"
              max="180"
              value={draft.fontSize}
              onChange={(event) => onUpdateDraft({ fontSize: Number(event.target.value) })}
              className="tool-input"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-[var(--text-secondary)] mb-1 block">Color</span>
            <input
              type="color"
              value={draft.color}
              onChange={(event) => onUpdateDraft({ color: event.target.value })}
              className="w-full h-10 rounded-xl border border-[var(--border)] bg-white p-1"
              title="Text color"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAddText}
            className="h-10 w-10 rounded-xl border border-[var(--border)] bg-white inline-flex items-center justify-center text-[var(--primary)] hover:bg-[#f8f4ff]"
            title={`Add text layer${textCount ? ` (${textCount} added)` : ""}`}
            aria-label="Add text"
          >
            <Type size={18} />
          </button>

          <button
            type="button"
            onClick={() => musicInputRef.current?.click()}
            className="h-10 w-10 rounded-xl border border-[var(--border)] bg-white inline-flex items-center justify-center text-[var(--primary)] hover:bg-[#f8f4ff]"
            title={musicName ? `Music: ${musicName}` : "Add music"}
            aria-label="Add music"
          >
            <Music size={18} />
          </button>

          <button
            type="button"
            onClick={() => onMuteChange(!muteOriginalAudio)}
            className={`h-10 w-10 rounded-xl border inline-flex items-center justify-center hover:bg-[#f8f4ff] ${
              muteOriginalAudio
                ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                : "border-[var(--border)] bg-white text-[var(--text-secondary)]"
            }`}
            title={muteOriginalAudio ? "Original audio muted" : "Mute original audio"}
            aria-label="Mute original audio"
          >
            {muteOriginalAudio ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>

      <input
        ref={musicInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg,.mp3,.wav,.m4a,.aac,.ogg"
        onChange={onMusicInput}
        className="hidden"
      />

      {(musicName || muteOriginalAudio) && (
        <div className="mt-3 grid md:grid-cols-[1fr_auto] gap-3 items-center rounded-xl border border-[var(--border)] bg-white p-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--text-secondary)]">Audio</p>
            <p className="text-sm font-semibold truncate">
              {musicName ? musicName : "No added music"} {muteOriginalAudio ? "• Original muted" : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {musicName && (
              <button
                type="button"
                onClick={onRemoveMusic}
                className="h-9 w-9 rounded-xl border border-red-200 bg-red-50 text-red-600 inline-flex items-center justify-center hover:bg-red-100"
                title="Remove music"
              >
                <Trash2 size={16} />
              </button>
            )}

            <label className="text-xs font-bold inline-flex items-center gap-2">
              Music
              <input
                type="range"
                min="0"
                max="150"
                value={musicVolume}
                onChange={(event) => onMusicVolumeChange(Number(event.target.value))}
                className="w-24 accent-[var(--primary)]"
              />
            </label>

            {!muteOriginalAudio && (
              <label className="text-xs font-bold inline-flex items-center gap-2">
                Original
                <input
                  type="range"
                  min="0"
                  max="150"
                  value={originalAudioVolume}
                  onChange={(event) => onOriginalVolumeChange(Number(event.target.value))}
                  className="w-24 accent-[var(--primary)]"
                />
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineTopBar({
  selectedCount,
  canSplit,
  canExport,
  isProcessing,
  onAddText,
  onAddMusic,
  onDeleteSelected,
  onPreview,
  onSplit,
  onExport,
}) {
  return (
    <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Scissors size={19} className="text-[var(--primary)]" />
        <div>
          <h3 className="font-bold">Timeline Tools</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Add text music split preview and export from here.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAddText}
          className="h-10 w-10 rounded-xl border border-[var(--border)] bg-white inline-flex items-center justify-center text-[var(--primary)] hover:bg-[#f8f4ff]"
          title="Add text to timeline"
        >
          <Type size={18} />
        </button>

        <button
          type="button"
          onClick={onAddMusic}
          className="h-10 w-10 rounded-xl border border-[var(--border)] bg-white inline-flex items-center justify-center text-[var(--primary)] hover:bg-[#f8f4ff]"
          title="Add music"
        >
          <Music size={18} />
        </button>

        {selectedCount > 0 && (
          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={isProcessing}
            className="h-10 w-10 rounded-xl border border-red-200 bg-red-50 text-red-600 inline-flex items-center justify-center hover:bg-red-100 disabled:opacity-40"
            title={`Delete selected clips (${selectedCount})`}
          >
            <Trash2 size={18} />
          </button>
        )}

        <button
          type="button"
          onClick={onSplit}
          disabled={!canSplit}
          className="h-10 w-10 rounded-xl border border-[var(--border)] bg-white inline-flex items-center justify-center text-[var(--primary)] hover:bg-[#f8f4ff] disabled:opacity-40"
          title="Split at mouse"
        >
          <Scissors size={18} />
        </button>

        <button
          type="button"
          onClick={onPreview}
          disabled={isProcessing}
          className="h-10 w-10 rounded-xl border border-[var(--border)] bg-white inline-flex items-center justify-center text-[var(--primary)] hover:bg-[#f8f4ff] disabled:opacity-40"
          title="Preview final video"
        >
          <Eye size={18} />
        </button>

        <button
          type="button"
          onClick={onExport}
          disabled={!canExport}
          className="h-10 px-4 rounded-xl bg-[var(--primary)] text-white font-bold inline-flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40"
          title="Export and download"
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>
    </div>
  );
}

function TextOverlayPanel({
  open,
  onToggle,
  draft,
  overlays,
  totalDuration,
  onUpdateDraft,
  onAdd,
  onRemove,
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#f8f4ff] transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f4edff] flex items-center justify-center shrink-0">
            <Type size={20} className="text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="font-bold">Add Text</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {overlays.length ? `${overlays.length} text layer${overlays.length === 1 ? "" : "s"} added` : "Titles captions wedding fonts and more"}
            </p>
          </div>
        </div>
        <ChevronDown className={`text-[var(--primary)] transition-transform ${open ? "rotate-180" : ""}`} size={20} />
      </button>

      {open && (
        <div className="border-t border-[var(--border)] bg-[#fafafa] p-4 space-y-4">
          <label className="block">
            <span className="block text-sm font-bold mb-2">Text</span>
            <textarea
              value={draft.text}
              onChange={(event) => onUpdateDraft({ text: event.target.value })}
              rows={3}
              placeholder="Write title, caption, quote, or wedding text..."
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-3 outline-none focus:border-[var(--primary)] resize-none"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-sm font-bold mb-2">Font</span>
              <select
                value={draft.fontFamily}
                onChange={(event) => onUpdateDraft({ fontFamily: event.target.value })}
                className="tool-input"
              >
                {TEXT_FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-bold mb-2">Position</span>
              <select
                value={draft.position}
                onChange={(event) => onUpdateDraft({ position: event.target.value })}
                className="tool-input"
              >
                {TEXT_POSITION_OPTIONS.map((position) => (
                  <option key={position.value} value={position.value}>{position.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-sm font-bold mb-2">Size</span>
              <input
                type="number"
                min="12"
                max="180"
                value={draft.fontSize}
                onChange={(event) => onUpdateDraft({ fontSize: Number(event.target.value) })}
                className="tool-input"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-bold mb-2">Color</span>
              <input
                type="color"
                value={draft.color}
                onChange={(event) => onUpdateDraft({ color: event.target.value })}
                className="w-full h-10 rounded-xl border border-[var(--border)] bg-white p-1"
              />
            </label>
          </div>

          {draft.position === "custom" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm font-bold mb-2">X Position: {draft.xPercent}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={draft.xPercent}
                  onChange={(event) => onUpdateDraft({ xPercent: Number(event.target.value) })}
                  className="w-full accent-[var(--primary)]"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-bold mb-2">Y Position: {draft.yPercent}%</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={draft.yPercent}
                  onChange={(event) => onUpdateDraft({ yPercent: Number(event.target.value) })}
                  className="w-full accent-[var(--primary)]"
                />
              </label>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-sm font-bold mb-2">Show From</span>
              <input
                type="number"
                min="0"
                max={Math.max(0, totalDuration)}
                step="0.01"
                value={Number(draft.start || 0)}
                onChange={(event) => onUpdateDraft({ start: Number(event.target.value) })}
                className="tool-input"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-bold mb-2">Show Until</span>
              <input
                type="number"
                min="0"
                max={Math.max(0, totalDuration)}
                step="0.01"
                value={Number(draft.end || 0)}
                onChange={(event) => onUpdateDraft({ end: Number(event.target.value) })}
                className="tool-input"
              />
            </label>
          </div>

          <button type="button" onClick={onAdd} className="btn-primary w-full inline-flex items-center justify-center gap-2">
            <Plus size={18} />
            Add Text Layer
          </button>

          {overlays.length > 0 && (
            <div className="space-y-2">
              {overlays.map((overlay, index) => (
                <div key={overlay.id} className="rounded-xl border border-[var(--border)] bg-white p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">Text {index + 1}: {overlay.text}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {overlay.fontFamily} • {formatTime(overlay.start)} → {formatTime(overlay.end)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(overlay.id)}
                    className="h-9 w-9 rounded-xl border border-red-200 bg-red-50 text-red-600 inline-flex items-center justify-center hover:bg-red-100 shrink-0"
                    title="Remove text layer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MusicPanel({
  open,
  onToggle,
  musicInputRef,
  musicName,
  musicUrl,
  muteOriginalAudio,
  musicVolume,
  originalAudioVolume,
  onMusicInput,
  onRemoveMusic,
  onMuteChange,
  onMusicVolumeChange,
  onOriginalVolumeChange,
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#f8f4ff] transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f4edff] flex items-center justify-center shrink-0">
            <Music size={20} className="text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="font-bold">Add Music</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {musicName || (muteOriginalAudio ? "Original audio muted" : "Upload music or mute original audio")}
            </p>
          </div>
        </div>
        <ChevronDown className={`text-[var(--primary)] transition-transform ${open ? "rotate-180" : ""}`} size={20} />
      </button>

      {open && (
        <div className="border-t border-[var(--border)] bg-[#fafafa] p-4 space-y-4">
          <input
            ref={musicInputRef}
            type="file"
            accept="audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg,.mp3,.wav,.m4a,.aac,.ogg"
            onChange={onMusicInput}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => musicInputRef.current?.click()}
            className="btn-primary w-full inline-flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            Upload Music
          </button>

          {musicName && (
            <div className="rounded-xl border border-[var(--border)] bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{musicName}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Music will be added to the exported video.</p>
                </div>
                <button
                  type="button"
                  onClick={onRemoveMusic}
                  className="h-9 w-9 rounded-xl border border-red-200 bg-red-50 text-red-600 inline-flex items-center justify-center hover:bg-red-100 shrink-0"
                  title="Remove music"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {musicUrl && (
                <audio src={musicUrl} controls className="w-full mt-3" />
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => onMuteChange(!muteOriginalAudio)}
            className={`w-full rounded-xl border p-3 text-left transition ${
              muteOriginalAudio
                ? "border-[var(--primary)] bg-[#f4edff] text-[var(--primary)]"
                : "border-[var(--border)] bg-white hover:bg-[#f8f4ff]"
            }`}
          >
            <div className="flex items-center gap-2">
              {muteOriginalAudio ? <VolumeX size={18} /> : <Volume2 size={18} />}
              <span className="font-bold text-sm">
                {muteOriginalAudio ? "Original video audio muted" : "Keep original video audio"}
              </span>
            </div>
          </button>

          <label className="block">
            <span className="block text-sm font-bold mb-2">Music Volume: {musicVolume}%</span>
            <input
              type="range"
              min="0"
              max="150"
              value={musicVolume}
              onChange={(event) => onMusicVolumeChange(Number(event.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </label>

          {!muteOriginalAudio && (
            <label className="block">
              <span className="block text-sm font-bold mb-2">Original Audio Volume: {originalAudioVolume}%</span>
              <input
                type="range"
                min="0"
                max="150"
                value={originalAudioVolume}
                onChange={(event) => onOriginalVolumeChange(Number(event.target.value))}
                className="w-full accent-[var(--primary)]"
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

function TimelineEditor({
  timelineRef,
  clips,
  videos,
  totalDuration,
  pixelsPerSecond,
  hoverTimeline,
  playheadTime,
  selectedClipIds,
  dragClipId,
  onPointerMove,
  onPointerLeave,
  onTimelineClick,
  onSplitAtHover,
  onClipSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onPreview,
  onRemove,
  onTrimStart,
}) {
  const timelineWidth = Math.max(720, totalDuration * pixelsPerSecond + 40);
  const hoverClip = hoverTimeline.active ? findTimelineClipAtTime(clips, hoverTimeline.time) : null;

  return (
    <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white overflow-hidden">
      <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <MousePointer2 size={19} className="text-[var(--primary)]" />
          <div>
            <h3 className="font-bold">Editor Timeline</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Click to seek • Press <strong>S</strong> to split at mouse • Shift/Ctrl click to select multiple
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSplitAtHover}
          disabled={!hoverClip}
          className="btn-primary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-40"
        >
          <Scissors size={17} />
          Split at Mouse
        </button>
      </div>

      <div
        ref={timelineRef}
        className="timeline-scrollbar relative overflow-x-auto bg-[#111827] p-4"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onClick={onTimelineClick}
      >
        <div className="relative h-36 rounded-xl bg-[#1f2937] border border-white/10" style={{ width: timelineWidth }}>
          <TimeRuler totalDuration={totalDuration} pixelsPerSecond={pixelsPerSecond} />

          <div className="absolute left-0 right-0 top-10 h-20">
            {clips.map((clip) => (
              <TimelineClipBlock
                key={clip.id}
                clip={clip}
                sourceVideo={videos.find((video) => video.id === clip.videoId)}
                pixelsPerSecond={pixelsPerSecond}
                selected={selectedClipIds.includes(clip.id)}
                dragging={dragClipId === clip.id}
                onSelect={onClipSelect}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onPreview={onPreview}
                onRemove={onRemove}
                onTrimStart={onTrimStart}
              />
            ))}
          </div>

          {hoverTimeline.active && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-300 z-30 pointer-events-none"
              style={{ left: hoverTimeline.time * pixelsPerSecond }}
            >
              <div className="absolute -top-2 left-2 rounded-lg bg-yellow-300 text-black text-[11px] font-bold px-2 py-1 whitespace-nowrap shadow">
                {formatTime(hoverTimeline.time)} • S
              </div>
            </div>
          )}

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
            style={{ left: playheadTime * pixelsPerSecond }}
          />
        </div>
      </div>
    </div>
  );
}

function ZoomThumbnailSection({
  open,
  onToggle,
  timelineRef,
  clips,
  videos,
  selectedClipIds,
  dragClipId,
  zoom,
  pixelsPerSecond,
  totalDuration,
  onZoomChange,
  onClipSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onPreview,
  onRemove,
  onTrimStart,
}) {
  const zoomedPixelsPerSecond = pixelsPerSecond * 1.45;
  const width = Math.max(820, totalDuration * zoomedPixelsPerSecond + 40);

  return (
    <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[#fafafa] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-[#f8f4ff] transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f4edff] flex items-center justify-center shrink-0">
            <ZoomIn size={20} className="text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="font-bold">Zoom Thumbnail Section</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Zoom in for small clips, select multiple clips, trim edges, or delete precisely.
            </p>
          </div>
        </div>
        <ChevronDown className={`text-[var(--primary)] transition-transform ${open ? "rotate-180" : ""}`} size={20} />
      </button>

      {open && (
        <div className="border-t border-[var(--border)] p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => onZoomChange(Math.max(0.6, Number((zoom - 0.25).toFixed(2))))}
              className="small-action-btn"
              title="Zoom out timeline thumbnails"
            >
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min="0.6"
              max="4"
              step="0.1"
              value={zoom}
              onChange={(event) => onZoomChange(Number(event.target.value))}
              className="flex-1 accent-[var(--primary)]"
            />

            <button
              type="button"
              onClick={() => onZoomChange(Math.min(4, Number((zoom + 0.25).toFixed(2))))}
              className="small-action-btn"
              title="Zoom in timeline thumbnails"
            >
              <ZoomIn size={16} />
            </button>

            <span className="text-xs font-bold text-[var(--primary)] min-w-16 text-center">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div ref={timelineRef} className="timeline-scrollbar overflow-x-auto rounded-xl bg-white border border-[var(--border)] p-3">
            <div className="relative h-28" style={{ width }}>
              {clips.map((clip) => (
                <TimelineClipBlock
                  key={clip.id}
                  clip={clip}
                  sourceVideo={videos.find((video) => video.id === clip.videoId)}
                  pixelsPerSecond={zoomedPixelsPerSecond}
                  selected={selectedClipIds.includes(clip.id)}
                  dragging={dragClipId === clip.id}
                  compact
                  onSelect={onClipSelect}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onPreview={onPreview}
                  onRemove={onRemove}
                  onTrimStart={onTrimStart}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineClipBlock({
  clip,
  sourceVideo,
  pixelsPerSecond,
  selected,
  dragging,
  compact = false,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onPreview,
  onRemove,
  onTrimStart,
}) {
  const duration = getClipDuration(clip);
  const width = Math.max(compact ? 74 : 110, duration * pixelsPerSecond);
  const left = clip.timelineStart * pixelsPerSecond;
  const backgroundStyle = sourceVideo?.thumbnailUrl
    ? {
        backgroundImage: `linear-gradient(90deg, rgba(88,28,135,.72), rgba(17,24,39,.58)), url(${sourceVideo.thumbnailUrl})`,
        backgroundSize: compact ? "96px 100%, cover" : "120px 100%, cover",
        backgroundRepeat: "repeat, repeat",
      }
    : {};

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.stopPropagation();
        onDragStart(clip.id);
      }}
      onDragOver={onDragOver}
      onDrop={(event) => {
        event.stopPropagation();
        onDrop(clip.id);
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(clip.id, event);
      }}
      className={`absolute top-2 rounded-xl border text-white overflow-hidden shadow-lg cursor-grab select-none transition ${
        selected
          ? "border-yellow-300 ring-2 ring-yellow-300/70"
          : "border-white/20"
      } ${dragging ? "opacity-50" : ""}`}
      style={{
        left,
        width,
        height: compact ? 82 : 72,
        background: sourceVideo?.thumbnailUrl ? undefined : "linear-gradient(135deg,#7c3aed,#4338ca)",
        ...backgroundStyle,
      }}
      title="Click to select. Shift/Ctrl click for multiple selection. Drag edges to trim."
    >
      <button
        type="button"
        onPointerDown={(event) => onTrimStart(clip.id, "left", event)}
        className="absolute left-0 top-0 bottom-0 w-4 bg-white/25 hover:bg-yellow-300/80 cursor-ew-resize z-20"
        title="Trim start"
        aria-label="Trim clip start"
      />
      <button
        type="button"
        onPointerDown={(event) => onTrimStart(clip.id, "right", event)}
        className="absolute right-0 top-0 bottom-0 w-4 bg-white/25 hover:bg-yellow-300/80 cursor-ew-resize z-20"
        title="Trim end"
        aria-label="Trim clip end"
      />

      <div className="h-full px-5 py-2 flex flex-col justify-between bg-black/10">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-black truncate">Clip {clip.timelineIndex + 1}</p>
            <p className="text-[10px] opacity-90 truncate">{sourceVideo?.name || clip.videoName}</p>
          </div>
          {!compact && (
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onPreview(clip.id);
                }}
                className="h-7 w-7 rounded-lg bg-white/20 hover:bg-white/35 inline-flex items-center justify-center"
                title="Preview clip"
              >
                <Eye size={14} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(clip.id);
                }}
                className="h-7 w-7 rounded-lg bg-red-500/80 hover:bg-red-500 inline-flex items-center justify-center"
                title="Remove clip"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
        <p className="text-[10px] font-bold opacity-95">
          {formatTime(clip.start)} → {formatTime(clip.end)} • {formatTime(duration)}
        </p>
      </div>
    </div>
  );
}

function TimeRuler({ totalDuration, pixelsPerSecond }) {
  const interval = getRulerInterval(totalDuration);
  const ticks = [];

  for (let time = 0; time <= totalDuration + 0.01; time += interval) {
    ticks.push(time);
  }

  return (
    <div className="absolute top-0 left-0 right-0 h-10 border-b border-white/10">
      {ticks.map((time) => (
        <div
          key={time}
          className="absolute top-0 h-10 border-l border-white/20 text-[10px] text-white/70 pl-1 pt-1"
          style={{ left: time * pixelsPerSecond }}
        >
          {formatTime(time)}
        </div>
      ))}
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
  selected,
  onSelect,
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
      onClick={onSelect}
      className={`rounded-2xl border bg-white p-4 transition ${
        isDragging
          ? "border-[var(--primary)] opacity-60"
          : selected
            ? "border-[var(--primary)] bg-[#f4edff]"
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

function buildTimelineClips(clips) {
  let timelineStart = 0;

  return clips.map((clip, index) => {
    const duration = getClipDuration(clip);
    const timelineClip = {
      ...clip,
      timelineIndex: index,
      timelineStart,
      timelineEnd: timelineStart + duration,
    };

    timelineStart += duration;

    return timelineClip;
  });
}

function getTimelinePixelsPerSecond(zoom) {
  return 44 * clampNumber(Number(zoom || 1), 0.6, 4);
}

function findTimelineClipAtTime(clips, timelineTime) {
  return clips.find(
    (clip) =>
      timelineTime >= clip.timelineStart &&
      timelineTime <= clip.timelineEnd
  );
}

function getTimelinePointerData(event, timelineElement, pixelsPerSecond, totalDuration) {
  const rect = timelineElement.getBoundingClientRect();
  const x = clampNumber(
    event.clientX - rect.left + timelineElement.scrollLeft,
    0,
    Math.max(0, totalDuration * pixelsPerSecond)
  );

  return {
    x,
    time: clampNumber(x / Math.max(1, pixelsPerSecond), 0, totalDuration),
  };
}

function getRulerInterval(totalDuration) {
  if (totalDuration <= 20) return 2;
  if (totalDuration <= 60) return 5;
  if (totalDuration <= 180) return 10;
  if (totalDuration <= 600) return 30;
  return 60;
}

async function applyTextAndMusicExport({
  ffmpeg,
  inputName,
  outputName,
  textOverlays,
  musicFile,
  musicVolume,
  originalAudioVolume,
  muteOriginalAudio,
}) {
  const args = ["-i", inputName];
  let musicInputName = "";

  if (musicFile) {
    musicInputName = `music_${Date.now()}.${getSafeAudioExtension(getFileExtension(musicFile.name))}`;
    await safeDeleteFile(ffmpeg, musicInputName);
    await ffmpeg.writeFile(musicInputName, await fetchFile(musicFile));
    args.push("-i", musicInputName);
  }

  const hasText = textOverlays.length > 0;
  const filterParts = [];
  let videoMap = "0:v";
  let audioMap = "";

  if (hasText) {
    const drawTextChain = textOverlays
      .map((overlay) => buildDrawTextFilter(overlay))
      .filter(Boolean)
      .join(",");

    if (drawTextChain) {
      filterParts.push(`[0:v]${drawTextChain}[vout]`);
      videoMap = "[vout]";
    }
  }

  if (musicFile && muteOriginalAudio) {
    filterParts.push(`[1:a]volume=${Number(musicVolume || 100) / 100}[aout]`);
    audioMap = "[aout]";
  } else if (musicFile) {
    filterParts.push(`[0:a]volume=${Number(originalAudioVolume || 100) / 100}[a0];[1:a]volume=${Number(musicVolume || 100) / 100}[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=0[aout]`);
    audioMap = "[aout]";
  }

  if (filterParts.length) {
    args.push("-filter_complex", filterParts.join(";"));
  }

  args.push("-map", videoMap);

  if (audioMap) {
    args.push("-map", audioMap);
  } else if (muteOriginalAudio) {
    args.push("-an");
  } else {
    args.push("-map", "0:a?");
  }

  args.push(
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
    "-shortest",
    outputName
  );

  await safeDeleteFile(ffmpeg, outputName);
  await ffmpeg.exec(args);
}

function buildDrawTextFilter(overlay) {
  const safeText = escapeFfmpegDrawText(overlay.text);
  const color = normalizeHexColor(overlay.color || "#ffffff");
  const bgOpacity = clampNumber(Number(overlay.backgroundOpacity || 0), 0, 100) / 100;
  const boxColor = `${normalizeHexColor(overlay.backgroundColor || "#000000")}@${bgOpacity}`;
  const font = escapeFfmpegDrawText(overlay.fontFamily || "Arial");
  const size = clampNumber(Number(overlay.fontSize || 42), 8, 240);
  const start = Math.max(0, Number(overlay.start || 0));
  const end = Math.max(start + 0.1, Number(overlay.end || start + 5));

  const position = getDrawTextPosition(overlay);

  return [
    "drawtext=",
    `text='${safeText}'`,
    `font='${font}'`,
    `fontsize=${size}`,
    `fontcolor=${color}`,
    "borderw=2",
    "bordercolor=black@0.45",
    bgOpacity > 0 ? "box=1" : "box=0",
    `boxcolor=${boxColor}`,
    "boxborderw=14",
    `x=${position.x}`,
    `y=${position.y}`,
    `enable='between(t,${start},${end})'`,
  ].join(":");
}

function getDrawTextPosition(overlay) {
  if (overlay.position === "top") {
    return {
      x: "(w-text_w)/2",
      y: "h*0.10",
    };
  }

  if (overlay.position === "bottom") {
    return {
      x: "(w-text_w)/2",
      y: "h-text_h-h*0.10",
    };
  }

  if (overlay.position === "custom") {
    return {
      x: `(w-text_w)*${clampNumber(Number(overlay.xPercent || 50), 0, 100) / 100}`,
      y: `(h-text_h)*${clampNumber(Number(overlay.yPercent || 50), 0, 100) / 100}`,
    };
  }

  return {
    x: "(w-text_w)/2",
    y: "(h-text_h)/2",
  };
}

function escapeFfmpegDrawText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n");
}

function normalizeHexColor(value) {
  const clean = String(value || "#ffffff").trim();

  if (/^#[0-9a-f]{6}$/i.test(clean)) return clean;

  return "#ffffff";
}

function getSafeAudioExtension(extension) {
  const clean = String(extension || "mp3").toLowerCase().replace(/[^a-z0-9]/g, "");

  if (["mp3", "wav", "m4a", "aac", "ogg"].includes(clean)) {
    return clean;
  }

  return "mp3";
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

function generateVideoThumbnail(url, time = 0.1) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Thumbnail timeout."));
    }, 5000);

    function cleanup() {
      window.clearTimeout(timeout);
      video.pause();
      video.removeAttribute("src");
      video.load();
    }

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const safeTime = clampNumber(time, 0, Math.max(0, Number(video.duration || 0) - 0.05));
      video.currentTime = safeTime;
    };

    video.onseeked = () => {
      try {
        const width = 320;
        const ratio = (video.videoHeight || 180) / Math.max(1, video.videoWidth || 320);
        canvas.width = width;
        canvas.height = Math.max(120, Math.round(width * ratio));

        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          cleanup();
          if (!blob) {
            reject(new Error("No thumbnail."));
            return;
          }
          resolve(URL.createObjectURL(blob));
        }, "image/jpeg", 0.72);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Thumbnail failed."));
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

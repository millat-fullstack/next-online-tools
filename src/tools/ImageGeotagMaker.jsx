import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Upload,
  Download,
  MapPin,
  Navigation,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Image as ImageIcon,
  ShieldCheck,
  Info,
  LocateFixed,
  Map,
  Eye,
  Loader2,
  Globe2,
  BookOpen,
  ListChecks,
} from "lucide-react";
import exifr from "exifr";
import piexif from "piexifjs";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Image Geotag Maker",
  path: "/image-geotag-maker",
  category: "Image Tools",
  description:
    "Add, edit, read, or remove GPS location metadata from images online using a privacy-friendly browser-based image geotag tool.",
  metaTitle: "Image Geotag Maker | Add GPS Location to Photos Online",
  metaDescription:
    "Add geotag to images online for free. Upload a photo, enter GPS coordinates or use your current location, and download a geotagged image instantly.",
};

const SITE_URL = "https://nextonlinetools.com";
const canonicalUrl = `${SITE_URL}${toolData.path.startsWith("/tool") ? toolData.path : `/tool${toolData.path}`}`;

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const OUTPUT_QUALITY = 0.94;

const POPULAR_LOCATION_EXAMPLES = [
  { label: "New York", latitude: "40.7128", longitude: "-74.0060" },
  { label: "London", latitude: "51.5074", longitude: "-0.1278" },
  { label: "Dubai", latitude: "25.2048", longitude: "55.2708" },
  { label: "Singapore", latitude: "1.3521", longitude: "103.8198" },
  { label: "Toronto", latitude: "43.6532", longitude: "-79.3832" },
  { label: "Sydney", latitude: "-33.8688", longitude: "151.2093" },
];

export default function ImageGeotagMaker() {
  const fileInputRef = useRef(null);
  const imageUrlRef = useRef("");
  const outputUrlRef = useRef("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imageInfo, setImageInfo] = useState(null);
  const [existingGps, setExistingGps] = useState(null);
  const [metadataStatus, setMetadataStatus] = useState("waiting");

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [accuracy, setAccuracy] = useState(null);
  const [coordinateInput, setCoordinateInput] = useState("");

  const [outputMode, setOutputMode] = useState("add");
  const [outputFileName, setOutputFileName] = useState("geotagged-image.jpg");
  const [outputPreviewUrl, setOutputPreviewUrl] = useState("");
  const [outputSize, setOutputSize] = useState(0);
  const [processingTimeMs, setProcessingTimeMs] = useState(0);

  const [extraDetails, setExtraDetails] = useState({
    title: "",
    subject: "",
    rating: "",
    tags: "",
    comments: "",
    authors: "",
    dateTaken: "",
    programName: "",
    dateAcquired: "",
    copyright: "",
  });

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isReadingMetadata, setIsReadingMetadata] = useState(false);
  const [isUsingLocation, setIsUsingLocation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const hasImage = Boolean(imageFile && imagePreviewUrl);
  const isJpeg = Boolean(imageFile?.type === "image/jpeg" || /\.jpe?g$/i.test(imageFile?.name || ""));

  const latNumber = Number(latitude);
  const lngNumber = Number(longitude);

  const coordinateError = useMemo(() => {
    if (!latitude.trim() && !longitude.trim()) return "";

    if (!Number.isFinite(latNumber) || latNumber < -90 || latNumber > 90) {
      return "Latitude must be a number between -90 and 90.";
    }

    if (!Number.isFinite(lngNumber) || lngNumber < -180 || lngNumber > 180) {
      return "Longitude must be a number between -180 and 180.";
    }

    return "";
  }, [latitude, longitude, latNumber, lngNumber]);

  const hasValidCoordinates = Boolean(
    latitude.trim() &&
      longitude.trim() &&
      !coordinateError &&
      Number.isFinite(latNumber) &&
      Number.isFinite(lngNumber)
  );

  const mapsUrl = hasValidCoordinates
    ? `https://www.google.com/maps?q=${encodeURIComponent(`${latNumber},${lngNumber}`)}`
    : "";

  const hasExtraDetails = useMemo(() => {
    return Object.values(extraDetails).some((value) => String(value || "").trim());
  }, [extraDetails]);

  const seoJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Image Geotag Maker",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      "@id": canonicalUrl,
      url: canonicalUrl,
      description:
        "Add, edit, read, or remove GPS location metadata from images online using a browser-based image geotag tool.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Add GPS geotag to image",
        "Read existing image GPS metadata",
        "Remove GPS metadata from photo",
        "Use current location with browser permission",
        "Manual latitude and longitude input",
        "Download geotagged JPG image",
      ],
    };
  }, []);

  const faqJsonLd = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is an image geotag?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "An image geotag is GPS location metadata stored inside an image file. It can include latitude and longitude coordinates.",
          },
        },
        {
          "@type": "Question",
          name: "Can I add GPS location to a photo online?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Upload a photo, enter latitude and longitude, or use your current location, then download the geotagged image.",
          },
        },
        {
          "@type": "Question",
          name: "Are my images uploaded to a server?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. This tool processes your image in your browser. Your uploaded and edited images are not uploaded to our server.",
          },
        },
        {
          "@type": "Question",
          name: "Can I remove geotag from a photo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can remove GPS metadata from a JPG image and download a copy without geotag data.",
          },
        },
      ],
    };
  }, []);

  const handleImageFile = useCallback(async (file) => {
    setErrorMessage("");
    setSuccessMessage("");
    setCopied(false);
    clearOutput();

    const validationError = validateImageFile(file);

    if (validationError) {
      setErrorMessage(validationError);
      resetFileInput();
      return;
    }

    setIsReadingMetadata(true);
    setMetadataStatus("reading");

    try {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }

      const previewUrl = URL.createObjectURL(file);
      imageUrlRef.current = previewUrl;

      const imageElement = await loadImage(previewUrl);
      const naturalWidth = imageElement.naturalWidth || imageElement.width;
      const naturalHeight = imageElement.naturalHeight || imageElement.height;
      const gps = await readGpsMetadata(file);

      setImageFile(file);
      setImagePreviewUrl(previewUrl);
      setImageInfo({
        name: file.name || "image",
        size: file.size,
        type: file.type || "image",
        width: naturalWidth,
        height: naturalHeight,
      });
      setOutputFileName(`${getFileBaseName(file.name || "image")}-geotagged.jpg`);

      if (gps) {
        setExistingGps(gps);
        setLatitude(formatCoordinate(gps.latitude));
        setLongitude(formatCoordinate(gps.longitude));
        setMetadataStatus("found");
        setSuccessMessage("Existing GPS metadata found. You can edit it or remove it.");
      } else {
        setExistingGps(null);
        setLatitude("");
        setLongitude("");
        setMetadataStatus("not-found");
        setSuccessMessage("Image loaded. No GPS metadata found in this image.");
      }

      setLocationLabel("");
      setAccuracy(null);
      setCoordinateInput("");
      setOutputMode("add");
    } catch {
      setErrorMessage("Could not load or read this image. Please try another image.");
      setImageFile(null);
      setImagePreviewUrl("");
      setImageInfo(null);
      setExistingGps(null);
      setMetadataStatus("error");
    } finally {
      setIsReadingMetadata(false);
      resetFileInput();
    }
  }, []);

  useEffect(() => {
    function handlePaste(event) {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type?.startsWith("image/"));

      if (!imageItem) return;

      const file = imageItem.getAsFile();

      if (file) {
        handleImageFile(file);
      }
    }

    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handleImageFile]);

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }

      if (outputUrlRef.current) {
        URL.revokeObjectURL(outputUrlRef.current);
      }
    };
  }, []);

  function clearOutput() {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = "";
    }

    setOutputPreviewUrl("");
    setOutputSize(0);
    setProcessingTimeMs(0);
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleFileInputChange(event) {
    const file = event.target.files?.[0];

    if (file) {
      handleImageFile(file);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDraggingFile(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleImageFile(file);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    setIsDraggingFile(true);
  }

  function handleDragLeave() {
    setIsDraggingFile(false);
  }

  function applySampleLocation(location) {
    setLatitude(location.latitude);
    setLongitude(location.longitude);
    setLocationLabel(location.label);
    setAccuracy(null);
    setCoordinateInput(`${location.latitude}, ${location.longitude}`);
    setSuccessMessage(`${location.label} example coordinates added. Review and use only if this is the correct image location.`);
    setErrorMessage("");
    clearOutput();
  }

  function applyCoordinateInput() {
    setErrorMessage("");
    setSuccessMessage("");

    const parsed = parseCoordinatesFromText(coordinateInput);

    if (!parsed) {
      setErrorMessage(
        "Could not find valid GPS coordinates. Paste coordinates like 23.8103, 90.4125 or a Google Maps URL."
      );
      return;
    }

    setLatitude(formatCoordinate(parsed.latitude));
    setLongitude(formatCoordinate(parsed.longitude));
    setLocationLabel("Pasted coordinates");
    setAccuracy(null);
    setOutputMode("add");
    setSuccessMessage("GPS coordinates applied. Review the location before downloading.");
    clearOutput();
  }

  function openGoogleMapsToFindCoordinates() {
    window.open("https://www.google.com/maps", "_blank", "noopener,noreferrer");
  }

  function useExistingGps() {
    if (!existingGps) {
      setErrorMessage("No existing GPS metadata found in this image.");
      return;
    }

    setLatitude(formatCoordinate(existingGps.latitude));
    setLongitude(formatCoordinate(existingGps.longitude));
    setLocationLabel("Existing image location");
    setAccuracy(null);
    setSuccessMessage("Existing GPS coordinates loaded into the editor.");
    setErrorMessage("");
    clearOutput();
  }

  function clearCoordinates() {
    setLatitude("");
    setLongitude("");
    setLocationLabel("");
    setAccuracy(null);
    setCoordinateInput("");
    setSuccessMessage("Coordinates cleared.");
    setErrorMessage("");
    clearOutput();
  }

  function updateExtraDetail(key, value) {
    setExtraDetails((current) => ({
      ...current,
      [key]: value,
    }));
    clearOutput();
  }

  function clearExtraDetails() {
    setExtraDetails({
      title: "",
      subject: "",
      rating: "",
      tags: "",
      comments: "",
      authors: "",
      dateTaken: "",
      programName: "",
      dateAcquired: "",
      copyright: "",
    });
    clearOutput();
    setSuccessMessage("Optional image details cleared.");
    setErrorMessage("");
  }

  function getCurrentLocation() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!navigator.geolocation) {
      setErrorMessage("Your browser does not support current location access.");
      return;
    }

    setIsUsingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng, accuracy: locationAccuracy } = position.coords;

        setLatitude(formatCoordinate(lat));
        setLongitude(formatCoordinate(lng));
        setCoordinateInput(`${formatCoordinate(lat)}, ${formatCoordinate(lng)}`);
        setAccuracy(locationAccuracy ? Math.round(locationAccuracy) : null);
        setLocationLabel("Current location");
        setOutputMode("add");
        setSuccessMessage("Current location added. Review the coordinates before downloading.");
        setIsUsingLocation(false);
        clearOutput();
      },
      () => {
        setErrorMessage("Location permission was denied or unavailable.");
        setIsUsingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  async function copyCoordinates() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!hasValidCoordinates) {
      setErrorMessage("Please enter valid latitude and longitude first.");
      return;
    }

    try {
      await copyToClipboard(`${formatCoordinate(latNumber)}, ${formatCoordinate(lngNumber)}`);
      setCopied(true);
      setSuccessMessage("Coordinates copied successfully.");

      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setErrorMessage("Copy failed. Please copy the coordinates manually.");
    }
  }

  async function createOutput({ mode = outputMode, downloadAfterCreate = true } = {}) {
    setErrorMessage("");
    setSuccessMessage("");
    setCopied(false);

    if (!hasImage || !imageFile) {
      setErrorMessage("Please upload an image first.");
      return;
    }

    if (mode !== "remove" && !hasValidCoordinates) {
      setErrorMessage(coordinateError || "Please enter valid latitude and longitude.");
      return;
    }

    if (!isJpeg) {
      setSuccessMessage("This file will be converted to JPG because GPS EXIF works best with JPG/JPEG images.");
    }

    setIsProcessing(true);
    const processingStartedAt = performance.now();

    try {
      const originalDataUrl = await readFileAsDataUrl(imageFile);
      const jpegDataUrl = isJpeg ? originalDataUrl : await convertImageToJpeg(imagePreviewUrl);

      let outputDataUrl;

      if (mode === "remove") {
        outputDataUrl = removeGpsFromJpeg(jpegDataUrl);
      } else {
        outputDataUrl = addGpsToJpeg(jpegDataUrl, latNumber, lngNumber, extraDetails);
      }

      const blob = dataUrlToBlob(outputDataUrl);

      if (outputUrlRef.current) {
        URL.revokeObjectURL(outputUrlRef.current);
      }

      const url = URL.createObjectURL(blob);
      outputUrlRef.current = url;

      setOutputPreviewUrl(url);
      setOutputSize(blob.size);
      setProcessingTimeMs(Math.max(1, Math.round(performance.now() - processingStartedAt)));
      setOutputMode(mode);
      setOutputFileName((current) => {
        const baseName = getFileBaseName(current || imageInfo?.name || "image");
        return mode === "remove" ? `${baseName.replace(/-geotagged$/, "")}-without-geotag.jpg` : `${baseName.replace(/-without-geotag$/, "")}.jpg`;
      });

      setSuccessMessage(
        mode === "remove"
          ? "GPS metadata removed. Your image is ready to download."
          : hasExtraDetails
            ? "GPS geotag and optional image details added. Your image is ready to download."
            : "GPS geotag added. Your image is ready to download."
      );

      if (downloadAfterCreate) {
        downloadBlob(blob, normalizeFileName(outputFileName || getSafeOutputFileName(mode)));
      }
    } catch {
      setErrorMessage(
        "Could not create the edited image. Please try a JPG/JPEG image or another file."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function downloadCurrentOutput() {
    if (!outputPreviewUrl) {
      createOutput({ downloadAfterCreate: true });
      return;
    }

    const link = document.createElement("a");
    link.href = outputPreviewUrl;
    link.download = normalizeFileName(outputFileName || getSafeOutputFileName(outputMode));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getSafeOutputFileName(mode = outputMode) {
    const base = getFileBaseName(imageInfo?.name || "image");
    return mode === "remove" ? `${base}-without-geotag.jpg` : `${base}-geotagged.jpg`;
  }

  async function resetTool() {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = "";
    }

    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = "";
    }

    setImageFile(null);
    setImagePreviewUrl("");
    setImageInfo(null);
    setExistingGps(null);
    setMetadataStatus("waiting");
    setLatitude("");
    setLongitude("");
    setLocationLabel("");
    setAccuracy(null);
    setCoordinateInput("");
    setOutputMode("add");
    setOutputFileName("geotagged-image.jpg");
    setOutputPreviewUrl("");
    setOutputSize(0);
    setProcessingTimeMs(0);
    setExtraDetails({
      title: "",
      subject: "",
      rating: "",
      tags: "",
      comments: "",
      authors: "",
      dateTaken: "",
      programName: "",
      dateAcquired: "",
      copyright: "",
    });
    setIsDraggingFile(false);
    setIsReadingMetadata(false);
    setIsUsingLocation(false);
    setIsProcessing(false);
    setCopied(false);
    setErrorMessage("");
    setSuccessMessage("");
    resetFileInput();
  }

  return (
    <div className="flex flex-col gap-8">
      <Helmet>
        <title>{toolData.metaTitle}</title>
        <meta name="description" content={toolData.metaDescription} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={toolData.metaTitle} />
        <meta property="og:description" content={toolData.metaDescription} />
        <meta property="og:url" content={canonicalUrl} />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={toolData.metaTitle} />
        <meta name="twitter:description" content={toolData.metaDescription} />

        <script type="application/ld+json">{JSON.stringify(seoJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <MapPin size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Image Geotag Maker</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Add, edit, read, or remove GPS location metadata from your images.
          Upload a photo, enter latitude and longitude, use your current location,
          and download a geotagged image directly from your browser.
        </p>
      </section>

      <section className="card p-4 sm:p-6">
        <div className="flex flex-col gap-5">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 ${
              isDraggingFile ? "ring-2 ring-[var(--primary)] bg-[#f8f4ff]" : ""
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ImageIcon size={21} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-bold">Image Preview</h2>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Upload or drop an image, then add, edit, or remove GPS metadata.
                </p>
              </div>

              <button
                type="button"
                onClick={openFilePicker}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                {isReadingMetadata ? <Loader2 size={17} className="animate-spin" /> : <Upload size={17} />}
                {hasImage ? "Change Image" : "Upload Image"}
              </button>
            </div>

            <div
              onClick={!hasImage ? openFilePicker : undefined}
              className={`min-h-[280px] rounded-2xl border border-dashed flex items-center justify-center overflow-auto p-4 transition ${
                !hasImage ? "cursor-pointer border-[var(--border)] hover:bg-[#f8f4ff]" : "border-[var(--border)] bg-[#fafafa]"
              }`}
            >
              {hasImage ? (
                <img
                  src={outputPreviewUrl || imagePreviewUrl}
                  alt="Uploaded preview"
                  className="max-w-full max-h-[360px] object-contain bg-white"
                />
              ) : (
                <div className="text-center text-[var(--text-secondary)] max-w-md">
                  {isReadingMetadata ? (
                    <Loader2 size={58} className="mx-auto mb-4 text-[var(--primary)] animate-spin" />
                  ) : (
                    <Upload size={58} className="mx-auto mb-4 text-gray-300" />
                  )}
                  <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">
                    Upload, drop, or paste image
                  </h3>
                  <p className="text-sm leading-6">
                    Supports JPG, PNG, and WEBP. GPS writing works best with JPG/JPEG.
                    Max file size: <strong>{MAX_FILE_SIZE_MB} MB</strong>.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f4edff] border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                <ShieldCheck size={14} /> Browser based
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                <MapPin size={14} />
                {metadataStatus === "found"
                  ? "Existing GPS found"
                  : metadataStatus === "not-found"
                    ? "No GPS found"
                    : metadataStatus === "reading"
                      ? "Reading GPS..."
                      : "Upload image to check GPS"}
              </span>
              {hasImage && !isJpeg && (
                <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1 text-xs font-semibold text-yellow-800">
                  <Info size={14} /> Will convert to JPG for GPS metadata
                </span>
              )}
            </div>
          </div>

          {(errorMessage || successMessage) && (
            <div className="grid md:grid-cols-2 gap-3">
              {errorMessage && (
                <div className="flex items-start gap-3 text-sm text-red-700 bg-red-50 border border-red-100 p-4 rounded-xl">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-3 text-sm text-green-700 bg-green-50 border border-green-100 p-4 rounded-xl">
                  <CheckCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{successMessage}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-5">
            <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <LocateFixed size={21} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-bold">GPS Coordinates</h2>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Paste a Google Maps link, type coordinates, or use your current location.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openGoogleMapsToFindCoordinates}
                  className="btn-secondary inline-flex items-center justify-center gap-2 shrink-0"
                >
                  <Map size={17} />
                  Open Google Maps
                </button>
              </div>

              <div className="grid lg:grid-cols-[1fr_auto] gap-3 mb-4">
                <textarea
                  rows="3"
                  value={coordinateInput}
                  onChange={(event) => setCoordinateInput(event.target.value)}
                  placeholder="Paste coordinates or Google Maps URL, e.g. 40.7128, -74.0060"
                  className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)] resize-none"
                />
                <button
                  type="button"
                  onClick={applyCoordinateInput}
                  className="btn-primary inline-flex items-center justify-center gap-2 lg:min-w-[150px]"
                >
                  <MapPin size={17} />
                  Apply GPS
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(event) => {
                      setLatitude(event.target.value);
                      clearOutput();
                    }}
                    placeholder="40.7128"
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(event) => {
                      setLongitude(event.target.value);
                      clearOutput();
                    }}
                    placeholder="-74.0060"
                    className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {coordinateError && (
                <p className="text-sm text-red-700 mt-3">{coordinateError}</p>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isUsingLocation}
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  {isUsingLocation ? <Loader2 size={17} className="animate-spin" /> : <Navigation size={17} />}
                  {isUsingLocation ? "Getting Location..." : "Use My Location"}
                </button>

                <button
                  type="button"
                  onClick={useExistingGps}
                  disabled={!existingGps}
                  className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                    !existingGps ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <MapPin size={17} />
                  Use Existing GPS
                </button>

                <button
                  type="button"
                  onClick={copyCoordinates}
                  disabled={!hasValidCoordinates}
                  className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                    !hasValidCoordinates ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {copied ? <Check size={17} /> : <Copy size={17} />}
                  Copy GPS
                </button>

                {hasValidCoordinates && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary inline-flex items-center justify-center gap-2"
                  >
                    <Map size={17} />
                    View on Map
                  </a>
                )}

                <button
                  type="button"
                  onClick={clearCoordinates}
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  <RotateCcw size={17} />
                  Clear GPS
                </button>
              </div>

              {hasValidCoordinates && (
                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">Selected GPS</p>
                  <p className="font-bold text-[var(--primary)] break-all">
                    {formatCoordinate(latNumber)}, {formatCoordinate(lngNumber)}
                  </p>
                  {locationLabel && (
                    <p className="text-xs text-[var(--text-secondary)] mt-2">
                      Source: <strong>{locationLabel}</strong>
                      {accuracy ? ` • Accuracy around ${accuracy}m` : ""}
                    </p>
                  )}
                </div>
              )}

              <details className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
                <summary className="cursor-pointer font-semibold text-sm">
                  Optional coordinate examples
                </summary>
                <div className="flex flex-wrap gap-2 mt-3">
                  {POPULAR_LOCATION_EXAMPLES.map((location) => (
                    <button
                      key={location.label}
                      type="button"
                      onClick={() => applySampleLocation(location)}
                      className="px-3 py-2 rounded-xl border border-[var(--border)] bg-white hover:bg-[#f4edff] text-sm font-semibold"
                    >
                      {location.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-2 leading-5">
                  Examples are only for testing. Use the real location of your own image.
                </p>
              </details>

              <details className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
                <summary className="cursor-pointer font-semibold text-sm">
                  Optional image details {hasExtraDetails ? "• Added" : ""}
                </summary>

                <p className="text-xs text-[var(--text-secondary)] mt-3 leading-5">
                  Add extra image information such as title, author, tags, comments, and copyright.
                  Supported fields are written into JPG metadata where EXIF supports them. Rating and date acquired may depend on the viewer app.
                </p>

                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  <ExtraDetailInput
                    label="Title"
                    value={extraDetails.title}
                    onChange={(value) => updateExtraDetail("title", value)}
                    placeholder="Image title"
                  />

                  <ExtraDetailInput
                    label="Subject"
                    value={extraDetails.subject}
                    onChange={(value) => updateExtraDetail("subject", value)}
                    placeholder="Short subject"
                  />

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Rating</label>
                    <select
                      value={extraDetails.rating}
                      onChange={(event) => updateExtraDetail("rating", event.target.value)}
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                    >
                      <option value="">No rating</option>
                      <option value="1">1 Star</option>
                      <option value="2">2 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="5">5 Stars</option>
                    </select>
                  </div>

                  <ExtraDetailInput
                    label="Tags"
                    value={extraDetails.tags}
                    onChange={(value) => updateExtraDetail("tags", value)}
                    placeholder="business, travel, inspection"
                  />

                  <ExtraDetailInput
                    label="Authors"
                    value={extraDetails.authors}
                    onChange={(value) => updateExtraDetail("authors", value)}
                    placeholder="Author or photographer"
                  />

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Date Taken</label>
                    <input
                      type="datetime-local"
                      value={extraDetails.dateTaken}
                      onChange={(event) => updateExtraDetail("dateTaken", event.target.value)}
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <ExtraDetailInput
                    label="Program Name"
                    value={extraDetails.programName}
                    onChange={(value) => updateExtraDetail("programName", value)}
                    placeholder="NextOnlineTools"
                  />

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Date Acquired</label>
                    <input
                      type="date"
                      value={extraDetails.dateAcquired}
                      onChange={(event) => updateExtraDetail("dateAcquired", event.target.value)}
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <ExtraDetailInput
                    label="Copyright"
                    value={extraDetails.copyright}
                    onChange={(value) => updateExtraDetail("copyright", value)}
                    placeholder="© Your name or company"
                  />

                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold mb-2 block">Comments</label>
                    <textarea
                      rows="3"
                      value={extraDetails.comments}
                      onChange={(event) => updateExtraDetail("comments", event.target.value)}
                      placeholder="Add optional notes or comments"
                      className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)] resize-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearExtraDetails}
                  className="btn-secondary mt-4 inline-flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  Clear Optional Details
                </button>
              </details>
            </div>

            <div className="flex flex-col gap-4">
              <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <Download size={21} className="text-[var(--primary)]" />
                  <h2 className="text-xl font-bold">Create & Download</h2>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[#fafafa] p-4 mb-4">
                  <p className="text-xs text-[var(--text-secondary)] mb-1">GPS status</p>
                  <p className="font-bold">
                    {metadataStatus === "found"
                      ? "This image already has GPS data."
                      : metadataStatus === "not-found"
                        ? "No GPS data found in this image."
                        : metadataStatus === "reading"
                          ? "Reading image metadata..."
                          : "Upload an image to check GPS."}
                  </p>
                  {existingGps && (
                    <p className="text-xs text-[var(--text-secondary)] mt-2 break-all">
                      Existing: {formatCoordinate(existingGps.latitude)}, {formatCoordinate(existingGps.longitude)}
                    </p>
                  )}
                </div>

                <label className="text-sm font-semibold mb-2 block">Output File Name</label>
                <input
                  type="text"
                  value={outputFileName}
                  onChange={(event) => setOutputFileName(event.target.value)}
                  className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)] mb-4"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => createOutput({ mode: "add", downloadAfterCreate: true })}
                    disabled={!hasImage || !hasValidCoordinates || isProcessing}
                    className={`btn-primary inline-flex items-center justify-center gap-2 ${
                      !hasImage || !hasValidCoordinates || isProcessing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isProcessing && outputMode !== "remove" ? <Loader2 size={17} className="animate-spin" /> : <MapPin size={17} />}
                    Add Geotag
                  </button>

                  <button
                    type="button"
                    onClick={() => createOutput({ mode: "remove", downloadAfterCreate: true })}
                    disabled={!hasImage || isProcessing}
                    className={`btn-secondary inline-flex items-center justify-center gap-2 ${
                      !hasImage || isProcessing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isProcessing && outputMode === "remove" ? <Loader2 size={17} className="animate-spin" /> : <Trash2 size={17} />}
                    Remove GPS
                  </button>
                </div>

                {isProcessing && (
                  <div className="mt-3 rounded-xl border border-[var(--border)] bg-[#f8f4ff] p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                      <Loader2 size={16} className="animate-spin" />
                      Processing image metadata...
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Processing time will appear after the file is ready.
                    </p>
                  </div>
                )}

                {outputPreviewUrl && (
                  <button
                    type="button"
                    onClick={downloadCurrentOutput}
                    className="btn-primary w-full mt-3 inline-flex items-center justify-center gap-2"
                  >
                    <Download size={17} />
                    Download Again
                  </button>
                )}

                {(processingTimeMs > 0 || outputSize > 0) && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <MiniStat label="Processing Time" value={processingTimeMs ? `${(processingTimeMs / 1000).toFixed(2)}s` : "-"} />
                    <MiniStat label="Output Size" value={outputSize ? formatBytes(outputSize) : "-"} />
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={19} className="text-yellow-800 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 leading-6">
                    Privacy warning: Geotagged images may reveal location information when shared.
                    Share only if you are comfortable exposing that location.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetTool}
                className="btn-secondary w-full inline-flex items-center justify-center gap-2"
              >
                <RotateCcw size={17} />
                Reset Tool
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">Add GPS Location to Images Online</h2>
        </div>

        <div className="text-[var(--text-secondary)] leading-7 space-y-4">
          <p>
            Image Geotag Maker helps you add, edit, read, or remove GPS metadata from photos.
            You can enter latitude and longitude manually, use your browser’s current location,
            or load existing GPS data found inside a JPG image.
          </p>

          <p>
            This tool is useful for real estate photos, travel images, local business photos,
            field visit images, inspection photos, construction progress photos, and privacy checks
            before sharing an image online.
          </p>

          <p>
            Please use this tool only for images you own or have permission to edit. Do not use it
            to create false location claims, fake evidence, misleading business information, or deceptive content.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <InfoBox
            title="Add Geotag"
            text="Enter latitude and longitude or use current location to add GPS metadata to your image."
          />
          <InfoBox
            title="Read GPS Metadata"
            text="Check whether your uploaded image already contains GPS location metadata."
          />
          <InfoBox
            title="Remove Geotag"
            text="Create a JPG copy without GPS metadata before sharing private images."
          />
        </div>
      </section>

      <section className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <ListChecks size={22} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-bold">Image Geotag Maker FAQ</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FaqItem
            question="What is an image geotag?"
            answer="An image geotag is GPS location metadata stored inside an image file. It usually contains latitude and longitude coordinates."
          />
          <FaqItem
            question="Can I add GPS location to a photo?"
            answer="Yes. Upload an image, enter latitude and longitude, or use your current location, then download the geotagged image."
          />
          <FaqItem
            question="Are my images uploaded to your server?"
            answer="No. The tool works in your browser. Your uploaded images, edited images, and GPS coordinates are not uploaded to our server."
          />
          <FaqItem
            question="Can I remove GPS location from a photo?"
            answer="Yes. Use the Remove GPS option to download a JPG copy without GPS location metadata."
          />
          <FaqItem
            question="Does this work with PNG or WEBP?"
            answer="The tool can preview common image formats, but GPS EXIF metadata works best with JPG/JPEG. PNG or WEBP files may be converted to JPG for geotagging."
          />
          <FaqItem
            question="Can others see my geotag after I share the image?"
            answer="Yes. If the downloaded image contains GPS metadata, someone with metadata-reading software may be able to see the location."
          />
        </div>
      </section>

      <SuggestedTools currentToolId="image-geotag-maker" />
    </div>
  );
}

function StatusCard({ icon: Icon, title, text }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-4 bg-white">
      <Icon size={22} className="text-[var(--primary)] mb-2" />
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-xs text-[var(--text-secondary)] leading-5">{text}</p>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-4 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="font-bold text-[var(--primary)] break-all">{value}</p>
    </div>
  );
}

function InfoBox({ title, text }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-6">{text}</p>
    </div>
  );
}

function FaqItem({ question, answer }) {
  return (
    <div className="border border-[var(--border)] rounded-2xl p-5 bg-white">
      <h3 className="font-semibold mb-2">{question}</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-6">{answer}</p>
    </div>
  );
}

function ExtraDetailInput({ label, value, onChange, placeholder = "" }) {
  return (
    <div>
      <label className="text-sm font-semibold mb-2 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full border border-[var(--border)] rounded-xl px-4 py-3 bg-white outline-none focus:border-[var(--primary)]"
      />
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[#f8f4ff] p-3 text-center">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <p className="font-bold text-[var(--primary)] break-all">{value}</p>
    </div>
  );
}

function parseCoordinatesFromText(text) {
  const value = String(text || "").trim();

  if (!value) return null;

  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&]query=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (!match) continue;

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      return { latitude, longitude };
    }
  }

  return null;
}

function validateImageFile(file) {
  if (!file) return "Please upload an image file.";

  if (!file.type.startsWith("image/")) {
    return "Please upload a valid image file.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Image must be under ${MAX_FILE_SIZE_MB} MB.`;
  }

  return "";
}

async function readGpsMetadata(file) {
  try {
    const gps = await exifr.gps(file);

    if (!gps || !Number.isFinite(gps.latitude) || !Number.isFinite(gps.longitude)) {
      return null;
    }

    return {
      latitude: gps.latitude,
      longitude: gps.longitude,
    };
  } catch {
    return null;
  }
}


const IMAGE_IFD_TAGS = {
  ImageDescription: 270,
  Software: 305,
  Artist: 315,
  Copyright: 33432,
  XPTitle: 40091,
  XPComment: 40092,
  XPAuthor: 40093,
  XPKeywords: 40094,
  XPSubject: 40095,
};

const EXIF_IFD_TAGS = {
  DateTimeOriginal: 36867,
  DateTimeDigitized: 36868,
};

function applyOptionalImageDetails(exifObj, details = {}) {
  exifObj["0th"] = exifObj["0th"] || {};
  exifObj.Exif = exifObj.Exif || {};

  const title = cleanMetadataText(details.title);
  const subject = cleanMetadataText(details.subject);
  const rating = cleanMetadataText(details.rating);
  const tags = cleanMetadataText(details.tags);
  const comments = cleanMetadataText(details.comments);
  const authors = cleanMetadataText(details.authors);
  const dateTaken = formatExifDateTime(details.dateTaken);
  const programName = cleanMetadataText(details.programName);
  const dateAcquired = formatExifDateTime(details.dateAcquired);
  const copyright = cleanMetadataText(details.copyright);

  if (title) {
    exifObj["0th"][IMAGE_IFD_TAGS.ImageDescription] = title;
    exifObj["0th"][IMAGE_IFD_TAGS.XPTitle] = stringToUtf16Bytes(title);
  }

  if (subject) {
    exifObj["0th"][IMAGE_IFD_TAGS.XPSubject] = stringToUtf16Bytes(subject);
  }

  if (tags) {
    exifObj["0th"][IMAGE_IFD_TAGS.XPKeywords] = stringToUtf16Bytes(tags);
  }

  const fullComment = [
    comments,
    rating ? `Rating: ${rating}/5` : "",
    dateAcquired ? `Date acquired: ${dateAcquired}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  if (fullComment) {
    exifObj["0th"][IMAGE_IFD_TAGS.XPComment] = stringToUtf16Bytes(fullComment);
  }

  if (authors) {
    exifObj["0th"][IMAGE_IFD_TAGS.Artist] = authors;
    exifObj["0th"][IMAGE_IFD_TAGS.XPAuthor] = stringToUtf16Bytes(authors);
  }

  if (programName) {
    exifObj["0th"][IMAGE_IFD_TAGS.Software] = programName;
  }

  if (dateTaken) {
    exifObj.Exif[EXIF_IFD_TAGS.DateTimeOriginal] = dateTaken;
    exifObj.Exif[EXIF_IFD_TAGS.DateTimeDigitized] = dateTaken;
  }

  if (copyright) {
    exifObj["0th"][IMAGE_IFD_TAGS.Copyright] = copyright;
  }

  return exifObj;
}

function cleanMetadataText(value) {
  return String(value || "").trim().slice(0, 500);
}

function stringToUtf16Bytes(value) {
  const output = [];
  const text = String(value || "");

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    output.push(code & 0xff, code >> 8);
  }

  output.push(0, 0);
  return output;
}

function formatExifDateTime(value) {
  const text = String(value || "").trim();

  if (!text) return "";

  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnly) {
    return `${dateOnly[1]}:${dateOnly[2]}:${dateOnly[3]} 00:00:00`;
  }

  const dateTime = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);

  if (dateTime) {
    return `${dateTime[1]}:${dateTime[2]}:${dateTime[3]} ${dateTime[4]}:${dateTime[5]}:${dateTime[6] || "00"}`;
  }

  return "";
}

function addGpsToJpeg(dataUrl, latitude, longitude, extraDetails = {}) {
  const cleanDataUrl = ensureJpegDataUrl(dataUrl);
  let exifObj;

  try {
    exifObj = piexif.load(cleanDataUrl);
  } catch {
    exifObj = { "0th": {}, Exif: {}, GPS: {}, "1st": {}, thumbnail: null };
  }

  exifObj.GPS = exifObj.GPS || {};

  const latRef = latitude >= 0 ? "N" : "S";
  const lngRef = longitude >= 0 ? "E" : "W";

  exifObj.GPS[piexif.GPSIFD.GPSLatitudeRef] = latRef;
  exifObj.GPS[piexif.GPSIFD.GPSLatitude] = decimalToDmsRational(Math.abs(latitude));
  exifObj.GPS[piexif.GPSIFD.GPSLongitudeRef] = lngRef;
  exifObj.GPS[piexif.GPSIFD.GPSLongitude] = decimalToDmsRational(Math.abs(longitude));
  exifObj.GPS[piexif.GPSIFD.GPSMapDatum] = "WGS-84";

  applyOptionalImageDetails(exifObj, extraDetails);

  const exifBytes = piexif.dump(exifObj);
  return piexif.insert(exifBytes, cleanDataUrl);
}

function removeGpsFromJpeg(dataUrl) {
  const cleanDataUrl = ensureJpegDataUrl(dataUrl);

  try {
    const exifObj = piexif.load(cleanDataUrl);
    exifObj.GPS = {};
    const exifBytes = piexif.dump(exifObj);
    return piexif.insert(exifBytes, cleanDataUrl);
  } catch {
    try {
      return piexif.remove(cleanDataUrl);
    } catch {
      return cleanDataUrl;
    }
  }
}

function decimalToDmsRational(decimal) {
  const degrees = Math.floor(decimal);
  const minutesFloat = (decimal - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;

  return [
    [degrees, 1],
    [minutes, 1],
    [Math.round(seconds * 10000), 10000],
  ];
}

function ensureJpegDataUrl(dataUrl) {
  if (String(dataUrl).startsWith("data:image/jpeg")) return dataUrl;
  if (String(dataUrl).startsWith("data:image/jpg")) {
    return dataUrl.replace("data:image/jpg", "data:image/jpeg");
  }
  return dataUrl;
}

function convertImageToJpeg(imageSource) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);

        resolve(canvas.toDataURL("image/jpeg", OUTPUT_QUALITY));
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = reject;
    image.src = imageSource;
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = normalizeFileName(fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const successful = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!successful) {
    throw new Error("Copy failed.");
  }
}

function getFileBaseName(fileName) {
  return String(fileName || "image").replace(/\.[^/.]+$/, "");
}

function normalizeFileName(fileName) {
  const safe = String(fileName || "geotagged-image.jpg")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-");

  return /\.jpe?g$/i.test(safe) ? safe : `${safe}.jpg`;
}

function formatCoordinate(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) return "";

  return number.toFixed(6).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const sizeIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const size = bytes / Math.pow(1024, sizeIndex);

  return `${size.toFixed(sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
}

import { Routes, Route } from "react-router-dom";
import MainLayout from "./MainLayout";

// Pages
import Home from "./pages/Home";
import Tools from "./pages/Tools";
import SearchResults from "./pages/SearchResults";
import Blog from "./pages/Blog";
import BlogSingle from "./pages/BlogSingle";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

// Tools
import CaseConverter from "./tools/CaseConverter";
import ColorPicker from "./tools/ColorPicker";
import ColorPreview from "./tools/ColorPreview";
import ImageCompressor from "./tools/ImageCompressor";
import ImageResizer from "./tools/ImageResizer";
import WebpToJpgConverter from "./tools/WebpToJpgConverter";
import PDFToJpgConverter from "./tools/PDFToJpgConverter";
import TextToSlugGenerator from "./tools/TextToSlugGenerator";
import ImageCropperTool from "./tools/ImageCropperTool";

// Blog components
import BestFreeOnlineTools from "./pages/blogs/BestFreeOnlineTools";
import ImageToolsGuide from "./pages/blogs/ImageToolsGuide";
import HowToConvertWebpToJpg from "./pages/blogs/HowToConvertWebpToJpg";
import ToolPage from "./pages/ToolPage";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Home and Main Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/search" element={<SearchResults />} />

        {/* Blog Pages */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogSingle />} />
        <Route path="/blog/HowToConvertWebpToJpg" element={<HowToConvertWebpToJpg />} />
        <Route path="/blog/BestFreeOnlineTools" element={<BestFreeOnlineTools />} />
        <Route path="/blog/ImageToolsGuide" element={<ImageToolsGuide />} />

        {/* Other Pages */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* Tool Pages */}
        <Route path="/tool/case-converter" element={<CaseConverter />} />
        <Route path="/tool/color-picker" element={<ColorPicker />} />
        <Route path="/tool/color-preview" element={<ColorPreview />} />
        <Route path="/tool/image-compressor" element={<ImageCompressor />} />
        <Route path="/tool/image-resizer" element={<ImageResizer />} />
        <Route path="/tool/webp-to-jpg-converter" element={<WebpToJpgConverter />} />
        <Route path="/tool/pdf-to-jpg-converter" element={<PDFToJpgConverter />} />
        <Route path="/tool/text-to-slug-generator" element={<TextToSlugGenerator />} />
        <Route path="/tool/image-cropper-tool" element={<ImageCropperTool />} />  
        <Route path="/tool/:slug" element={<ToolPage />} />
      </Route>
    </Routes>
  );
}
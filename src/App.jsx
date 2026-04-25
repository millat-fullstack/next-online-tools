import { Routes, Route } from "react-router-dom";
import MainLayout from "./MainLayout";

import Home from "./pages/Home";
import Tools from "./pages/Tools";
import SearchResults from "./pages/SearchResults";
import Blog from "./pages/Blog";
import BlogSingle from "./pages/BlogSingle";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

import CaseConverter from "./tools/CaseConverter";
import ColorPicker from "./tools/ColorPicker";
import ColorPreview from "./tools/ColorPreview";
import ImageCompressor from "./tools/ImageCompressor";
import ImageResizer from "./tools/ImageResizer";
import WebpToJpgConverter from "./tools/WebpToJpgConverter";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/search" element={<SearchResults />} />

        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogSingle />} />

        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        <Route path="/tool/case-converter" element={<CaseConverter />} />
        <Route path="/tool/color-picker" element={<ColorPicker />} />
        <Route path="/tool/color-preview" element={<ColorPreview />} />
        <Route path="/tool/image-compressor" element={<ImageCompressor />} />
        <Route path="/tool/image-resizer" element={<ImageResizer />} />
        <Route path="/tool/webp-to-jpg-converter" element={<WebpToJpgConverter />} />
      </Route>
    </Routes>
  );
}
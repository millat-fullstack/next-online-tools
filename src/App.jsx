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

        {/* Other Pages */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* Tool Pages */}
        <Route path="/tool/:slug" element={<ToolPage />} />
      </Route>
    </Routes>
  );
}
import { Helmet } from "react-helmet-async";
import SharePost from "../../components/ui/SharePost";

export const blogData = {
  title: "How to Reorder PDF Pages Online",
  slug: "how-to-reorder-pdf-pages-online",
  date: "2026-06-09",
  category: "PDF Tools",
  excerpt:
    "Learn how to reorder PDF pages online and arrange your document pages in the correct order without installing software.",
  image: "/images/reorder-pdf-pages-online.png",
};

export default function HowToReorderPDFPagesOnline() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blogData.title,
    description: blogData.excerpt,
    image: `https://nextonlinetools.com${blogData.image}`,
    author: {
      "@type": "Organization",
      name: "Next Online Tools",
    },
    publisher: {
      "@type": "Organization",
      name: "Next Online Tools",
      logo: {
        "@type": "ImageObject",
        url: "https://nextonlinetools.com/logo.png",
      },
    },
    datePublished: blogData.date,
    dateModified: blogData.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://nextonlinetools.com/blog/how-to-reorder-pdf-pages-online",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can I reorder PDF pages online?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. You can use an online PDF organizer to move pages into the correct order and download the updated PDF.",
        },
      },
      {
        "@type": "Question",
        name: "Why should I reorder PDF pages?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Reordering pages helps fix scanned documents, reports, assignments, proposals, forms, and presentations when pages are in the wrong order.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need software to rearrange PDF pages?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Many online PDF tools let you rearrange pages directly from your browser without installing software.",
        },
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>How to Reorder PDF Pages Online</title>

        <meta
          name="description"
          content="Learn how to reorder PDF pages online and arrange your document pages in the correct order without installing software."
        />

        <meta
          name="keywords"
          content="reorder PDF pages, rearrange PDF pages online, organize PDF pages, move PDF pages, PDF page organizer"
        />

        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>

        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <section className="card p-6 sm:p-8 mb-6">
        <div className="relative w-full h-96 overflow-hidden rounded-xl">
          <img
            src={blogData.image}
            alt="Reorder PDF pages online"
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="text-4xl font-bold mt-4">
          How to Reorder PDF Pages Online
        </h1>

        <p className="text-sm text-[var(--text-secondary)]">
          {blogData.category} • June 9, 2026
        </p>
      </section>

      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          PDF pages can sometimes appear in the wrong order, especially after
          scanning, merging, or collecting files from different sources. When
          this happens, you do not need to recreate the whole document. You can
          simply reorder the PDF pages online.
        </p>

        <h2 className="text-2xl font-semibold mb-4">
          Why Reorder PDF Pages?
        </h2>

        <ul className="list-disc pl-6 mb-5 text-[var(--text-secondary)] leading-8">
          <li>Fix scanned pages that are out of order</li>
          <li>Arrange report sections correctly</li>
          <li>Prepare assignments and office files</li>
          <li>Move cover pages, appendices, or forms</li>
          <li>Create a cleaner final document</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4">
          How to Reorder PDF Pages Online
        </h2>

        <ol className="list-decimal pl-6 mb-5 text-[var(--text-secondary)] leading-8">
          <li>Open an online PDF page organizer.</li>
          <li>Upload the PDF file.</li>
          <li>Preview the page thumbnails.</li>
          <li>Drag pages into the correct order.</li>
          <li>Apply the changes.</li>
          <li>Download the reordered PDF file.</li>
        </ol>

        <h2 className="text-2xl font-semibold mb-4">
          Common Use Cases
        </h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          Reordering PDF pages is helpful for scanned books, university notes,
          business reports, contract files, invoices, proposals, and printable
          documents. It is also useful when several people submit separate pages
          and you need to arrange them into one correct file.
        </p>

        <h2 className="text-2xl font-semibold mb-4">
          Useful External Resources
        </h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          Adobe has an online tool for{" "}
          <a
            href="https://www.adobe.com/acrobat/online/rearrange-pdf.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] font-medium underline"
          >
            rearranging PDF pages
          </a>
          . You can also read Adobe’s guide on how to{" "}
          <a
            href="https://www.adobe.com/acrobat/how-to/rearrange-pdf-pages.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] font-medium underline"
          >
            reorder and organize PDF pages
          </a>
          .
        </p>

        <h2 className="text-2xl font-semibold mb-4">
          Related Guide from Next Online Tools
        </h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          For more PDF organization tips, read:{" "}
          <a
            href="/blog/how-to-add-page-numbers-to-pdf-online"
            className="text-[var(--primary)] font-medium underline"
          >
            How to Add Page Numbers to PDF Online
          </a>
          .
        </p>

        <div className="rounded-xl border border-[var(--border)] p-5 bg-[var(--bg-secondary)] my-7">
          <h3 className="text-xl font-semibold mb-2">
            Reorder and Organize PDF Pages
          </h3>

          <p className="text-[var(--text-secondary)] leading-7 mb-4">
            Use online PDF tools to move, arrange, remove, and organize pages
            before sharing your final file.
          </p>

          <a href="/tools?category=PDF%20Tools" className="btn-primary inline-flex">
            Browse PDF Tools
          </a>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Final Thoughts</h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          Reordering PDF pages online is useful when your document pages are not
          arranged correctly. With a browser-based PDF organizer, you can move
          pages into the right order and prepare a cleaner final file in a few
          steps.
        </p>

        <p className="text-sm text-[var(--text-secondary)] mt-5">
          Posted by: Admin
        </p>

        <section className="flex gap-4 mt-8">
          <SharePost title={blogData.title} />
        </section>
      </section>
    </>
  );
}
import SharePost from "../../components/ui/SharePost";

export const blogData = {
  title: "How to Count Words and Characters Online Easily",
  slug: "HowToCountWordsAndCharactersOnlineEasily",
  date: "2026-06-03",
  category: "Text Tools",
  excerpt:
    "Learn how to count words, characters, sentences, and paragraphs online quickly using a simple word counter tool.",
  image: "/images/word-character-counter.png",
};

export default function HowToCountWordsAndCharactersOnlineEasily() {
  return (
    <article>
      {/* Blog Header */}
      <section className="card p-6 sm:p-8 mb-6">
        <div className="relative w-full h-72 overflow-hidden rounded-xl bg-[var(--bg-secondary)]">
          <img
            src={blogData.image}
            alt="Count words and characters online"
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mt-5 leading-tight">
          How to Count Words and Characters Online Easily
        </h1>

        <p className="text-sm text-[var(--text-secondary)] mt-2">
          {blogData.category} • June 3, 2026
        </p>
      </section>

      {/* Blog Content */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          Counting words and characters is useful when you are writing essays,
          social media captions, product descriptions, emails, blog posts, or
          SEO content. Instead of counting manually, you can use an online word
          and character counter to get instant results.
        </p>

        <h2 className="text-2xl font-semibold mb-4">
          Why Use an Online Word Counter?
        </h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          An online word counter helps you check the length of your text quickly.
          It can show total <strong>words</strong>, <strong>characters</strong>,
          <strong> sentences</strong>, and <strong>paragraphs</strong>. This is
          helpful when a platform has a text limit or when you want to make your
          writing shorter and clearer.
        </p>

        <h2 className="text-2xl font-semibold mb-4">
          How to Count Words and Characters Online
        </h2>

        <ol className="list-decimal pl-6 text-[var(--text-secondary)] leading-8 mb-5 space-y-2">
          <li>
            <strong>Copy your text:</strong> Select the paragraph, caption, or
            article you want to check.
          </li>
          <li>
            <strong>Paste it into the tool:</strong> Add your text to the online
            word counter box.
          </li>
          <li>
            <strong>Check the results:</strong> Instantly see the number of
            words, characters, sentences, and paragraphs.
          </li>
        </ol>

        <h2 className="text-2xl font-semibold mb-4">
          When Do You Need a Character Counter?
        </h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          A character counter is useful for social media bios, titles, meta
          descriptions, SMS messages, form inputs, and short ads. If your text is
          too long, the counter helps you adjust it before publishing.
        </p>

        <div className="rounded-xl border border-[var(--border)] p-5 bg-[var(--bg-secondary)] my-7">
          <h3 className="text-xl font-semibold mb-2">
            Try Our Free Character Counter
          </h3>

          <p className="text-[var(--text-secondary)] leading-7 mb-4">
            Use our free online character counter to check your text length
            instantly. It is simple, fast, and works directly in your browser.
          </p>

          <a href="/tool/character-counter" className="btn-primary inline-flex">
            Open Character Counter
          </a>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Final Words</h2>

        <p className="text-[var(--text-secondary)] leading-8 mb-5">
          An online word and character counter saves time and helps you write
          better text for different platforms. Whether you are preparing a blog
          post, caption, assignment, or SEO description, it gives you a quick and
          accurate overview of your writing.
        </p>

        <p className="text-sm text-[var(--text-secondary)] mt-5">
          Posted by: Admin
        </p>

        {/* Social Share */}
        <section className="flex gap-4 mt-8">
          <SharePost title={blogData.title} />
        </section>
      </section>
    </article>
  );
}
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <span className="badge mb-4 inline-block">Terms of Service</span>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Terms of Service
        </h1>

        <p className="text-[var(--text-secondary)] leading-7">
          By using Next Online Tools, you agree to use our website and tools responsibly.
          These terms explain the basic rules for using our free online tools.
        </p>
      </section>

      <section className="card p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Use of Tools</h2>
          <p className="text-[var(--text-secondary)] leading-7">
            Our tools are provided for general online tasks such as image
            conversion, text formatting, color selection, and productivity work.
            You are responsible for how you use the output.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">Free Service</h2>
          <p className="text-[var(--text-secondary)] leading-7">
            Next Online Tools focuses on free and user-friendly tools. We may improve,
            change, remove, or add tools at any time.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">No Misuse</h2>
          <p className="text-[var(--text-secondary)] leading-7">
            Users should not use the website for harmful, illegal, abusive, or
            copyright-violating activities.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">No Guarantee</h2>
          <p className="text-[var(--text-secondary)] leading-7">
            We try to keep tools accurate and useful, but we cannot guarantee
            that every tool will always work perfectly for every situation.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">Contact</h2>
          <p className="text-[var(--text-secondary)] leading-7">
            For questions about these terms, please visit our{" "}
            <Link to="/contact" className="text-[var(--primary)] font-medium">
              Contact page
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
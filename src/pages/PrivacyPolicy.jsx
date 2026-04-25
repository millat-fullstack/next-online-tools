export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <span className="badge mb-4 inline-block">Privacy Policy</span>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Privacy Policy
        </h1>

        <p className="text-[var(--text-secondary)] leading-7">
          ToolNest respects user privacy. Our website is designed to provide
          simple and free online tools while keeping the user experience safe and
          easy to understand.
        </p>
      </section>

      <section className="card p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Information We Collect</h2>
          <p className="text-[var(--text-secondary)] leading-7">
            We do not require users to create an account to use our tools. Some
            tools may process files or text directly inside your browser. We do
            not intentionally collect personal files through these browser-based
            tools.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">Tool Usage</h2>
          <p className="text-[var(--text-secondary)] leading-7">
            Our tools are built to complete simple online tasks such as image
            conversion, text editing, color selection, and similar utilities.
            Where possible, processing happens locally in the browser.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">Cookies</h2>
          <p className="text-[var(--text-secondary)] leading-7">
            We may use basic cookies or analytics in the future to improve the
            website. If advertising or analytics tools are added later, this
            policy should be updated clearly.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">Third-Party Services</h2>
          <p className="text-[var(--text-secondary)] leading-7">
            ToolNest aims to avoid paid APIs and unnecessary third-party
            services. If third-party services are used later, they may have
            their own privacy policies.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">Contact</h2>
          <p className="text-[var(--text-secondary)] leading-7">
            For privacy questions, please contact us through the Contact page.
          </p>
        </div>
      </section>
    </div>
  );
}
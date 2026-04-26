import { useState } from "react";

export default function About() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(""); // Track submission status

  const handleEmailChange = (e) => setEmail(e.target.value);

  const handleSubscribe = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setIsSubmitting(true);
    setStatus(""); // Reset status on each submission

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbyaXuuiyMngv1_6O2urBGmnc9R5V_KhGE5k-xgJowlG_g7rYAGp3ouZ31eYWzWR9UNi/exec",
        {
          method: "POST",
          body: JSON.stringify({ email }),
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        setStatus("Subscription successful!"); // Show success message
        setEmail(""); // Clear the email input
      } else {
        setStatus("There was an issue with your subscription.");
      }
    } catch (error) {
      setStatus("Error occurred while submitting the form.");
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Introduction */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-4">About Next Online Tools</h1>
        <p className="text-[var(--text-secondary)] leading-8">
          Next Online Tools is your go-to website for free, fast, and easy-to-use online tools. We provide various tools that help you quickly complete daily tasks such as image editing, text conversion, color management, and more—all without any payments or complex setups.
        </p>
      </section>

      {/* Website Policy */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">Our Website Policy</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-6">
            <h3 className="font-semibold text-lg">No Paid Tools</h3>
            <p className="text-[var(--text-secondary)]">
              We focus on tools that can be used freely by visitors without any hidden costs.
            </p>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-lg">No Paid API</h3>
            <p className="text-[var(--text-secondary)]">
              We prefer browser-based and free methods where possible, ensuring accessibility for everyone.
            </p>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-lg">No Copyright Violation</h3>
            <p className="text-[var(--text-secondary)]">
              Our design and content direction is original and safe. We ensure all tools and content are copyright-compliant.
            </p>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-lg">Simple User Experience</h3>
            <p className="text-[var(--text-secondary)]">
              Our tools are designed to be clear, easy to use, and intuitive. We prioritize a smooth experience for all users.
            </p>
          </div>
        </div>
      </section>

      {/* Email Subscription */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Stay Updated with Our Latest Tools</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          Subscribe to our newsletter and get notified when we release new tools and updates to improve your digital workflow.
        </p>

        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            required
            placeholder="Enter your email"
            className="p-3 rounded-md border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <button
            type="submit"
            className="btn-primary p-3 text-white rounded-md hover:bg-[var(--primary)]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Subscribe"}
          </button>
        </form>

        {/* Status Message */}
        {status && (
          <div
            className={`mt-4 p-4 rounded-md ${
              status.includes("successful") ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            }`}
          >
            {status}
          </div>
        )}
      </section>
    </div>
  );
}
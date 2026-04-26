import { useState } from "react";
import { Link } from "react-router-dom";

export default function About() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(""); // Track submission status

  const handleEmailChange = (e) => setEmail(e.target.value);

  const handleSubscribe = async (e) => {
    e.preventDefault();

    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbyaXuuiyMngv1_6O2urBGmnc9R5V_KhGE5k-xgJowlG_g7rYAGp3ouZ31eYWzWR9UNi/exec",
      {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.ok) {
      setStatus("Subscription successful!");
      setEmail(""); // Clear the email input
    } else {
      setStatus("There was an issue with your subscription.");
    }
    setIsSubmitting(false); // Reset the submitting state
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <span className="badge mb-4 inline-block">About ToolNest</span>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Simple Free Tools for Everyday Online Tasks
        </h1>
        <p className="text-[var(--text-secondary)] max-w-3xl leading-7">
          ToolNest is a free online tools website built to help users complete
          small digital tasks quickly. Our goal is to make useful tools simple,
          fast, and easy for everyone.
        </p>
      </section>

      {/* MISSION */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
        <p className="text-[var(--text-secondary)] leading-7">
          We want to provide 100+ free online tools for text editing, image
          processing, colors, SEO, productivity, file conversion, and daily web
          tasks. Every tool is designed to be clean, beginner-friendly, and easy
          to use without complicated steps.
        </p>
      </section>

      {/* VALUES */}
      <section>
        <h2 className="text-2xl font-bold mb-5">What We Focus On</h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="card p-5">
            <CheckCircle className="text-[var(--primary)] mb-4" size={30} />
            <h3 className="font-semibold mb-2">Free to Use</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Our tools are made for users who need quick solutions without
              payment.
            </p>
          </div>

          <div className="card p-5">
            <Zap className="text-[var(--primary)] mb-4" size={30} />
            <h3 className="font-semibold mb-2">Fast Workflow</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Each tool is focused on one task, so users can finish work faster.
            </p>
          </div>

          <div className="card p-5">
            <Users className="text-[var(--primary)] mb-4" size={30} />
            <h3 className="font-semibold mb-2">User Friendly</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Clean layout, clear buttons, and simple instructions for everyone.
            </p>
          </div>

          <div className="card p-5">
            <ShieldCheck className="text-[var(--primary)] mb-4" size={30} />
            <h3 className="font-semibold mb-2">Safe Direction</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              We avoid paid APIs, copied designs, and unnecessary complicated
              systems.
            </p>
          </div>
        </div>
      </section>

      {/* POLICY */}
      <section className="card p-6 sm:p-8">
        <h2 className="text-2xl font-bold mb-4">Our Website Policy</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
            <h3 className="font-semibold mb-2">No Paid Tools</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              We focus on tools that can be used freely by visitors.
            </p>
          </div>

          <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
            <h3 className="font-semibold mb-2">No Paid API</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              We prefer browser-based and free methods where possible.
            </p>
          </div>

          <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
            <h3 className="font-semibold mb-2">No Copyright Violation</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Our design and content direction is original and safe.
            </p>
          </div>

          <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-5">
            <h3 className="font-semibold mb-2">Simple User Experience</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Tools should be clear, useful, and easy to understand.
            </p>
          </div>
        </div>
      </section>

      {/* Email Subscription */}
      <section className="card p-6 sm:p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Stay Updated with Our Latest Tools</h2>
        <p className="text-[var(--text-secondary)] mb-6">
          Subscribe to our newsletter and get notified when we release new tools and updates to improve your digital workflow.
        </p>

        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 justify-center">
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
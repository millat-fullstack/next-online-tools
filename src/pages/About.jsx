import React, { useState } from "react";
import { CheckCircle, ShieldCheck, Zap, Users, Send } from "lucide-react";

const About = () => {
  const [email, setEmail] = useState("");
  const [responseMsg, setResponseMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("email", email);

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbxhMabtrxX_b_m4mAaro95wZC8u64HklkGVkqo3Zcew9oAx-tLk7e78lcFhRIrs-QpOWg/exec",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        setResponseMsg("✅ You have successfully subscribed!");
        setEmail(""); // Clear the input field after success
      } else {
        setResponseMsg("❌ Something went wrong. Try again!");
      }
    } catch (err) {
      setResponseMsg("⚠️ Network error, please try again!");
    }
  };

  return (
    <div className="about-container">
      <section className="flex flex-col gap-8">
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
      <section className="card p-6 sm:p-8">
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
              We focus on transparency and avoid unnecessary complicated
              systems.
            </p>
          </div>
        </div>
      </section>
        <span className="card p-6 sm:p-8 text-center mt-4">
              {/* Subscription Form Section */}
        <h2 className="text-2xl font-bold mb-3">
          Stay Updated with Our Latest Tools
        </h2>
        <p className="text-[var(--text-secondary)] mb-6">
          Subscribe to our newsletter and get notified when we release new tools and updates
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center">
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            className="p-3 rounded-md border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary p-3 text-white rounded-md hover:bg-[var(--primary)]">Subscribe</button>
        </form>

        <p id="responseMsg" style={{ color: responseMsg.includes("error") ? "red" : "green" }}>
          {responseMsg}
        </p>
        </span>
      </section>
    </div>
  );
};

export default About;
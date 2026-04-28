import { useState } from "react";
import {
  Mail,
  MessageCircle,
  Send,
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
} from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [responseMsg, setResponseMsg] = useState("");
  const [responseIcon, setResponseIcon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      setResponseIcon(<AlertTriangle size={20} />);
      setResponseMsg("Please fill in all fields before sending your message.");
      return;
    }

    setIsLoading(true);
    setResponseMsg("");
    setResponseIcon(null);

    const formPayload = new FormData();
    formPayload.append("name", formData.name);
    formPayload.append("email", formData.email);
    formPayload.append("message", formData.message);

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbxhMabtrxX_b_m4mAaro95wZC8u64HklkGVkqo3Zcew9oAx-tLk7e78lcFhRIrs-QpOWg/exec",
        {
          method: "POST",
          body: formPayload,
        }
      );

      if (response.ok) {
        setResponseIcon(<CheckCircle size={20} />);
        setResponseMsg("Your message has been sent successfully!");
        setFormData({
          name: "",
          email: "",
          message: "",
        });
      } else {
        setResponseIcon(<XCircle size={20} />);
        setResponseMsg("Something went wrong. Please try again.");
      }
    } catch (err) {
      setResponseIcon(<AlertTriangle size={20} />);
      setResponseMsg("Network error, please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const responseColor = responseMsg.includes("success") ? "green" : responseMsg ? "red" : "inherit";

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6 sm:p-8">
        <span className="badge mb-4 inline-block">Contact Us</span>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          Get in Touch with Next Tools Online
        </h1>

        <p className="text-[var(--text-secondary)] max-w-3xl leading-7">
          Have a question, suggestion, or tool request? Send us a message.
          We are always working to improve our free online tools.
        </p>
      </section>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-5">Send a Message</h2>

          {responseMsg && (
            <div
              className="mb-5 rounded-2xl border border-[var(--border)] bg-[#f8f4ff] p-4 text-sm font-medium"
              style={{ color: responseColor }}
            >
              <div className="flex items-center gap-2">
                {responseIcon}
                <span>{responseMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                Your Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className="input"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="input"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your message or tool request"
                rows="6"
                className="input resize-none"
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="btn-primary w-fit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>

        <aside className="flex flex-col gap-5">
          <div className="card p-5">
            <Mail className="text-[var(--primary)] mb-4" size={30} />
            <h3 className="font-semibold mb-2">Email Support</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              For general questions, tool requests, or website feedback.
            </p>
          </div>

          <div className="card p-5">
            <MessageCircle className="text-[var(--primary)] mb-4" size={30} />
            <h3 className="font-semibold mb-2">Tool Suggestions</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Suggest new free tools that can help users complete online tasks.
            </p>
          </div>

          <div className="card p-5">
            <HelpCircle className="text-[var(--primary)] mb-4" size={30} />
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Tell us what is not working and we will try to improve the tool.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}
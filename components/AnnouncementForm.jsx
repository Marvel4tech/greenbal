"use client";

import { useState } from "react";

const AnnouncementForm = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          link,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send announcement");
      }

      setFeedback("Announcement sent successfully.");
      setTitle("");
      setMessage("");
      setLink("");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="block mb-1 text-sm font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          placeholder="Announcement title"
          required
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border rounded-md px-3 py-2 min-h-[120px]"
          placeholder="Write announcement message"
          required
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">Link (optional)</label>
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          placeholder="/leaderboard"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-md border border-primary"
      >
        {loading ? "Sending..." : "Send announcement"}
      </button>

      {feedback && <p className="text-sm">{feedback}</p>}
    </form>
  );
};

export default AnnouncementForm;
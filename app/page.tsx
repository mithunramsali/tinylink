"use client";

import { useEffect, useState } from "react";

type LinkRow = {
  code: string;
  url: string;
  total_clicks: number;
  last_clicked: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formUrl, setFormUrl] = useState("");
  const [formCode, setFormCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadLinks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/links");
      if (!res.ok) {
        throw new Error("Failed to load links");
      }
      const data = (await res.json()) as LinkRow[];
      setLinks(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load links. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLinks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    try {
      setSubmitting(true);

      const urlToSubmit = formUrl.startsWith("http")
        ? formUrl.trim()
        : `https://${formUrl.trim()}`;

      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlToSubmit,
          code: formCode.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create link");
      }

      setSuccess(`Short link created: ${data.shortUrl}`);
      setFormUrl("");
      setFormCode("");
      await loadLinks();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the link with code "${code}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/links/${code}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete link");
      }

      setSuccess(`Successfully deleted link: ${code}`);
      await loadLinks();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete link. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLinks = links.filter((link) =>
    (link.code + " " + link.url).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="space-y-4">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">TinyLink Dashboard</h1>
          <p className="text-sm text-slate-300">
            Create and manage short URLs. Custom codes are globally unique.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="url"
              className="block text-xs font-medium uppercase tracking-wide text-slate-300 mb-1"
            >
              Long URL
            </label>
            <input
              id="url"
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://example.com/docs"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm placeholder-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
              disabled={submitting}
              required
            />
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-end">
            <div className="flex-1">
              <label
                htmlFor="code"
                className="block text-xs font-medium uppercase tracking-wide text-slate-300 mb-1"
              >
                Custom code (optional)
              </label>
              <input
                id="code"
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.slice(0, 8))}
                placeholder="mycode1"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm placeholder-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
                pattern="[A-Za-z0-9]{6,8}"
                title="6–8 letters or numbers"
                disabled={submitting}
              />
              <p className="mt-1 text-xs text-slate-400">
                Leave blank for auto-generated code. Codes must be 6–8 alphanumeric
                characters.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Create short link"}
            </button>
          </div>
        </form>

        {error && (
          <div className="rounded-md border border-red-500/60 bg-red-950/40 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-500/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
            <span className="truncate">{success}</span>
            <button
              type="button"
              onClick={() => {
                const parts = success.split(": ");
                const url = parts[1];
                if (url) void navigator.clipboard.writeText(url);
              }}
              className="text-xs font-medium text-emerald-200 hover:text-emerald-50"
            >
              Copy
            </button>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 p-3 md:p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-slate-100">Your links</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or URL"
            className="w-full md:w-64 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm placeholder-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-slate-400">
            Loading links...
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <p>{search ? "No links match your search." : "No links yet. Create your first short link above."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-left">Target URL</th>
                  <th className="px-4 py-2 text-right">Clicks</th>
                  <th className="px-4 py-2 text-left">Last clicked</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredLinks.map((link) => (
                  <tr key={link.code} className="hover:bg-slate-900/70">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/${link.code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-sky-300 hover:text-sky-200 underline"
                          title={`Visit ${window.location.origin}/${link.code}`}
                        >
                          {link.code}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-2 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-slate-200" title={link.url}>
                          {link.url}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-slate-100">
                      {link.total_clicks}
                    </td>
                    <td className="px-4 py-2 text-slate-300">
                      {link.last_clicked
                        ? new Date(link.last_clicked).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const origin = window.location.origin;
                            const url = `${origin}/${link.code}`;
                            void navigator.clipboard.writeText(url);
                          }}
                          className="rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500"
                        >
                          Copy
                        </button>
                        <a
                          href={`/code/${link.code}`}
                          className="rounded-md border border-slate-700 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500"
                        >
                          Stats
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(link.code)}
                          disabled={submitting}
                          className="rounded-md border border-red-700/70 bg-red-900/60 px-2 py-1 text-[11px] text-red-50 hover:bg-red-800 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

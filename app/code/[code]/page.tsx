import { query } from "@/lib/db";
import Link from "next/link";

interface PageProps {
  params: { code: string };
}

export default async function CodeStatsPage({ params }: PageProps) {
  const { code } = params;

  const rows = await query<{
    code: string;
    url: string;
    total_clicks: number;
    last_clicked: string | null;
    created_at: string;
  }>(
    "SELECT code, url, total_clicks, last_clicked, created_at FROM links WHERE code = $1",
    [code]
  );

  if (rows.length === 0) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold">Link not found</h1>
        <p className="text-slate-300">
          No record exists for <span className="font-mono font-semibold">{code}</span>.
        </p>
        <Link href="/" className="text-sm text-sky-400 hover:text-sky-300">
          ← Back to dashboard
        </Link>
      </section>
    );
  }

  const link = rows[0];
  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const shortUrl = `${baseUrl}/${link.code}`;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Stats for {link.code}</h1>
          <p className="text-sm text-slate-300">Detailed stats for this short link.</p>
        </div>
        <Link
          href="/"
          className="text-sm text-sky-400 hover:text-sky-300 whitespace-nowrap"
        >
          ← Back to dashboard
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-slate-200">Link details</h2>
          <div className="text-sm space-y-1">
            <div>
              <span className="text-slate-400">Short URL:</span>{" "}
              <code className="break-all text-sky-300">{shortUrl}</code>
            </div>
            <div>
              <span className="text-slate-400">Target URL:</span>{" "}
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="break-all text-sky-300 hover:text-sky-200"
              >
                {link.url}
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-1 text-sm">
          <h2 className="text-sm font-semibold text-slate-200 mb-1">Stats</h2>
          <p>
            <span className="text-slate-400">Total clicks:</span>{" "}
            <span className="font-medium">{link.total_clicks}</span>
          </p>
          <p>
            <span className="text-slate-400">Last clicked:</span>{" "}
            {link.last_clicked ? (
              <span>{new Date(link.last_clicked).toLocaleString()}</span>
            ) : (
              <span className="italic text-slate-400">Never</span>
            )}
          </p>
          <p>
            <span className="text-slate-400">Created at:</span>{" "}
            <span>{new Date(link.created_at).toLocaleString()}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

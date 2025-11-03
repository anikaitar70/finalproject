"use client";

import { useEffect, useState } from "react";

interface DebugEvent {
  ts: string;
  voterId: string;
  postId: string;
  voteType: string;
  voteWeight: number;
  prevPostScore?: number;
  newPostScore?: number;
  deltaPost?: number;
  prevAuthorScore?: number;
  newAuthorScore?: number;
  deltaAuthor?: number;
  postConsensus?: number;
}

export default function CredibilityDebugPage() {
  const [events, setEvents] = useState<DebugEvent[]>([]);

  useEffect(() => {
    let mounted = true;

    async function fetchEvents() {
      try {
        const res = await fetch("/api/dev/credibility-events");
        const data = await res.json();
        if (mounted) setEvents(data);
      } catch (e) {
        console.error(e);
      }
    }

    fetchEvents();
    const t = setInterval(fetchEvents, 2000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-4 text-2xl font-semibold">Credibility Debug Events</h1>
      <div className="space-y-3">
        {events.length === 0 && <div>No events yet</div>}
        {events.map((ev, i) => (
          <div key={i} className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground">{new Date(ev.ts).toLocaleString()}</div>
            <div className="mt-1 text-sm">
              Voter: <strong>{ev.voterId}</strong> voted <strong>{ev.voteType}</strong> on post <strong>{ev.postId}</strong>
            </div>
            <div className="mt-2 text-sm">
              Weight: <strong>{ev.voteWeight?.toFixed(3)}</strong>
              {typeof ev.deltaPost !== 'undefined' && (
                <span className="ml-4">Post Δ: <strong>{ev.deltaPost?.toFixed(4)}</strong></span>
              )}
              {typeof ev.deltaAuthor !== 'undefined' && (
                <span className="ml-4">Author Δ: <strong>{ev.deltaAuthor?.toFixed(4)}</strong></span>
              )}
            </div>
            <details className="mt-2 text-xs">
              <summary>Raw</summary>
              <pre className="whitespace-pre-wrap">{JSON.stringify(ev, null, 2)}</pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}

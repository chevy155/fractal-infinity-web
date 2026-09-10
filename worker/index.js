/**
 * Serves dynamic X-Rays from shared D1 at /report/{run-id}.
 * Serves byte-range responses for showcase media (Workers Assets ignore Range).
 * Other static files fall through to ASSETS.
 */
function parseRange(rangeHeader, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || "");
  if (!m) return null;
  let start = m[1] === "" ? null : Number(m[1]);
  let end = m[2] === "" ? null : Number(m[2]);
  if (start === null && end === null) return null;
  if (start === null) {
    start = Math.max(size - end, 0);
    end = size - 1;
  } else if (end === null || end >= size) {
    end = size - 1;
  }
  if (start < 0 || start >= size || end < start) return null;
  return { start, end };
}

async function serveMediaWithRange(request, env, url) {
  const assetRes = await env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }));
  if (!assetRes.ok) return assetRes;

  const buf = new Uint8Array(await assetRes.arrayBuffer());
  const size = buf.byteLength;
  const type = assetRes.headers.get("content-type") || "video/mp4";
  const etag = assetRes.headers.get("etag") || `"${size.toString(16)}"`;
  const range = parseRange(request.headers.get("Range"), size);

  if (!range) {
    return new Response(buf, {
      status: 200,
      headers: {
        "content-type": type,
        "content-length": String(size),
        "accept-ranges": "bytes",
        "cache-control": "public, max-age=86400",
        etag
      }
    });
  }

  const { start, end } = range;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "content-type": type,
      "content-length": String(end - start + 1),
      "content-range": `bytes ${start}-${end}/${size}`,
      "accept-ranges": "bytes",
      "cache-control": "public, max-age=86400",
      etag
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/assets/media/") && request.method === "GET") {
      return serveMediaWithRange(request, env, url);
    }

    const match = url.pathname.match(/^\/report\/([^/]+)$/);
    if (match && env.DB) {
      const runId = decodeURIComponent(match[1]);
      if (!runId.endsWith(".html")) {
        const row = await env.DB.prepare(
          "SELECT report_html FROM runs WHERE run_id = ?"
        )
          .bind(runId)
          .first();
        if (row?.report_html) {
          return new Response(row.report_html, {
            status: 200,
            headers: {
              "content-type": "text/html; charset=utf-8",
              "cache-control": "public, max-age=60"
            }
          });
        }
        return new Response(
          '<!doctype html><html><body><h1>Report not found</h1><p><a href="/research-lab.html">Research Lab</a></p></body></html>',
          { status: 404, headers: { "content-type": "text/html; charset=utf-8" } }
        );
      }
    }
    return env.ASSETS.fetch(request);
  }
};

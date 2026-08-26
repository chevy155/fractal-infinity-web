/**
 * Serves dynamic X-Rays from shared D1 at /report/{run-id}.
 * Static samples (e.g. /report/sample.html) fall through to ASSETS.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/report\/([^/]+)$/);
    if (match && env.DB) {
      const runId = decodeURIComponent(match[1]);
      if (!runId.endsWith('.html')) {
        const row = await env.DB.prepare(
          'SELECT report_html FROM runs WHERE run_id = ?'
        )
          .bind(runId)
          .first();
        if (row?.report_html) {
          return new Response(row.report_html, {
            status: 200,
            headers: {
              'content-type': 'text/html; charset=utf-8',
              'cache-control': 'public, max-age=60'
            }
          });
        }
        return new Response(
          '<!doctype html><html><body><h1>Report not found</h1><p><a href="/research-lab.html">Research Lab</a></p></body></html>',
          { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }
        );
      }
    }
    return env.ASSETS.fetch(request);
  }
};

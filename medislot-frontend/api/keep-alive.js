const DEFAULT_BACKEND_HEALTH_URL = "https://medislot-ji7o.onrender.com/api/health";

module.exports = async (request, response) => {
  const cronSecret = process.env.CRON_SECRET;

  // Vercel automatically sends this header when CRON_SECRET is configured.
  // Reject direct requests so this endpoint cannot be used as a public proxy.
  if (!cronSecret || request.headers.authorization !== `Bearer ${cronSecret}`) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const backendResponse = await fetch(
      process.env.BACKEND_HEALTH_URL || DEFAULT_BACKEND_HEALTH_URL,
      { method: "GET", signal: controller.signal }
    );

    response.status(backendResponse.ok ? 200 : 502).json({
      backendStatus: backendResponse.status,
      ok: backendResponse.ok
    });
  } catch (error) {
    response.status(502).json({
      backendStatus: null,
      ok: false,
      error: "Backend health check failed"
    });
  } finally {
    clearTimeout(timeout);
  }
};

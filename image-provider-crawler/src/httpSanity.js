// src/httpSanity.js

const TIMEOUT_MS = 12000;

async function httpSanity(url) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    const ms = Date.now() - start;

    return {
      url,
      status: res.status,
      ms,
      contentType: res.headers.get("content-type") || "",
      contentLength: res.headers.get("content-length") || "",
    };
  } catch (e) {
    return { url, error: e.message };
  } finally {
    clearTimeout(t);
  }
}

module.exports = { httpSanity };

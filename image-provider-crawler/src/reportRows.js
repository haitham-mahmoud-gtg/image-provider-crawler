// src/reportRows.js

function buildSummaryRows(pages) {
  return pages.map(p => `
    <tr>
      <td class="url-cell font-mono">
        <a href="${p.url}" target="_blank">${p.url}</a>
      </td>
      <td style="text-align:center;font-weight:bold">${p.domCloudinary.length}</td>
      <td style="text-align:center;font-weight:bold">${p.domPeakHour.length}</td>
      <td style="text-align:center;font-weight:bold;color:var(--primary)">
        ${p.reqCloudinary.length}
      </td>
      <td style="text-align:center;font-weight:bold">
        ${p.reqPeakHour.length}
      </td>
    </tr>
  `).join("");
}

function buildSanityRows(results) {
  return results.map(r => {
    const ok = !r.error && r.status < 400;
    const badge = r.error
      ? `<span class="badge badge-bad">ERR</span>`
      : `<span class="badge ${ok ? "badge-ok" : "badge-bad"}">${r.status}</span>`;

    const latencyPct = Math.min(100, Math.round((r.ms || 0) / 3));

    return `
      <tr>
        <td style="font-weight:600">${r.provider}</td>
        <td>${badge}</td>
        <td>
          <div class="latency-wrapper">
            <span class="latency-val">${r.ms ?? "-"}</span>
            <div class="latency-bar-bg">
              <div class="latency-bar-fill" style="width:${latencyPct}%"></div>
            </div>
          </div>
        </td>
        <td class="font-mono" style="font-size:0.8rem">${r.contentType || "-"}</td>
        <td style="text-align:right;font-weight:500">${r.contentLength || "-"}</td>
        <td class="url-cell font-mono">
          <a href="${r.url}" target="_blank">${r.url}</a>
        </td>
      </tr>
    `;
  }).join("");
}

module.exports = { buildSummaryRows, buildSanityRows };

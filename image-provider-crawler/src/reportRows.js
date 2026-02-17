// src/reportRows.js

function buildSummaryRows(pages) {
  return pages.map((p, idx) => {
    // Determine location badges
    const cloudinaryLocation = p.headerCloudinary.length > 0 && p.bodyCloudinary.length > 0
      ? '<span class="location-badge location-both">H+B</span>'
      : p.headerCloudinary.length > 0
        ? '<span class="location-badge location-header">H</span>'
        : p.bodyCloudinary.length > 0
          ? '<span class="location-badge location-body">B</span>'
          : '';
    
    const gtauLocation = p.headerGtauImages.length > 0 && p.bodyGtauImages.length > 0
      ? '<span class="location-badge location-both">H+B</span>'
      : p.headerGtauImages.length > 0
        ? '<span class="location-badge location-header">H</span>'
        : p.bodyGtauImages.length > 0
          ? '<span class="location-badge location-body">B</span>'
          : '';
    
    const hasDetails = p.headerCloudinary.length > 0 || p.bodyCloudinary.length > 0 ||
                       p.headerGtauImages.length > 0 || p.bodyGtauImages.length > 0 ||
                       p.reqCloudinary.length > 0 || p.reqGtauImages.length > 0;
    
    const expandButton = hasDetails
      ? `<button class="expand-btn" onclick="toggleDetails('details-${idx}')">▶</button>`
      : '';
    
    // Build detail rows
    let detailsHTML = '';
    if (hasDetails) {
      detailsHTML = `
        <tr id="details-${idx}" class="detail-row" style="display:none;">
          <td colspan="5" style="padding:0;">
            <div class="detail-content">
              ${buildDetailSection('Cloudinary', p.headerCloudinary, p.bodyCloudinary, p.reqCloudinary)}
              ${buildDetailSection('GTAU Images', p.headerGtauImages, p.bodyGtauImages, p.reqGtauImages)}
            </div>
          </td>
        </tr>
      `;
    }
    
    return `
      <tr>
        <td class="url-cell font-mono">
          ${expandButton}
          <a href="${p.url}" target="_blank">${p.url}</a>
        </td>
        <td style="text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;">
            <span style="font-weight:bold">${p.domCloudinary.length}</span>
            ${cloudinaryLocation}
          </div>
        </td>
        <td style="text-align:center;font-weight:bold;color:var(--primary)">
          ${p.reqCloudinary.length}
        </td>
        <td style="text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:8px;">
            <span style="font-weight:bold">${p.domGtauImages.length}</span>
            ${gtauLocation}
          </div>
        </td>
        <td style="text-align:center;font-weight:bold;color:var(--success)">
          ${p.reqGtauImages.length}
        </td>
      </tr>
      ${detailsHTML}
    `;
  }).join("");
}

function buildDetailSection(provider, headerUrls, bodyUrls, netUrls) {
  if (headerUrls.length === 0 && bodyUrls.length === 0 && netUrls.length === 0) {
    return '';
  }
  
  return `
    <div class="detail-section">
      <h4>${provider}</h4>
      ${buildUrlList('Header URLs', headerUrls, 'header')}
      ${buildUrlList('Body URLs', bodyUrls, 'body')}
      ${buildUrlList('Network Requests', netUrls, 'network')}
    </div>
  `;
}

function buildUrlList(title, urls, type) {
  if (urls.length === 0) return '';
  
  const icon = type === 'header' ? '📄' : type === 'body' ? '📝' : '🌐';
  const urlItems = urls.map(url => `<li class="url-item"><a href="${url}" target="_blank">${url}</a></li>`).join('');
  
  return `
    <div class="url-list-section">
      <div class="url-list-header">${icon} ${title} (${urls.length})</div>
      <ul class="url-list">${urlItems}</ul>
    </div>
  `;
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

# Image Provider Crawler

A web crawler that analyzes pages for image provider usage (Cloudinary, PeakHour, and GTAU Images), tracking both DOM references and network requests.

## Features

- 🔍 Crawls multiple URLs in parallel using Playwright
- 📊 Tracks 2 image providers: Cloudinary and GTAU Images
- 🌐 Monitors both DOM URLs and network requests
- ✅ HTTP sanity checks with status codes, latency, content-type, and content-length
- 📄 Generates beautiful HTML reports with separate sections for each provider

## Prerequisites

- Node.js (v14 or higher)
- Chrome browser installed

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chrome
```

## Configuration

### Public Pages
Edit the URLs to crawl in `image-provider-crawler/urls.txt`:
```
https://example.com/page1
https://example.com/page2
https://example.com/page3
```

### Authenticated Pages
Edit the URLs requiring login in `image-provider-crawler/statfulPages.txt`:
```
https://example.com/my-account
https://example.com/settings
```

## Usage

### Crawl Public Pages (No Login Required)
```bash
node image-provider-crawler/src/index.js
```

The crawler will:
1. Load URLs from `urls.txt`
2. Crawl all pages in parallel
3. Extract image provider URLs from DOM
4. Track network requests for image providers
5. Run HTTP sanity checks (up to 20 URLs per provider per page)
6. Generate `image-provider-crawler/report.html`

### Crawl Authenticated Pages (Login Required)
```bash
node image-provider-crawler/src/indexAuth.js
```

The authenticated crawler will:
1. Load URLs from `statfulPages.txt`
2. Log in to the site once using provided credentials
3. Crawl all authenticated pages sequentially (maintaining session)
4. Extract image provider URLs from DOM
5. Track network requests for image providers
6. Run HTTP sanity checks
7. Generate `image-provider-crawler/report-auth.html`

**Note:** Login credentials are hardcoded in `src/indexAuth.js`:
- Email: `joa.glo511@gumqabot.com.au`
- Password: `gumtree`

## Output

The generated report includes:

### Summary Statistics
- Total pages crawled
- Total Cloudinary requests
- Total GTAU Images requests

### Per-Page Summary
- DOM counts (URLs found in HTML) for Cloudinary and GTAU Images
- Network counts (actual HTTP requests made) for both providers

### HTTP Sanity Checks (Separate sections for each provider)
- Status code
- Response latency
- Content-Type header
- Content-Length header

## Project Structure

```
image-provider-crawler/
├── urls.txt              # Input: URLs to crawl
├── report.html           # Output: Generated report
└── src/
    ├── index.js          # Main entry point
    ├── crawler.js        # Playwright browser automation
    ├── extractors.js     # DOM URL extraction (regex)
    ├── httpSanity.js     # HTTP health checks
    ├── auth.js           # Authentication helper
    ├── index.js          # Main entry (public pages)
    ├── indexAuth.js      # Auth entry (logged-in pages)
    ├── reportBuilder.js  # Report data builder
    ├── reportRenderer.js # HTML template rendering
    ├── reportRows.js     # HTML table row generators
    └── template.html     # HTML report template
```

## Supported Image Providers

1. **Cloudinary**: `*.cloudinary.com/*`
2. **GTAU Images**: `images.*.gtau.net/*`

## Performance

- Parallel crawling: All URLs crawl simultaneously using a shared browser
- Concurrency: Multiple pages open in parallel contexts
- Efficiency: Single browser instance for all pages

## Troubleshooting

**Browser not found:**
```bash
npx playwright install chrome
```

**Permission errors:**
Make sure Chrome is installed and the path is accessible.

**Crawler hangs:**
- Check your internet connection
- Verify URLs in `urls.txt` are accessible
- Check Chrome browser is properly installed

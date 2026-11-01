/**
 * Generates and triggers download of a standalone offline HTML file
 * containing the complete worksheet, KaTeX styling, answer keys, diagrams, and solutions.
 */
export function downloadOfflineHtml({
  _questions = [],
  exam,
  _subject,
  chapter,
  bucket,
  _options
}) {
  const printableArea = document.getElementById('printable-area') || document.getElementById('printable-area-preview');
  if (!printableArea) return;

  let htmlContent = printableArea.innerHTML;

  // Restore direct image URLs for standalone offline viewing
  htmlContent = htmlContent.replace(/src=["']\/api\/proxy-image\?url=([^"']+)["']/g, (_m, encoded) => {
    try {
      return `src="${decodeURIComponent(encoded)}"`;
    } catch {
      return `src="${encoded}"`;
    }
  });

  const docTitle = `${exam?.title || 'Exam'}_${chapter?.title || 'Chapter'}_${bucket?.title || 'Worksheet'}`.replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle} - MARKS Offline Worksheet</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 16px;
      color: #111827;
      background: #f8fafc;
      font-size: 11px;
      line-height: 1.45;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 28px;
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.08);
      border-radius: 8px;
    }
    img { max-width: 100%; height: auto; display: inline-block; vertical-align: middle; }
    .print-newspaper-columns {
      column-count: 2;
      column-gap: 18px;
      column-rule: 1px solid #e2e8f0;
    }
    .katex-display { margin: 0.25em 0 !important; }
    .katex { font-size: 0.95em; }
    .avoid-break { page-break-inside: avoid; break-inside: avoid; }
    .page-break-before { page-break-before: always; break-before: page; }
    @media print {
      body { background: white; padding: 0; font-size: 10pt; }
      .container { box-shadow: none; padding: 0; max-width: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="container printable-document">
    ${htmlContent}
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${docTitle}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

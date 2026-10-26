/**
 * Generates and triggers download of a standalone offline HTML file
 * containing the complete worksheet, KaTeX styling, answer keys, and solutions.
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

  const htmlContent = printableArea.innerHTML;
  const docTitle = `${exam?.title || 'Exam'}_${chapter?.title || 'Chapter'}_${bucket?.title || 'Worksheet'}`.replace(/\s+/g, '_');

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${docTitle} - MARKS Offline</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #111827;
      background: #f9fafb;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 30px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      border-radius: 12px;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; padding: 0; max-width: none; }
      .avoid-break { page-break-inside: avoid; break-inside: avoid; }
      .page-break-before { page-break-before: always; break-before: page; }
    }
  </style>
</head>
<body>
  <div class="container">
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

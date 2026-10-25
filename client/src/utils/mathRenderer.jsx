import React, { useMemo } from 'react';
import katex from 'katex';

/**
 * Safely extracts string representation from any input
 */
function toSafeString(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (typeof val.text === 'string') return val.text;
    if (typeof val.content === 'string') return val.content;
    if (typeof val.en === 'string') return val.en;
    if (Array.isArray(val)) return val.map(toSafeString).join(' ');
    try {
      return JSON.stringify(val);
    } catch {
      return '';
    }
  }
  return String(val);
}

/**
 * Thoroughly sanitizes and repairs LaTeX formula syntax so KaTeX never throws or shows errors.
 */
function sanitizeFormula(rawFormula) {
  if (!rawFormula) return '';
  let f = String(rawFormula).trim();

  // 1. Strip all unescaped dollar signs from inside math mode (prevents "Can't use function '$' in math mode")
  f = f.replace(/(?<!\\)\$/g, '');

  // 2. Decode HTML entities that may have leaked into math mode
  f = f.replace(/&amp;/g, '&')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'")
       .replace(/&nbsp;/g, ' ');

  // 3. Fix common MARKS App database quirks
  f = f.replace(/\\mathrm\{~([a-zA-Z0-9]+)\}/g, '\\mathrm{$1}');

  // 4. Fix unescaped percentage signs (in LaTeX % is a comment that truncates formulas!)
  f = f.replace(/(?<!\\)%/g, '\\%');

  // 5. Balance unclosed braces if any
  const openBraces = (f.match(/\{/g) || []).length;
  const closeBraces = (f.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    f = f + '}'.repeat(openBraces - closeBraces);
  }

  // 6. Balance unclosed environments
  const envs = ['aligned', 'align', 'matrix', 'pmatrix', 'bmatrix', 'cases', 'array', 'gather', 'equation'];
  for (const env of envs) {
    const beginCount = (f.match(new RegExp(`\\\\begin\\{${env}\\*?\\}`, 'g')) || []).length;
    const endCount = (f.match(new RegExp(`\\\\end\\{${env}\\*?\\}`, 'g')) || []).length;
    if (beginCount > endCount) {
      f = f + `\\end{${env}}`.repeat(beginCount - endCount);
    }
  }

  return f.trim();
}

/**
 * Normalizes MARKS App raw text, fixing broken HTML breaks,
 * standardizing LaTeX delimiters \(...\) and \[...\],
 * splitting oversized $ wrappers around HTML tags, and isolating LaTeX environments.
 */
function preprocessMarksContent(rawStr) {
  if (!rawStr) return '';
  let content = String(rawStr);

  // 1. Normalize malformed breaks & HTML entities
  content = content.replace(/&lt;\s*br\s*\/?\s*&gt;/gi, '<br/>');
  content = content.replace(/<\s*br\s*\/?\s*>/gi, '<br/>');
  content = content.replace(/&nbsp;/gi, ' ');

  // 2. Standardize LaTeX delimiters \( ... \) -> $ ... $ and \[ ... \] -> $$ ... $$
  content = content.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$1$$');
  content = content.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // 3. Handle cases where a single $...$ improperly wraps across HTML breaks
  // e.g. "$ MATH1 <br/> TEXT <br/> MATH2 $"
  content = content.replace(/\$([^\$]+?)\$/g, (match, inner) => {
    if (inner.includes('<br/>')) {
      const parts = inner.split(/<br\/>/g);
      return parts.map(part => {
        let p = part.trim();
        if (!p) return '';
        // If it starts with an environment like \begin{aligned} ... \end{aligned}
        if (p.includes('\\begin{') && p.includes('\\end{')) {
          p = p.replace(/\$/g, '').trim();
          return `$$${p}$$`;
        }
        // Plain text sentence (no backslashes and no math operators)
        if (!p.includes('\\') && !/[=_\^]/.test(p)) {
          return p;
        }
        // Leading sentence words like "Let P(1,2)" or "Where x = 1"
        const wordMatch = p.match(/^((?:Let|Where|Given|Since|If|Then|Hence|Therefore|And|Or|Putting|From|By|Case\s+\d+:?|Step\s+\d+:?)\s+)(.*)$/i);
        if (wordMatch) {
          const prefix = wordMatch[1];
          const mathPart = wordMatch[2].replace(/\$/g, '').trim();
          return `${prefix}$${mathPart}$`;
        }
        p = p.replace(/\$/g, '').trim();
        return `$${p}$`;
      }).join('<br/>');
    }
    return match;
  });

  // 4. If there are environments without $$ like \begin{aligned} ... \end{aligned}
  if (!content.includes('$$') && /\\begin\{(?:aligned|align|matrix|pmatrix|bmatrix|cases|array|gather|equation)\*?\}/.test(content)) {
    content = content.replace(/(\\begin\{(?:aligned|align|matrix|pmatrix|bmatrix|cases|array|gather|equation)\*?\}[\s\S]*?\\end\{(?:aligned|align|matrix|pmatrix|bmatrix|cases|array|gather|equation)\*?\})/g, '$$$1$$');
  }

  // 5. Only wrap in $ if it's a short isolated math expression (e.g. single option like \frac{1}{2})
  // Never wrap long paragraphs or sentences containing English words
  if (!content.includes('$') && content.length < 80 && !content.includes('<br') && !content.includes(' ') && !content.includes('Statement')) {
    if (/^\\(frac|sqrt|mathrm|mathbf|alpha|beta|gamma|lambda|mu|pi|sigma|pm|mp|times|div|le|ge|ne|infty|partial|int|sum)\b/.test(content.trim())) {
      content = `$${content.trim()}$`;
    }
  }

  return content;
}

/**
 * Parses a string containing LaTeX and HTML tags into safely rendered React nodes with KaTeX.
 */
export function renderMathContent(rawInput) {
  const rawStr = toSafeString(rawInput);
  if (!rawStr.trim()) return null;

  try {
    // Proxy image URLs to avoid CORS and broken images during print
    const proxied = rawStr.replace(/<img([^>]+)src=["']([^"']+)["']([^>]*)>/gi, (match, before, src, after) => {
      if (src.startsWith('data:') || src.startsWith('/api/proxy-image')) {
        return match;
      }
      const proxiedSrc = `/api/proxy-image?url=${encodeURIComponent(src)}`;
      return `<img ${before} src="${proxiedSrc}" ${after} class="max-w-full h-auto inline-block my-2" loading="eager" />`;
    });

    const content = preprocessMarksContent(proxied);

    // Tokenize string by math delimiters
    const tokens = [];
    const regex = /(\$\$[\s\S]*?\$\$|\$([^\$]+?)\$|\\begin\{(?:aligned|align|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|array|gather|equation|split|multline)\*?\}[\s\S]*?\\end\{(?:aligned|align|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|array|gather|equation|split|multline)\*?\})/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: 'html',
          value: content.substring(lastIndex, match.index)
        });
      }

      const matchedStr = match[0];
      let formula = matchedStr;
      let isBlock = false;

      if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$')) {
        formula = matchedStr.slice(2, -2);
        isBlock = true;
      } else if (matchedStr.startsWith('\\begin{')) {
        formula = matchedStr;
        isBlock = true;
      } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$')) {
        formula = matchedStr.slice(1, -1);
        if (formula.includes('\\begin{') || formula.includes('\\\\')) {
          isBlock = true;
        }
      }

      tokens.push({
        type: 'math',
        value: sanitizeFormula(formula),
        displayMode: isBlock
      });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      tokens.push({
        type: 'html',
        value: content.substring(lastIndex)
      });
    }

    return (
      <span className="math-rendered leading-relaxed">
        {tokens.map((token, idx) => {
          if (token.type === 'math') {
            try {
              const html = katex.renderToString(token.value, {
                displayMode: token.displayMode,
                throwOnError: false,
                errorColor: '#111827',
                strict: false,
                trust: true,
                output: 'htmlAndMathml'
              });
              return (
                <span
                  key={idx}
                  className={token.displayMode ? 'block my-1 text-center overflow-x-auto' : 'inline-block mx-0.5 align-middle'}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            } catch (e) {
              return <span key={idx} className="font-mono text-xs">{token.value}</span>;
            }
          }

          // HTML / Text token: clean orphaned $ artifacts and convert \n to <br/>
          const cleanText = token.value.replace(/(?:^|\s)\$\s*(?:$|\s)/g, ' ');
          const formattedHtml = cleanText.replace(/\n/g, '<br/>');
          return (
            <span
              key={idx}
              dangerouslySetInnerHTML={{ __html: formattedHtml }}
            />
          );
        })}
      </span>
    );
  } catch (err) {
    console.warn('renderMathContent error:', err);
    return <span>{rawStr}</span>;
  }
}

export default function MathView({ content, className = '' }) {
  const rendered = useMemo(() => renderMathContent(content), [content]);
  return <div className={`math-content ${className}`}>{rendered}</div>;
}

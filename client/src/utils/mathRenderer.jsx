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

const MARKS_CDN_BASE = 'https://cdn-question-pool.getmarks.app';

/**
 * Resolves any image URL (relative, protocol-relative, or entity-encoded) to a clean absolute HTTPS URL.
 */
function resolveImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return null; // Return null so callers preserve data/blob URIs as-is
  }

  // If already proxied, extract the inner destination URL
  if (trimmed.includes('/api/proxy-image?url=')) {
    try {
      const match = trimmed.match(/[?&]url=([^&]+)/);
      if (match && match[1]) {
        trimmed = decodeURIComponent(match[1]);
      }
    } catch {
      // keep trimmed
    }
  }

  // Unescape HTML entities that break AWS S3 presigned URLs (e.g. &amp;Signature -> &Signature)
  trimmed = trimmed
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&quot;/g, '')
    .replace(/&#39;/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  try {
    if (trimmed.startsWith('//')) {
      return `https:${trimmed}`;
    }
    if (trimmed.startsWith('http://')) {
      return `https://${trimmed.slice(7)}`;
    }
    if (trimmed.startsWith('https://')) {
      // If it erroneously points to production.getmarks.app for an upload/image, reroute to CDN
      if (trimmed.includes('production.getmarks.app/uploads/') || trimmed.includes('production.getmarks.app/question-pool/')) {
        return trimmed.replace('production.getmarks.app', 'cdn-question-pool.getmarks.app');
      }
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      return `${MARKS_CDN_BASE}${trimmed}`;
    }
    return `${MARKS_CDN_BASE}/${trimmed.replace(/^(\.\/)+/, '')}`;
  } catch {
    return `${MARKS_CDN_BASE}/${trimmed.replace(/^(\.\/)+/, '')}`;
  }
}

/**
 * Proxies and repairs <img> tags so diagrams render reliably both in print, offline HTML, and screen.
 * - Extracts URLs from src, data-src, data-original, data-url, or data-lazy-src
 * - Sets referrerpolicy="no-referrer" to prevent CloudFront 403 Forbidden hotlink errors
 * - Automatically falls back to /api/proxy-image if direct CDN loading is blocked
 */
function rewriteQuestionImages(rawHtml) {
  if (!rawHtml || typeof rawHtml !== 'string') return rawHtml || '';

  return rawHtml.replace(/<img\b([^>]*)>/gi, (match, attrs) => {
    // Extract src and any lazy-load data attributes
    const getAttr = (name) => {
      const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:(['"])(.*?)\\1|([^\\s>]+))`, 'i');
      const m = attrs.match(re);
      return m ? (m[2] !== undefined ? m[2] : m[3]) : null;
    };

    const dataSrc = getAttr('data-src') || getAttr('data-original') || getAttr('data-url') || getAttr('data-lazy-src');
    const src = getAttr('src');

    // Prefer dataSrc if src is empty or a data URI placeholder
    let candidate = src;
    if (!candidate || candidate.startsWith('data:') || candidate.startsWith('blob:')) {
      if (dataSrc) candidate = dataSrc;
    } else if (dataSrc && !dataSrc.startsWith('data:') && !dataSrc.startsWith('blob:')) {
      candidate = dataSrc;
    }

    if (!candidate) return match;

    const resolved = resolveImageUrl(candidate);
    if (!resolved) {
      if (candidate.startsWith('data:') || candidate.startsWith('blob:')) {
        return match;
      }
      return match;
    }

    const directUrl = resolved;
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(resolved)}`;

    // Strip volatile attributes to rebuild cleanly
    const cleanAttrs = attrs
      .replace(/(?:^|\s)(src|data-src|data-original|data-url|data-lazy-src|referrerpolicy|crossorigin|loading|decoding|onerror)\s*=\s*(?:(['"]).*?\2|[^\s>]+)/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Preserve or merge class
    const classMatch = cleanAttrs.match(/(?:^|\s)class\s*=\s*(?:(['"])(.*?)\1|([^\s>]+))/i);
    let classStr = 'max-w-full h-auto inline-block my-2 rounded-md shadow-xs object-contain align-middle';
    let remainingAttrs = cleanAttrs;
    if (classMatch) {
      const cls = classMatch[2] || classMatch[3] || '';
      classStr = `${cls} max-w-full h-auto object-contain`.trim();
      remainingAttrs = cleanAttrs.replace(classMatch[0], ' ').trim();
    }

    // Direct CDN load with no-referrer strips the Referer header so CloudFront returns the image directly.
    // If direct load fails (e.g. strict intranet or proxy), immediately fallback to /api/proxy-image.
    const fallbackHandler = `if(!this.dataset.proxyTried){this.dataset.proxyTried='1';this.src='${proxyUrl}';}else{this.onerror=null;}`;

    const parts = [
      `src="${directUrl}"`,
      `data-fallback-src="${proxyUrl}"`,
      `referrerpolicy="no-referrer"`,
      `crossorigin="anonymous"`,
      `loading="eager"`,
      `decoding="async"`,
      `onerror="${fallbackHandler}"`,
      `class="${classStr}"`,
      remainingAttrs
    ].filter(Boolean).join(' ');

    return `<img ${parts} />`;
  });
}

/**
 * Thoroughly sanitizes and repairs LaTeX formula syntax so KaTeX never throws or shows errors.
 */
function sanitizeFormula(rawFormula) {
  if (!rawFormula) return '';
  let f = String(rawFormula).trim();

  // 1. Convert breaks inside math mode to LaTeX newlines or spaces (never print '< br/ >')
  f = f.replace(/<\s*br\s*\/?\s*>/gi, '\\\\ ');
  f = f.replace(/&lt;\s*br\s*\/?\s*&gt;/gi, '\\\\ ');

  // 2. Strip HTML tags (including <img>, <span>, <p>) from inside math mode,
  // while carefully preserving mathematical inequalities like '< 4' or '> 0'!
  f = f.replace(/<\/?(span|p|div|b|i|u|strong|em|font|table|tr|td|th|tbody|thead|sup|sub|center|h[1-6]|ul|ol|li|img)[^>]*>/gi, '');

  // 3. Strip unescaped dollar signs from inside math mode
  f = f.replace(/(?<!\\)\$/g, '');

  // 4. Decode HTML entities that may have leaked into math mode
  f = f.replace(/&amp;/g, '&')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'")
       .replace(/&nbsp;/g, ' ');

  // 5. Fix common MARKS App database quirks
  f = f.replace(/\\mathrm\{~([a-zA-Z0-9]+)\}/g, '\\mathrm{$1}');

  // 6. Fix unescaped percentage signs
  f = f.replace(/(?<!\\)%/g, '\\%');

  // 7. Balance mismatched \left and \right delimiters (prevents KaTeX ParseError: \right without \left)
  const leftMatches = (f.match(/\\left(?=[^a-zA-Z]|$)/g) || []).length;
  const rightMatches = (f.match(/\\right(?=[^a-zA-Z]|$)/g) || []).length;
  if (rightMatches > leftMatches) {
    f = '\\left.' + f;
  } else if (leftMatches > rightMatches) {
    f = f + '\\right.';
  }

  // 8. Balance unclosed braces
  const openBraces = (f.match(/\{/g) || []).length;
  const closeBraces = (f.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    f = f + '}'.repeat(openBraces - closeBraces);
  } else if (closeBraces > openBraces) {
    for (let i = 0; i < (closeBraces - openBraces); i++) {
      const lastIdx = f.lastIndexOf('}');
      if (lastIdx !== -1) f = f.slice(0, lastIdx) + f.slice(lastIdx + 1);
    }
  }

  // 9. Balance unclosed environments
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
 * Normalizes MARKS App raw text, isolating <img> tags from LaTeX delimiters,
 * standardizing LaTeX delimiters \(...\) and \[...\],
 * splitting oversized $ wrappers around HTML tags, and isolating LaTeX environments.
 */
function preprocessMarksContent(rawStr) {
  if (!rawStr) return '';
  let content = String(rawStr);

  // 1. Normalize malformed breaks & double-escaped HTML entities
  content = content.replace(/&amp;lt;/gi, '<').replace(/&amp;gt;/gi, '>');
  content = content.replace(/&lt;\s*br\s*\/?\s*&gt;/gi, '<br/>');
  content = content.replace(/<\s*br\s*\/?\s*>/gi, '<br/>');
  content = content.replace(/&nbsp;/gi, ' ');

  // 2. Standardize LaTeX delimiters \( ... \) -> $ ... $ and \[ ... \] -> $$ ... $$
  content = content.replace(/\\\[([\s\S]*?)\\\]/g, (_m, g) => `$$${g}$$`);
  content = content.replace(/\\\(([\s\S]*?)\\\)/g, (_m, g) => `$${g}$`);

  // 3. CRITICAL: Separate <img> tags from inside math mode!
  // e.g. "$ formula1 <img src='...' /> formula2 $" -> "$ formula1 $ <img src='...' /> $ formula2 $"
  content = content.replace(/(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g, (match) => {
    if (!match.includes('<img')) return match;
    const isBlock = match.startsWith('$$');
    const delim = isBlock ? '$$' : '$';
    const inner = isBlock ? match.slice(2, -2) : match.slice(1, -1);
    const parts = inner.split(/(<img\b(?:[^>"']|"[^"]*"|'[^']*')*\/?>)/gi);
    return parts.map(part => {
      if (!part) return '';
      if (part.startsWith('<img')) return part;
      const trimmed = part.trim();
      return trimmed ? `${delim}${trimmed}${delim}` : '';
    }).join(' ');
  });

  // 4. Handle cases where $...$ or $$...$$ improperly wraps across HTML <br/> breaks
  content = content.replace(/(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g, (match) => {
    const isBlock = match.startsWith('$$');
    const inner = isBlock ? match.slice(2, -2) : match.slice(1, -1);
    if (inner.includes('<br/>')) {
      const parts = inner.split(/<br\/>/g);
      return parts.map(part => {
        let p = part.trim();
        if (!p) return '';
        if (p.includes('\\begin{') && p.includes('\\end{')) {
          p = p.replace(/\$/g, '').trim();
          return `$$${p}$$`;
        }

        const textStripped = p.replace(/\\text\s*\{[^}]*\}/g, '');
        const words = textStripped.match(/[a-zA-Z]{3,}/g) || [];
        const mathKeywords = new Set([
          'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'lim', 'max', 'min', 'det',
          'exp', 'deg', 'dim', 'ker', 'gcd', 'lcm', 'sqrt', 'frac', 'mathrm', 'mathbf', 'mathit',
          'mathbb', 'mathcal', 'right', 'left', 'begin', 'aligned', 'matrix', 'cases', 'theta',
          'alpha', 'beta', 'lambda', 'omega', 'phi', 'psi', 'rho', 'sigma', 'tau', 'mu', 'nu',
          'pi', 'eta', 'zeta', 'delta', 'gamma'
        ]);
        const proseWords = words.filter(w => !mathKeywords.has(w.toLowerCase()));

        if (proseWords.length >= 2) {
          let prose = p;
          prose = prose.replace(/(?<!\$)\\([a-zA-Z]+(?:\s*\{[^}]*\})*)(?!\$)/g, (m) => `$${m}$`);
          prose = prose.replace(/(?<![\\\$a-zA-Z])([A-Z](?:_\{?[0-9a-zA-Z]+\}?)?)(?![a-zA-Z\$])/g, (m) => `$${m}$`);
          return prose;
        }

        p = p.replace(/\$/g, '').trim();
        return isBlock ? `$$${p}$$` : `$${p}$`;
      }).join('<br/>');
    }
    return match;
  });

  // 5. Wrap naked LaTeX math in non-delimited segments
  // Split strictly by existing $ delimiters, <br/> tags, AND <img> tags so HTML is NEVER mangled!
  const segments = content.split(/(\$\$[\s\S]*?\$\$|\$[^$]+?\$|<br\/>|<img\b(?:[^>"']|"[^"]*"|'[^']*')*\/?>)/g);
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg || seg.startsWith('$') || seg === '<br/>' || seg.startsWith('<img')) continue;

    if (/\\[a-zA-Z]+/.test(seg)) {
      const textStripped = seg.replace(/\\text\s*\{[^}]*\}/g, '');
      const words = textStripped.match(/[a-zA-Z]{3,}/g) || [];
      const mathKeywords = new Set([
        'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'lim', 'max', 'min', 'det',
        'exp', 'deg', 'dim', 'ker', 'gcd', 'lcm', 'sqrt', 'frac', 'mathrm', 'mathbf', 'mathit',
        'mathbb', 'mathcal', 'right', 'left', 'begin', 'aligned', 'matrix', 'cases', 'theta',
        'alpha', 'beta', 'lambda', 'omega', 'phi', 'psi', 'rho', 'sigma', 'tau', 'mu', 'nu',
        'pi', 'eta', 'zeta', 'delta', 'gamma'
      ]);
      const proseWords = words.filter(w => !mathKeywords.has(w.toLowerCase()));

      if (proseWords.length <= 1 && seg.trim().length > 3) {
        segments[i] = `$$${seg.trim()}$$`;
      } else {
        // Use replacer functions to safely preserve backslashes and prevent JS '$' substitution bugs
        segments[i] = seg.replace(/([a-zA-Z0-9_\{\}\^:]+\s*=\s*\\(?:left)?\\?\{[^$]+?\\(?:right)?\\?\})/g, (m) => `$${m}$`)
                         .replace(/\\(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega|sqrt|frac|pm|mp|times|div|le|ge|ne|approx|equiv|partial|nabla|infty|int|sum|prod|cup|cap|subset|subseteq|notin|to|rightarrow|leftarrow|leftrightarrow|dots|cdots|ldots|cdot|circ|degree)\b(?:\s*\{[^}]*\})?/g, (m) => `$${m}$`);
      }
    }
  }
  content = segments.join('');

  if (!content.includes('$$') && /\\begin\{(?:aligned|align|matrix|pmatrix|bmatrix|cases|array|gather|equation)\*?\}/.test(content)) {
    content = content.replace(/(\\begin\{(?:aligned|align|matrix|pmatrix|bmatrix|cases|array|gather|equation)\*?\}[\s\S]*?\\end\{(?:aligned|align|matrix|pmatrix|bmatrix|cases|array|gather|equation)\*?\})/g, (_m, block) => `$$${block}$$`);
  }

  return content;
}

/**
 * Parses a string containing LaTeX, HTML tags, and diagrams into safely rendered React nodes with KaTeX.
 */
export function renderMathContent(rawInput) {
  const rawStr = toSafeString(rawInput);
  if (!rawStr.trim()) return null;

  try {
    const proxied = rewriteQuestionImages(rawStr);
    const content = preprocessMarksContent(proxied);

    const tokens = [];
    // Tokenize string by math delimiters AND <img> tags to guarantee images are never parsed as math
    const regex = /(\$\$[\s\S]*?\$\$|\$([^$]+?)\$|\\begin\{(?:aligned|align|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|array|gather|equation|split|multline)\*?\}[\s\S]*?\\end\{(?:aligned|align|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|array|gather|equation|split|multline)\*?\}|<img\b(?:[^>"']|"[^"]*"|'[^']*')*\/?>)/g;
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
      if (matchedStr.startsWith('<img')) {
        tokens.push({ type: 'html', value: matchedStr });
      } else {
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
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      tokens.push({
        type: 'html',
        value: content.substring(lastIndex)
      });
    }

    return (
      <span className="math-rendered leading-relaxed inline-block max-w-full">
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
            } catch {
              return <span key={idx} className="font-mono text-xs">{token.value}</span>;
            }
          }

          // HTML token: contains text, formatting, or safely proxied <img>
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

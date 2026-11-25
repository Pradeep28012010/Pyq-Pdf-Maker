import React, { useMemo } from 'react';
import katex from 'katex';

const MARKS_CDN_BASE = 'https://cdn-question-pool.getmarks.app';

const ENV_LIST = 'aligned|align|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|array|gather|split|equation|multline';

const TWO_LETTER_ENGLISH = new Set([
  'in', 'or', 'of', 'on', 'if', 'is', 'it', 'be', 'as', 'at', 'by', 'so', 'to', 'we', 'an', 'no', 'do', 'my', 'up', 'he', 'me', 'us'
]);

const MATH_FUNCS = new Set([
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'sinh', 'cosh', 'tanh', 'coth',
  'arcsin', 'arccos', 'arctan', 'log', 'ln', 'lg', 'exp', 'det', 'lim', 'sqrt', 'frac', 'dfrac',
  'theta', 'alpha', 'beta', 'lambda', 'omega', 'phi', 'psi', 'rho', 'sigma', 'tau', 'mu', 'nu',
  'pi', 'eta', 'zeta', 'delta', 'gamma', 'chi', 'iota', 'kappa', 'xi', 'upsilon', 'epsilon'
]);

const COMMON_ENGLISH_WORDS = new Set([
  'to', 'in', 'or', 'and', 'for', 'not', 'as', 'at', 'by', 'of', 'on', 'if', 'is', 'it', 'be', 'are',
  'with', 'from', 'using', 'about', 'without', 'let', 'the', 'can', 'so', 'then', 'here', 'also',
  'where', 'when', 'that', 'this', 'these', 'those', 'such', 'given', 'find', 'calculate', 'which',
  'what', 'how', 'than', 'into', 'under', 'over', 'between', 'through', 'during', 'before', 'after',
  'above', 'below', 'each', 'all', 'any', 'both', 'few', 'more', 'most', 'other', 'some', 'only',
  'equals', 'equal', 'simplifies', 'simplified', 'putting', 'solving', 'we', 'get', 'have', 'respectively',
  'roots', 'root', 'minimum', 'maximum', 'value', 'values', 'product', 'sum', 'first', 'terms', 'ratio', 'whose',
  'distinct', 'equation', 'sets', 'eccentricity', 'eccentricities', 'hyperbola', 'hyperbolas', 'ellipse',
  'consider', 'quadratic', 'per', 'question', 'integral', 'possible', 'number', 'statement',
  'since', 'hence', 'because', 'therefore', 'cannot', 'could', 'would', 'should', 'case',
  'protons', 'involve', 'hydrogen', 'bonding', 'similarly', 'acceptable', 'solutions', 'solution',
  'reactions', 'reaction', 'taking', 'intersection', 'rejected', 'possible', 'exists', 'exist'
]);

const SENTENCE_STARTERS = new Set([
  'let', 'be', 'such', 'that', 'then', 'equals', 'equal', 'consider', 'find', 'given', 'where',
  'since', 'hence', 'because', 'therefore', 'which', 'what', 'when', 'now', 'so', 'show',
  'calculate', 'determine', 'assume', 'suppose', 'respectively', 'statement', 'using', 'putting',
  'case', 'similarly', 'taking', 'only', 'maximum', 'minimum', 'sum', 'product'
]);

/**
 * Safely extracts string representation from any input.
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

function getAuthToken() {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('marks_app_auth_token') || '';
    }
  } catch {
    // Ignore storage access errors
  }
  return '';
}

/**
 * Resolves any image URL (relative, protocol-relative, or entity-encoded) to a clean absolute HTTPS URL.
 */
function resolveImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return null;
  }

  // If already proxied, extract the inner destination URL
  if (trimmed.includes('/api/proxy-image?url=')) {
    try {
      const idx = trimmed.indexOf('url=');
      let inner = trimmed.slice(idx + 4);
      const tokenIdx = inner.indexOf('&token=');
      if (tokenIdx !== -1) inner = inner.slice(0, tokenIdx);
      trimmed = decodeURIComponent(inner);
    } catch {
      // Keep trimmed
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
    if (trimmed.startsWith('//')) return `https:${trimmed}`;
    if (trimmed.startsWith('http://')) return `https://${trimmed.slice(7)}`;
    if (trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/')) return `${MARKS_CDN_BASE}${trimmed}`;
    return `${MARKS_CDN_BASE}/${trimmed.replace(/^(\.\/)+/, '')}`;
  } catch {
    return `${MARKS_CDN_BASE}/${trimmed.replace(/^(\.\/)+/, '')}`;
  }
}

/**
 * Routes <img> tags through the same-origin proxy first (with auth token) and falls back cleanly
 * to the direct URL without crossorigin restrictions if the proxy returns 404.
 */
function rewriteQuestionImages(rawHtml) {
  if (!rawHtml || typeof rawHtml !== 'string') return rawHtml || '';

  return rawHtml.replace(/<img\b([^>]*)>/gi, (match, attrs) => {
    const getAttr = (name) => {
      const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:(['"])(.*?)\\1|([^\\s>]+))`, 'i');
      const m = attrs.match(re);
      return m ? (m[2] !== undefined ? m[2] : m[3]) : null;
    };

    const dataSrc = getAttr('data-src') || getAttr('data-original') || getAttr('data-url') || getAttr('data-lazy-src');
    const src = getAttr('src');

    let candidate = src;
    if (!candidate || candidate.startsWith('data:') || candidate.startsWith('blob:')) {
      if (dataSrc) candidate = dataSrc;
    } else if (dataSrc && !dataSrc.startsWith('data:') && !dataSrc.startsWith('blob:')) {
      candidate = dataSrc;
    }

    if (!candidate) return match;

    const resolved = resolveImageUrl(candidate);
    if (!resolved) return match;

    const directUrl = resolved;
    const token = getAuthToken();
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(resolved)}${tokenParam}`;

    const cleanAttrs = attrs
      .replace(/(?:^|\s)(src|data-src|data-original|data-url|data-lazy-src|data-fallback-src|referrerpolicy|crossorigin|loading|decoding|onerror)\s*=\s*(?:(['"]).*?\2|[^\s>]+)/gi, ' ')
      .replace(/\s*\/\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim();

    const classMatch = cleanAttrs.match(/(?:^|\s)class\s*=\s*(?:(['"])(.*?)\1|([^\s>]+))/i);
    let classStr = 'max-w-full h-auto inline-block my-1.5 rounded-md object-contain align-middle';
    let remainingAttrs = cleanAttrs;
    if (classMatch) {
      const cls = classMatch[2] || classMatch[3] || '';
      classStr = `${cls} max-w-full h-auto object-contain`.trim();
      remainingAttrs = cleanAttrs.replace(classMatch[0], ' ').replace(/\s*\/\s*$/, '').trim();
    }

    // Use data-fallback-src inside onerror to avoid quote-escaping vulnerabilities and ensure CORS-free direct retry
    const fallbackHandler = "if(!this.dataset.directTried){this.dataset.directTried='1';this.src=this.dataset.fallbackSrc;}else{this.onerror=null;}";
    const safeDirectAttr = directUrl.replace(/"/g, '&quot;');

    const parts = [
      `src="${proxyUrl}"`,
      `data-fallback-src="${safeDirectAttr}"`,
      `referrerpolicy="no-referrer"`,
      `loading="eager"`,
      `decoding="sync"`,
      `onerror="${fallbackHandler}"`,
      `class="${classStr}"`,
      remainingAttrs
    ].filter(Boolean).join(' ');

    return `<img ${parts} />`;
  });
}

/**
 * Checks whether a token represents an English prose word (preserving chemistry formulas like NO, HCl, NiS).
 */
function isProseWord(word) {
  if (!word || typeof word !== 'string') return false;
  const w = word.trim().replace(/^[.,;:!?()"\[\]{}'"]+|[.,;:!?()"\[\]{}'"]+$/g, '').trim();
  if (w.length < 2) return false;
  if (/^_{2,}$/.test(w)) return true;
  if (w.includes('\\') || /[_\^=+\-*/><~|]/.test(w)) return false;
  if (!/^[a-zA-Z]+$/.test(w)) return false;

  // All-uppercase (NO, CO, LHS, RHS) or mixed CamelCase chemistry species (NiS, HCl, NaCl, MeOH) are formulas/labels, not prose
  if (/^[A-Z]{2,}$/.test(w)) return false;
  if (/[a-z][A-Z]/.test(w)) return false;

  if (w.length === 2) {
    // Allow lowercase 2-letter words or Titlecase at sentence start (e.g. "In", "If", "As"),
    // except chemical symbols when not in common sentence starters
    return TWO_LETTER_ENGLISH.has(w.toLowerCase());
  }

  if (MATH_FUNCS.has(w.toLowerCase())) return false;
  return true;
}

/**
 * Checks whether a math-delimited snippet mistakenly contains genuine English sentences.
 */
function hasProsePhrases(text) {
  if (!text || typeof text !== 'string') return false;
  // Ignore content inside \text{...}, \mathrm{...}, \mathbf{...}
  const stripped = text.replace(/\\(?:text|mathrm|mathbf|mathit)\s*\{[^}]*\}/g, ' ');
  const matches = stripped.match(/(?:^|[^\\a-zA-Z])\b([a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,}){1,})\b/g);
  if (!matches) return false;

  for (const seg of matches) {
    const words = seg.trim().split(/\s+/).filter(Boolean);
    const proseWords = words.filter(w => {
      const lw = w.toLowerCase();
      if (/^[A-Z]{2,}$/.test(w) || /[a-z][A-Z]/.test(w)) return false;
      if (MATH_FUNCS.has(lw)) return false;
      return COMMON_ENGLISH_WORDS.has(lw) || w.length >= 3;
    });
    if (proseWords.length >= 2) return true;
  }
  return false;
}

/**
 * Detects whether an extracted formula string is actually an English sentence mistakenly inside $...$.
 */
function isAccidentalProseInMath(formula) {
  if (!formula || typeof formula !== 'string') return false;
  if (new RegExp(`\\\\begin\\{(?:${ENV_LIST})\\*?\\}`).test(formula)) return false;

  const stripped = formula.replace(/\\(?:text|mathrm|mathbf|mathit)\s*\{[^}]*\}/g, ' ');
  const tokens = stripped.trim().split(/\s+/).filter(Boolean);
  const proseCount = tokens.filter(t => isProseWord(t)).length;

  const hasLaTeX = /\\[a-zA-Z]+/.test(stripped);
  const hasMathOps = /[_\^=+\-*/><]/.test(stripped);

  // Pure English multi-word text with no math commands or operators (e.g. "The number of protons that do not involve...")
  if (!hasLaTeX && !hasMathOps && proseCount >= 2) return true;
  // Mixed accidental span with >= 4 English words not wrapped in \text{}
  if (proseCount >= 4 && (!hasLaTeX || tokens.length >= 5)) return true;

  return false;
}

/**
 * Converts MathML XML blocks (<math>...</math>) to standard LaTeX $...$.
 */
function convertMathMLToLatex(rawStr) {
  if (!rawStr || typeof rawStr !== 'string') return rawStr || '';
  if (!/<\s*\/?\s*math\b/i.test(rawStr)) return rawStr;

  function nodeToLatex(node) {
    if (!node) return '';
    if (node.nodeType === 3) return node.nodeValue || '';
    const tag = (node.tagName || '').toLowerCase();
    const children = Array.from(node.childNodes || []);

    switch (tag) {
      case 'math':
      case 'mrow':
      case 'mstyle':
      case 'semantics':
        return children.map(nodeToLatex).join('');
      case 'annotation':
        return '';
      case 'mi':
      case 'mn':
      case 'mo': {
        const txt = children.map(nodeToLatex).join('').trim();
        if (!txt || txt === '&nbsp;') return ' ';
        return ` ${txt} `;
      }
      case 'mtext':
        return `\\text{${children.map(nodeToLatex).join('')}}`;
      case 'mspace':
        return ' ';
      case 'msup': {
        const el = Array.from(node.children || []);
        return `{${(el[0] ? nodeToLatex(el[0]) : '').trim()}}^{${(el[1] ? nodeToLatex(el[1]) : '').trim()}}`;
      }
      case 'msub': {
        const el = Array.from(node.children || []);
        return `{${(el[0] ? nodeToLatex(el[0]) : '').trim()}}_{${(el[1] ? nodeToLatex(el[1]) : '').trim()}}`;
      }
      case 'msubsup': {
        const el = Array.from(node.children || []);
        return `{${(el[0] ? nodeToLatex(el[0]) : '').trim()}}_{${(el[1] ? nodeToLatex(el[1]) : '').trim()}}^{${(el[2] ? nodeToLatex(el[2]) : '').trim()}}`;
      }
      case 'mfrac': {
        const el = Array.from(node.children || []);
        return `\\frac{${(el[0] ? nodeToLatex(el[0]) : '').trim()}}{${(el[1] ? nodeToLatex(el[1]) : '').trim()}}`;
      }
      case 'msqrt':
        return `\\sqrt{${children.map(nodeToLatex).join('').trim()}}`;
      case 'mroot': {
        const el = Array.from(node.children || []);
        return `\\sqrt[${(el[1] ? nodeToLatex(el[1]) : '').trim()}]{${(el[0] ? nodeToLatex(el[0]) : '').trim()}}`;
      }
      case 'mfenced': {
        const open = node.getAttribute('open') || '(';
        const close = node.getAttribute('close') || ')';
        return `\\left${open} ${children.map(nodeToLatex).join('')} \\right${close}`;
      }
      case 'mtable': {
        const rows = Array.from(node.querySelectorAll('mtr'));
        if (rows.length === 0) return children.map(nodeToLatex).join('');
        const rowStrs = rows.map(r => Array.from(r.querySelectorAll('mtd')).map(nodeToLatex).join(' & '));
        return `\\begin{matrix} ${rowStrs.join(' \\\\ ')} \\end{matrix}`;
      }
      case 'mtr':
        return Array.from(node.children || []).map(nodeToLatex).join(' & ');
      case 'mtd':
        return children.map(nodeToLatex).join('');
      default:
        return children.map(nodeToLatex).join('');
    }
  }

  let str = rawStr;
  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      str = str.replace(/<math\b[^>]*>[\s\S]*?<\/math>/gi, (match) => {
        try {
          let doc = parser.parseFromString(match, 'application/xml');
          if (doc.querySelector('parsererror')) {
            doc = parser.parseFromString(match, 'text/html');
          }
          const mathEl = doc.querySelector('math');
          if (!mathEl) return match;
          const latex = nodeToLatex(mathEl).replace(/\s+/g, ' ').trim();
          return latex ? `$${latex}$` : '';
        } catch {
          return match;
        }
      });
      if (!/<\s*math\b/i.test(str)) return str;
    } catch {
      // Fall through to pure-string fallback
    }
  }

  function parseMathMLFragment(xml) {
    let res = xml;
    let prev;
    let iter = 0;
    while (prev !== res && iter < 30) {
      prev = res;
      iter++;
      res = res.replace(/<mi\b[^>]*>([\s\S]*?)<\/mi>/gi, (_m, g) => ` ${g.trim()} `);
      res = res.replace(/<mn\b[^>]*>([\s\S]*?)<\/mn>/gi, (_m, g) => ` ${g.trim()} `);
      res = res.replace(/<mo\b[^>]*>([\s\S]*?)<\/mo>/gi, (_m, g) => {
        let op = g.trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        return ` ${op} `;
      });
      res = res.replace(/<mtext\b[^>]*>([\s\S]*?)<\/mtext>/gi, (_m, g) => `\\text{${g.trim()}}`);
      res = res.replace(/<mspace\b[^>]*\/?>/gi, ' ');
      res = res.replace(/<msqrt\b[^>]*>([\s\S]*?)<\/msqrt>/gi, (_m, g) => `\\sqrt{${g.trim()}}`);
      res = res.replace(/<msup\b[^>]*>\s*([^{\s<]+|\{[^{}]*\})\s*([^{\s<]+|\{[^{}]*\})\s*<\/msup>/gi, (_m, b, e) => `{${b.trim()}}^{${e.trim()}}`);
      res = res.replace(/<msub\b[^>]*>\s*([^{\s<]+|\{[^{}]*\})\s*([^{\s<]+|\{[^{}]*\})\s*<\/msub>/gi, (_m, b, s) => `{${b.trim()}}_{${s.trim()}}`);
      res = res.replace(/<mfrac\b[^>]*>\s*([^{\s<]+|\{[^{}]*\})\s*([^{\s<]+|\{[^{}]*\})\s*<\/mfrac>/gi, (_m, n, d) => `\\frac{${n.trim()}}{${d.trim()}}`);
      res = res.replace(/<\/?(?:mrow|mstyle|semantics|annotation|math)\b[^>]*>/gi, '');
    }
    return res.replace(/<\/?m[a-z]+\b[^>]*>/gi, '').replace(/\s+/g, ' ').trim();
  }

  return str.replace(/<math\b[^>]*>([\s\S]*?)<\/math>/gi, (_m, inner) => {
    const latex = parseMathMLFragment(inner);
    return latex ? `$${latex}$` : '';
  });
}

/**
 * Pairs outer \begin{env} with its true outer \end{env} by tracking nesting depth,
 * strips nested redundant declarations, breaks horizontal multi-step '&' chains vertically
 * so equations fit cleanly within 2-column print sheets, and strips orphan \end{env} tags.
 */
function flattenEnvironments(text) {
  if (!text || typeof text !== 'string') return text || '';
  const envPattern = new RegExp(`\\\\begin\\{(${ENV_LIST})\\*?\\}`, 'i');

  // Repair corrupted \frac{num}\end{aligned} }{den} or mid-fraction aligned tags from MARKS export
  let res = text
    .replace(/\\frac\s*\{([\s\S]*?)\\end\{aligned\*?\}\s*\}\s*\{([^}]*)\}/gi, (_m, num, den) => {
      const cleanNum = num.replace(/\\(?:begin|end)\{aligned\*?\}/gi, '').replace(/&/g, ' ').replace(/\}+\s*$/, '');
      return `\\frac{${cleanNum}}{${den}}`;
    })
    .replace(/\\end\{aligned\*?\}\s*\\begin\{aligned\*?\}/gi, ' \\\\ ');
  let idx = 0;
  let safety = 0;

  while (safety < 100) {
    safety++;
    const match = res.slice(idx).match(envPattern);
    if (!match) break;

    const startPos = idx + match.index;
    const envName = match[1];
    const openTag = match[0];
    const closePattern = new RegExp(`\\\\end\\{${envName}\\*?\\}`, 'i');
    const openPattern = new RegExp(`\\\\begin\\{${envName}\\*?\\}`, 'i');

    let depth = 1;
    let curr = startPos + openTag.length;
    let endPos = -1;
    let actualCloseLen = (`\\end{${envName}}`).length;

    while (curr < res.length && depth > 0) {
      const rest = res.slice(curr);
      const nextOpen = rest.search(openPattern);
      const nextClose = rest.search(closePattern);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        const om = rest.match(openPattern);
        curr += nextOpen + (om ? om[0].length : openTag.length);
      } else {
        depth--;
        const cm = rest.match(closePattern);
        const matchLen = cm ? cm[0].length : actualCloseLen;
        curr += nextClose + matchLen;
        if (depth === 0) {
          endPos = curr;
          actualCloseLen = matchLen;
        }
      }
    }

    if (endPos !== -1) {
      const inner = res.slice(startPos + openTag.length, endPos - actualCloseLen);
      let cleanInner = inner
        .replace(new RegExp(`\\\\begin\\{${envName}\\*?\\}`, 'gi'), ' ')
        .replace(new RegExp(`\\\\end\\{${envName}\\*?\\}`, 'gi'), ' ')
        .replace(/<\s*br\s*\/?\s*>/gi, ' \\\\ ')
        .trim();

      // Break multi-step single-row '&' derivations into vertical stacked rows
      if (envName.toLowerCase().startsWith('align')) {
        const rows = cleanInner.split(/\\\\|\\cr/g);
        const newRows = rows.map(row => {
          const parts = row.split('&');
          if (parts.length <= 1) return row;

          // Keep short two-part alignment rows (e.g. LHS & = RHS) together on one line
          if (parts.length === 2) {
            const p0 = parts[0].trim();
            const p1 = parts[1].trim();
            if (!p0 || /^\s*[=<>≤≥]/.test(p1) || row.length <= 42) {
              return row;
            }
            return `${p0} \\\\ & ${p1}`;
          }

          // Multi-step row with 3+ parts: stack each non-empty step on its own row
          const lines = [];
          const first = parts[0].trim();
          if (first) lines.push(first);
          for (let i = 1; i < parts.length; i++) {
            const p = parts[i].trim();
            if (p) lines.push(`& ${p}`);
          }
          return lines.join(' \\\\ ');
        });
        cleanInner = newRows.join(' \\\\ ');
      }

      // Strip accidental enclosing single/double $ right around the block
      let before = res.slice(0, startPos).replace(/\${1,2}\s*$/, '');
      let after = res.slice(endPos).replace(/^\s*\${1,2}/, '');

      // If trailing naked math is glued directly after \end{env} (e.g. \end{aligned}\frac{...}), separate cleanly
      if (/^\s*\\(?:frac|dfrac|therefore|Rightarrow|implies|sum|prod|left)/i.test(after)) {
        after = '<br/>' + after.trimStart();
      } else if (/^\S/.test(after)) {
        after = ' ' + after;
      }

      const replacement = `$$\\begin{${envName}} ${cleanInner} \\end{${envName}}$$`;
      res = before + replacement + after;
      idx = before.length + replacement.length;
    } else {
      // Unclosed \begin{env}: close it safely before HTML block tags or end of string
      const tail = res.slice(startPos + openTag.length);
      const stopMatch = tail.match(/(?:<img\b|<table\b|<\/p>|$)/i);
      const closeAt = stopMatch ? startPos + openTag.length + stopMatch.index : res.length;
      const cleanInner = res.slice(startPos + openTag.length, closeAt)
        .replace(/<\s*br\s*\/?\s*>/gi, ' \\\\ ')
        .trim();
      const replacement = `$$\\begin{${envName}} ${cleanInner} \\end{${envName}}$$`;
      res = res.slice(0, startPos) + replacement + res.slice(closeAt);
      idx = startPos + replacement.length;
    }
  }

  // Strip any orphan \end{env} tags outside $$...$$ blocks (fixes Image 7 Chemistry & Sol Q.33)
  const parts = res.split(/(\$\$[\s\S]*?\$\$)/g);
  const orphanEndRegex = new RegExp(`\\\\end\\{(?:${ENV_LIST})\\*?\\}`, 'gi');
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i].startsWith('$$')) {
      parts[i] = parts[i].replace(orphanEndRegex, ' ');
    }
  }

  return parts.join('');
}

/**
 * Normalizes \left/\right delimiter edge cases across raw text.
 */
function normalizeLeftRightDelimiters(str) {
  return str
    .replace(/\\left\s*\{/g, '\\left\\{')
    .replace(/\\right\s*\}/g, '\\right\\}')
    .replace(/\\right\s*\.\s*\}/g, '\\right.')
    .replace(/\\right\s*\./g, '\\right.')
    .replace(/\\left\s*\./g, '\\left.')
    .replace(/\\right\\(?=\s|$)/g, '\\right.')
    .replace(/\\left\\(?=\s|$)/g, '\\left.')
    .replace(/\\right(?=\s+[a-zA-Z0-9]|\s*$)/g, '\\right.')
    .replace(/\\left(?=\s+[a-zA-Z0-9]|\s*$)/g, '\\left.');
}

/**
 * Finds balanced \left ... \right pairs outside existing math/HTML and wraps them atomically in $...$.
 */
function wrapBalancedDelimiters(text) {
  if (!text || typeof text !== 'string' || !text.includes('\\left')) return text || '';

  const isolateRe = new RegExp(
    `(\\$\\$[\\s\\S]*?\\$\\$|\\\\begin\\{(?:${ENV_LIST})\\*?\\}[\\s\\S]*?\\\\end\\{(?:${ENV_LIST})\\*?\\}|\\$[^$]+?\\$|<[^>]+>)`,
    'g'
  );
  const parts = text.split(isolateRe);
  for (let p = 0; p < parts.length; p++) {
    if (!parts[p] || parts[p].startsWith('$') || parts[p].startsWith('\\begin') || parts[p].startsWith('<')) continue;
    parts[p] = wrapBalancedDelimitersSingle(parts[p]);
  }
  return parts.join('');
}

function wrapBalancedDelimitersSingle(text) {
  if (!text.includes('\\left')) return text;

  const leftPattern = /(?<!\$)(?:(?:\\mathrm\{[A-Za-z0-9]+\}|[A-Za-z0-9_]+)\s*=\s*)?\\left\s*(?:\\[{}|]|[\(\)\[\]|.])/;
  const anyLeftPattern = /\\left\s*(?:\\[{}|]|[\(\)\[\]|.])/;
  const anyRightPattern = /\\right\s*(?:\\[{}|]|[\(\)\[\]|.])/;

  let res = text;
  let idx = 0;
  let safety = 0;

  while (safety < 150) {
    safety++;
    const match = res.slice(idx).match(leftPattern);
    if (!match) break;

    const startPos = idx + match.index;
    let curr = startPos + match[0].length;
    let depth = 1;
    let endPos = -1;

    while (curr < res.length && depth > 0) {
      const rest = res.slice(curr);
      const nextLeft = rest.search(anyLeftPattern);
      const nextRight = rest.search(anyRightPattern);

      if (nextRight === -1) break;

      if (nextLeft !== -1 && nextLeft < nextRight) {
        depth++;
        const m = rest.match(anyLeftPattern);
        curr += nextLeft + (m ? m[0].length : 6);
      } else {
        depth--;
        const m = rest.match(anyRightPattern);
        const matchLen = m ? m[0].length : 7;
        curr += nextRight + matchLen;
        if (depth === 0) endPos = curr;
      }
    }

    if (endPos !== -1) {
      const expr = res.slice(startPos, endPos).trim();
      const replacement = ` $${expr}$ `;
      res = res.slice(0, startPos) + replacement + res.slice(endPos);
      idx = startPos + replacement.length;
    } else {
      idx = startPos + match[0].length;
    }
  }

  return res;
}

/**
 * Separates glued tokens outside HTML tags while respecting ordinals (1st, 2nd, 3rd, 4th) and chemical symbols.
 */
function preSplitGluedTokens(text) {
  if (!text || typeof text !== 'string') return text || '';
  let t = text;

  // Common author-squashed words seen in solution strings
  const gluedPhrases = [
    [/bethemaximumvalueofthesumofitsroots/gi, 'be the maximum value of the sum of its roots'],
    [/thesumofthefirstsixtermsoftheG\.?P\.?/gi, 'the sum of the first six terms of the G.P.'],
    [/whosefirsttermis/gi, 'whose first term is'],
    [/bothrootsacceptable/gi, 'both roots acceptable'],
    [/bothroots/gi, 'both roots'],
    [/isacceptable/gi, 'is acceptable'],
    [/Sumofsquareofroots/gi, 'Sum of square of roots'],
    [/Nosolutions/gi, 'No solutions'],
    [/No\.of\s*solutions/gi, 'No. of solutions'],
    [/sumofsolution/gi, 'sum of solution'],
    [/irrationalroots/gi, 'irrational roots'],
    [/wewillget/gi, 'we will get'],
    [/anon\s*-\s*constant/gi, 'a non-constant'],
    [/Usingequation/gi, 'Using equation'],
    [/Usingproductofroots/gi, 'Using product of roots'],
    [/Maximumwhen/gi, 'Maximum when'],
    [/Minimumwhen/gi, 'Minimum when'],
    [/\\textas\b/gi, ' as ']
  ];
  for (const [re, repl] of gluedPhrases) {
    t = t.replace(re, repl);
  }

  // Numbers/letters glued to capitalized or lowercase prose words (skip ordinals: 1st, 2nd, 3rd, 4th)
  t = t.replace(/([0-9])([A-Z][a-z]{2,})/g, '$1 $2');
  t = t.replace(/([0-9])(?!(?:st|nd|rd|th)\b)([a-z]{2,})/g, '$1 $2');
  t = t.replace(/([\}\)])([A-Z][a-z]{2,})/g, '$1 $2');
  t = t.replace(/([a-zA-Z])\.([A-Z][a-z]{2,})/g, '$1. $2');
  t = t.replace(/([0-9])\.([A-Z][a-z]{2,})/g, '$1. $2');

  // Number or word glued to backslash command (e.g. 20\sin -> 20 \sin, when\cos -> when \cos)
  t = t.replace(/([0-9])(\\[a-zA-Z]+)/g, '$1 $2');
  t = t.replace(/([a-zA-Z])(\\(?:sin|cos|tan|cot|sec|csc|log|ln|alpha|beta|gamma|delta|theta|frac|dfrac|sqrt|left|right|begin|end|mathrm|text|mathbf|therefore|Rightarrow))/g, '$1 $2');
  t = t.replace(/(\\(?:Rightarrow|Leftarrow|implies|iff|therefore|because))([a-zA-Z0-9])/g, '$1 $2');
  t = t.replace(/([0-9a-zA-Z\)\}])(\\(?:Rightarrow|Leftarrow|implies|iff|therefore|because))/g, '$1 $2');
  t = t.replace(/(\\(?:right[)\]\}|.]|\}))([a-zA-Z]{2,})/g, '$1 $2');
  t = t.replace(/(\\(?:alpha|beta|gamma|delta|lambda|mu|theta|phi|psi|omega|pi|tau|sigma))([a-zA-Z]{2,})/g, '$1 $2');

  // Common LaTeX syntax repairs
  t = t.replace(/(?:^|\s)\.:(?=\\[a-zA-Z]|[a-zA-Z0-9]|\s)/g, ' \\therefore ');
  t = t.replace(/\\(mathrm|mathbf|mathbb|mathit|mathsf|mathcal)\s*([a-zA-Z])(?![a-zA-Z])/g, '\\$1{$2}');
  t = t.replace(/\\(mathrm|mathbf|mathbb|mathit)\{([A-Za-z])\}\s*([0-9]+)/g, '\\$1{$2}_{$3}');
  t = t.replace(/([\^_])\s+([0-9a-zA-Z]+|\{[^{}]*\})/g, '$1{$2}');
  t = t.replace(/(\\[a-zA-Z]+|[a-zA-Z0-9])\^([0-9a-zA-Z])(?![0-9a-zA-Z])/g, '{$1}^{$2}');
  t = t.replace(/(\\[a-zA-Z]+|[a-zA-Z0-9])_([0-9a-zA-Z])(?![0-9a-zA-Z])/g, '{$1}_{$2}');
  t = t.replace(/\\sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
  t = t.replace(/\\frac([0-9])([0-9])(?![0-9])/g, '\\frac{$1}{$2}');
  t = normalizeLeftRightDelimiters(t);

  return t;
}

/**
 * Scans a non-delimited text segment and wraps only mathematical/chemical constructs in $...$
 * while preserving natural English prose spacing.
 */
function processNakedSegment(text) {
  if (!text || typeof text !== 'string') return text || '';

  const t = preSplitGluedTokens(text);
  const tokens = t.split(/(\s+)/);
  const out = [];
  let mathBuf = [];
  let depth = 0;

  const flushMath = () => {
    if (mathBuf.length === 0) return;
    let mStr = mathBuf.join('').trim();
    mathBuf = [];
    if (!mStr) return;

    let trailingPunct = '';
    const mPunct = mStr.match(/([.,;:!?]+)$/);
    if (mPunct) {
      trailingPunct = mPunct[1];
      mStr = mStr.slice(0, mStr.length - trailingPunct.length).trim();
    }

    mStr = mStr.replace(/\\(?=[^a-zA-Z{}]|$)/g, ' ').replace(/(?<!\\)\$/g, '').trim();

    if (/^_{2,}$/.test(mStr)) {
      out.push(` <span class="exam-blank"></span>${trailingPunct} `);
      return;
    }

    const hasMathSyntax = mStr.includes('\\') || /[_\^&=+\-*/><~]/.test(mStr) || /\|[^|]+\|/.test(mStr);
    if (hasMathSyntax && mStr.length > 0 && !isAccidentalProseInMath(mStr)) {
      // Multi-row or aligned chunks use display math block
      const delim = /\\\\|\\begin\{/.test(mStr) ? '$$' : '$';
      out.push(` ${delim}${mStr}${delim}${trailingPunct} `);
    } else {
      out.push(` ${mStr}${trailingPunct} `);
    }
  };

  const argGroupRegex = /\\left(?:\\[{}|]|[\(\)\[\]|.])|\\left\b|\\[a-zA-Z]+\s*\{|\^\{|_\{|\\\{/g;
  const rightRegex = /\\right(?:\\[{}|]|[\(\)\[\]|.])|\\right\b|\\\}/g;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;

    if (/^\s+$/.test(tok)) {
      if (mathBuf.length > 0) mathBuf.push(tok);
      else out.push(tok);
      continue;
    }

    const leftMatches = (tok.match(argGroupRegex) || []).length;
    const rightMatches = (tok.match(rightRegex) || []).length;
    // Count nested raw {} whenever inside a LaTeX macro/script (already depth > 0 or opened in this token)
    const active = depth + leftMatches > 0;
    const rawOpen = active ? (tok.match(/(?<!\\)\{/g) || []).length - (tok.match(/\\[a-zA-Z]+\s*\{|\^\{|_\{/g) || []).length : 0;
    const rawClose = active ? (tok.match(/(?<!\\)\}/g) || []).length : 0;
    depth += (leftMatches + Math.max(0, rawOpen)) - (rightMatches + rawClose);
    if (depth < 0) depth = 0;

    const core = tok.replace(/^[.,;:!?()"\[\]{}'"]+|[.,;:!?()"\[\]{}'"]+$/g, '');

    if (depth > 0) {
      if (SENTENCE_STARTERS.has(core.toLowerCase()) && !tok.includes('\\')) {
        depth = 0;
        flushMath();
        out.push(tok);
        continue;
      }
      const sub = tok.replace(/\band\b/g, '\\text{ and }').replace(/\bor\b/g, '\\text{ or }');
      mathBuf.push(sub);
      continue;
    }

    if (isProseWord(core)) {
      flushMath();
      out.push(tok);
    } else {
      mathBuf.push(tok);
    }
  }

  flushMath();
  return out.join('').replace(/\s+/g, ' ').trim();
}

/**
 * Sanitizes a math formula string right before KaTeX compilation so parse errors cannot leak raw markup.
 */
function sanitizeFormula(rawFormula) {
  if (!rawFormula) return '';
  let f = String(rawFormula).trim();

  // 1. Convert breaks inside math mode to LaTeX newlines & strip leaked HTML tags
  f = f.replace(/<\s*br\s*\/?\s*>/gi, ' \\\\ ');
  f = f.replace(/&lt;\s*br\s*\/?\s*&gt;/gi, ' \\\\ ');
  f = f.replace(/<\/?(span|p|div|b|i|u|strong|em|font|table|tr|td|th|tbody|thead|sup|sub|center|h[1-6]|ul|ol|li|img)[^>]*>/gi, '');

  // 2. Strip unescaped inner dollar signs & decode HTML entities
  f = f.replace(/(?<!\\)\$/g, '');
  f = f.replace(/&amp;/g, '&')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'")
       .replace(/&nbsp;/g, ' ');

  // 3. Database syntax normalization
  f = f.replace(/\\mathrm\{~([a-zA-Z0-9]+)\}/g, '\\mathrm{$1}');
  f = f.replace(/\\(mathrm|mathbf|mathbb|mathit|mathsf|mathcal)\s*([a-zA-Z])(?![a-zA-Z])/g, '\\$1{$2}');
  f = f.replace(/\\(mathrm|mathbf|mathbb|mathit)\{([A-Za-z])\}\s*([0-9]+)/g, '\\$1{$2}_{$3}');
  f = f.replace(/(?<!\\)%/g, '\\%');
  f = f.replace(/_{2,}/g, '\\underline{\\hspace{2em}}');

  // Exponents & subscripts
  f = f.replace(/([\^_])\s+([0-9a-zA-Z]+|\{[^{}]*\})/g, '$1{$2}');
  f = f.replace(/(\\[a-zA-Z]+|[a-zA-Z0-9])\^([0-9a-zA-Z])(?![0-9a-zA-Z])/g, '{$1}^{$2}');
  f = f.replace(/(\\[a-zA-Z]+|[a-zA-Z0-9])_([0-9a-zA-Z])(?![0-9a-zA-Z])/g, '{$1}_{$2}');
  f = f.replace(/\\sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
  f = f.replace(/\\frac([0-9])([0-9])(?![0-9])/g, '\\frac{$1}{$2}');
  // Repair \frac{num} missing its {den} argument (e.g. followed by \left or end of row)
  f = f.replace(/\\frac\s*(\{(?:[^{}]|\{[^{}]*\})*\})\s*(?!\{|[a-zA-Z0-9])/g, '$1 ');

  // Inequalities & shorthands
  f = f.replace(/\\gt\b/g, '>')
       .replace(/\\lt\b/g, '<')
       .replace(/\\ge\b/g, '\\geq ')
       .replace(/\\le\b/g, '\\leq ')
       .replace(/(?:^|\s)\.:(?=\\[a-zA-Z]|[a-zA-Z0-9]|\s)/g, ' \\therefore ');

  // Preserve embedded plain English phrases inside aligned environments so spaces are not collapsed
  if (/\\begin\{(?:aligned|align|cases)\*?\}/i.test(f)) {
    const protectedChunks = [];
    let shielded = f.replace(/(\\(?:text|mathrm|mathbf|mathit|begin|end)\s*\{[^}]*\})/g, (m) => {
      protectedChunks.push(m);
      return `__PROT_${protectedChunks.length - 1}__`;
    });

    // Wrap multi-word plain English runs OR isolated sentence keywords (e.g. Only, For, Similarly) in \text{ ... }
    shielded = shielded.replace(/(^|[&\s\\>])([a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,})*)(?=$|[\s\\&=0-9,(])/g, (full, pre, phrase) => {
      if (pre.endsWith('\\')) return full;
      const words = phrase.trim().split(/\s+/);
      if (words.length === 1) {
        const lw = words[0].toLowerCase();
        if ((SENTENCE_STARTERS.has(lw) || COMMON_ENGLISH_WORDS.has(lw)) && !MATH_FUNCS.has(lw) && words[0].length >= 2) {
          return `${pre}\\text{ ${words[0]} }`;
        }
        return full;
      }
      const allProse = words.every(w => !MATH_FUNCS.has(w.toLowerCase()) && (COMMON_ENGLISH_WORDS.has(w.toLowerCase()) || w.length >= 3) && !/^[A-Z]{2,}$/.test(w));
      if (allProse) {
        return `${pre}\\text{ ${phrase.trim()} }`;
      }
      return full;
    });

    f = shielded.replace(/__PROT_(\d+)__/g, (_m, idx) => protectedChunks[Number(idx)] || '');
  }

  f = f.replace(/(?<!\\text\{[^}]*)\band\b/g, '\\text{ and }')
       .replace(/(?<!\\text\{[^}]*)\bor\b/g, '\\text{ or }');

  f = normalizeLeftRightDelimiters(f);

  // Balance \left and \right delimiters (respecting backslash escapes)
  const leftCount = (f.match(/\\left(?=[^a-zA-Z]|$)/g) || []).length;
  const rightCount = (f.match(/\\right(?=[^a-zA-Z]|$)/g) || []).length;
  if (rightCount > leftCount) f = '\\left.' + f;
  else if (leftCount > rightCount) f = f + '\\right.';

  // Balance unescaped grouping braces
  let openB = 0;
  const cleanChars = [];
  for (let i = 0; i < f.length; i++) {
    const ch = f[i];
    const escaped = i > 0 && f[i - 1] === '\\';
    if (!escaped && ch === '{') {
      openB++;
      cleanChars.push(ch);
    } else if (!escaped && ch === '}') {
      if (openB > 0) {
        openB--;
        cleanChars.push(ch);
      }
    } else {
      cleanChars.push(ch);
    }
  }
  f = cleanChars.join('');
  if (openB > 0) f += '}'.repeat(openB);
  if (/^[\^_]/.test(f.trim())) f = '{}' + f.trim();

  // Merge adjacent / nested aligned environments & balance environments
  f = f.replace(/\\end\{aligned\*?\}\s*\\begin\{aligned\*?\}/gi, ' \\\\ ');
  while (/\\begin\{aligned\*?\}[\s\S]*?\\begin\{aligned\*?\}/i.test(f)) {
    f = f.replace(/(\\begin\{aligned\*?\}[\s\S]*?)\\begin\{aligned\*?\}/i, '$1 ');
  }
  while (/\\end\{aligned\*?\}[\s\S]*?\\end\{aligned\*?\}/i.test(f)) {
    f = f.replace(/\\end\{aligned\*?\}([\s\S]*?\\end\{aligned\*?\})/i, ' $1');
  }

  const envs = ['aligned', 'align', 'matrix', 'pmatrix', 'bmatrix', 'cases', 'array', 'gather', 'equation', 'split', 'multline'];
  for (const env of envs) {
    const bCount = (f.match(new RegExp(`\\\\begin\\{${env}\\*?\\}`, 'g')) || []).length;
    const eCount = (f.match(new RegExp(`\\\\end\\{${env}\\*?\\}`, 'g')) || []).length;
    if (bCount > eCount) f += `\\end{${env}}`.repeat(bCount - eCount);
    else if (eCount > bCount) f = `\\begin{${env}}`.repeat(eCount - bCount) + f;
  }

  if ((f.includes('&') || f.includes('\\\\')) && !new RegExp(`\\\\begin\\{(?:${ENV_LIST})\\*?\\}`).test(f)) {
    f = `\\begin{aligned} ${f} \\end{aligned}`;
  }

  // Strip dangling trailing relations or lone trailing backslash (preserve \\ row breaks)
  f = f.replace(/\\(cap|cup|in|subset|subseteq|times|pm|mp)\s*$/g, '');
  f = f.replace(/(?<!\\)\\(?=\s|$)/g, ' ');

  return f.trim();
}

/**
 * Normalizes MARKS App raw HTML/LaTeX/MathML content into balanced, isolated KaTeX blocks and clean HTML.
 */
function preprocessMarksContent(rawStr) {
  if (!rawStr) return '';
  let content = String(rawStr);

  // Normalize line breaks, HTML entities for real tags, and MathML blocks UPFRONT before image proxying
  content = content
    .replace(/&amp;lt;/gi, '<')
    .replace(/&amp;gt;/gi, '>')
    .replace(/&amp;quot;/gi, '"')
    .replace(/&amp;amp;/gi, '&');

  const safeTagNames = 'img|br|table|tr|td|th|tbody|thead|tfoot|col|colgroup|caption|div|p|span|b|i|u|strong|em|sub|sup|center|font|ul|ol|li|math|mrow|mi|mn|mo|msup|msub|msubsup|mfrac|msqrt|mroot|mtext|mspace|mstyle|mfenced|mtable|mtr|mtd|semantics|annotation';
  content = content.replace(
    new RegExp(`&lt;(\\s*\\/?\\s*(?:${safeTagNames})(?=\\s|\\/|&gt;)(?:[^&]|&(?!gt;))*?)&gt;`, 'gi'),
    '<$1>'
  );
  content = content.replace(/<\s*br\s*\/?\s*>/gi, '<br/>').replace(/&nbsp;/gi, ' ');

  // Convert MathML XML islands and normalize image tags AFTER HTML tag unescaping
  content = convertMathMLToLatex(content);
  content = rewriteQuestionImages(content);

  // Normalize exam blanks, Unicode math operators, and unbraced macros
  content = content
    .replace(/([a-zA-Z]+)(\\text\{\s*(?:\\?_|\s)+\s*\})/gi, '$1 $2')
    .replace(/\\text\{\s*(?:\\?_|\s)+\s*\}/gi, ' <span class="exam-blank"></span> ')
    .replace(/(?:^|\s)_{2,}(?=\s|[.,;:!?]|$)/g, ' <span class="exam-blank"></span> ')
    .replace(/[\uFFFD\u2212]/g, '-')
    .replace(/∈/g, '\\in ')
    .replace(/∉/g, '\\notin ')
    .replace(/ℕ/g, '\\mathbb{N}')
    .replace(/ℝ/g, '\\mathbb{R}')
    .replace(/ℤ/g, '\\mathbb{Z}')
    .replace(/⩽/g, '\\leq ')
    .replace(/⩾/g, '\\geq ')
    .replace(/\\fracax\^2\s*\+\s*2\(a\+1\)x\s*\+\s*9a\s*\+\s*4x\^2\s*-\s*8x\s*\+\s*32/gi, '\\frac{ax^2 + 2(a+1)x + 9a + 4}{x^2 - 8x + 32}');

  content = normalizeLeftRightDelimiters(content);

  // Standardize \[...\] and \(...\) delimiters; clean degenerate dollar lines
  content = content
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, g) => `$$${g}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, g) => `$${g}$`)
    .replace(/\${3,}/g, '$$')
    .replace(/(?:^|<br\s*\/?>|<\/?p>|\n)\s*\${1,2}\s*(?=$|<br\s*\/?>|<\/?p>|\n)/gi, ' ');

  if (content.trim().startsWith('$$') && (content.match(/\$\$/g) || []).length === 1) {
    content = content.trim() + '$$';
  }

  // Isolate <img> tags out of any math delimiters before environment flattening
  content = content.replace(/(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g, (match) => {
    if (!match.includes('<img') && !match.includes('<table')) return match;
    const delim = match.startsWith('$$') ? '$$' : '$';
    const inner = match.slice(delim.length, -delim.length);
    const parts = inner.split(/(<img\b(?:[^>"']|"[^"]*"|'[^']*')*\/?>|<table\b[\s\S]*?<\/table>)/gi);
    return parts.map(part => {
      if (!part) return '';
      if (/^<(?:img|table)\b/i.test(part)) return part;
      const trimmed = part.trim();
      return trimmed ? `${delim}${trimmed}${delim}` : '';
    }).join(' ');
  });

  // Flatten nested environments, break wide '&' rows vertically, and remove orphan \end{aligned}
  content = flattenEnvironments(content);
  content = wrapBalancedDelimiters(content);

  // Break top-level derivation \\ outside $$...$$ into HTML <br/> lines
  const dollarParts = content.split(/(\$\$[\s\S]*?\$\$)/g);
  for (let i = 0; i < dollarParts.length; i++) {
    if (!dollarParts[i].startsWith('$$')) {
      dollarParts[i] = dollarParts[i].replace(/\s*\\\\\s*/g, '<br/>');
    }
  }
  content = dollarParts.join('');

  // Unpack delimited blocks that mistakenly span <br/> or English prose
  content = content.replace(/(\$\$[\s\S]*?\$\$|\$[^$]+?\$)/g, (match) => {
    const isBlock = match.startsWith('$$');
    const inner = isBlock ? match.slice(2, -2) : match.slice(1, -1);

    if (new RegExp(`\\\\begin\\{(?:${ENV_LIST})\\*?\\}`).test(inner)) {
      return `$$${inner.replace(/<\s*br\s*\/?\s*>/gi, ' \\\\ ').trim()}$$`;
    }

    if (inner.includes('<br/>')) {
      return inner.split(/<br\/>/g).map(seg => {
        const s = seg.trim();
        if (!s) return '';
        if (hasProsePhrases(s) || isAccidentalProseInMath(s)) return processNakedSegment(s);
        return `${isBlock ? '$$' : '$'}${s}${isBlock ? '$$' : '$'}`;
      }).join('<br/>');
    }

    if (isAccidentalProseInMath(inner) || (!(/\\left\b/.test(inner) && /\\right\b/.test(inner)) && hasProsePhrases(inner))) {
      return processNakedSegment(inner);
    }

    return match;
  });

  // Process remaining naked text outside HTML tags, $$...$$, $...$, and \begin{...}...\end{...}
  const isolateRegex = new RegExp(
    `(\\$\\$[\\s\\S]*?\\$\\$|\\\\begin\\{(?:${ENV_LIST})\\*?\\}[\\s\\S]*?\\\\end\\{(?:${ENV_LIST})\\*?\\}|\\$[^$]+?\\$|<\\/?(?:[a-zA-Z][a-zA-Z0-9:-]*)\\b(?:[^>"']|"[^"]*"|'[^']*')*>)`,
    'g'
  );
  const segments = content.split(isolateRegex);
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg || seg.startsWith('$') || seg.startsWith('\\begin') || seg.startsWith('<')) continue;
    if (seg.includes('\\') || /[_\^&=+\-*/><~]/.test(seg) || /([0-9][A-Za-z]|[a-zA-Z]\.[A-Z])/.test(seg)) {
      // Preserve boundary spaces so $expr$ never merges with an adjacent $$...$$ into $$$
      segments[i] = ` ${processNakedSegment(seg)} `;
    }
  }
  content = segments.join('');

  // Balance trailing/orphan delimiters cleanly (separate adjacent $$ and $ safely)
  content = content.replace(/\$\$\$/g, '$$ $');
  content = content.replace(/\${4,}/g, '$$ $$');
  const ddCount = (content.match(/\$\$/g) || []).length;
  if (ddCount % 2 === 1) {
    content = content.replace(/([^$])\${2}\s*(?:<\/[a-zA-Z]+>|\s)*$/, '$1');
  }
  const sdCount = (content.replace(/\$\$/g, '').match(/(?<!\\)\$/g) || []).length;
  if (sdCount % 2 === 1) {
    const trimmed = content.trim();
    if (trimmed.startsWith('$') && !trimmed.slice(1).includes('$')) {
      content = trimmed + '$';
    } else {
      content = content.replace(/(?<!\\)\$\s*(?:<\/[a-zA-Z]+>|\s)*$/, '');
    }
  }

  return content.replace(/\s+/g, ' ').trim();
}

/**
 * Renders formula HTML via KaTeX with automatic syntax recovery & human-readable fallback.
 */
function renderFormulaToHtml(formula, isBlock) {
  const sanitized = sanitizeFormula(formula);
  if (!sanitized) return '';

  // Guard against plain English prose wrapped inside accidental $...$
  if (isAccidentalProseInMath(sanitized)) {
    const unpacked = processNakedSegment(sanitized);
    return unpacked.replace(/\$\$([\s\S]*?)\$\$|\$([^$]+?)\$/g, (_m, blk, inl) => {
      const inner = (blk !== undefined ? blk : inl) || '';
      try {
        return katex.renderToString(sanitizeFormula(inner), {
          displayMode: blk !== undefined,
          throwOnError: false,
          errorColor: '#111827',
          strict: false,
          trust: true,
          output: 'htmlAndMathml'
        });
      } catch {
        return inner;
      }
    });
  }

  const opts = {
    displayMode: isBlock,
    throwOnError: false,
    errorColor: '#111827',
    strict: false,
    trust: true,
    output: 'htmlAndMathml'
  };

  let res = katex.renderToString(sanitized, opts);
  if (!res.includes('katex-error')) return res;

  // Retry 1: unwrap failed aligned block into separate display lines
  if (/\\begin\{aligned\*?\}/i.test(sanitized)) {
    const rows = sanitized
      .replace(/\\begin\{aligned\*?\}/gi, '')
      .replace(/\\end\{aligned\*?\}/gi, '')
      .split(/\\\\/g)
      .map(r => r.replace(/&/g, ' ').trim())
      .filter(Boolean);

    const renderedRows = rows.map(row => {
      try {
        return katex.renderToString(sanitizeFormula(row), { ...opts, displayMode: true });
      } catch {
        return `<span>${row}</span>`;
      }
    });
    if (renderedRows.length > 0 && !renderedRows.some(r => r.includes('katex-error'))) {
      return renderedRows.join('<br/>');
    }
  }

  // Retry 2: strip stray unknown backslashes while keeping valid LaTeX commands/braces
  let cleaned = sanitized.replace(/\\(?!([a-zA-Z]+|[{}]|%|#|_|&|\$|\\))/g, ' ').trim();
  const ob = (cleaned.match(/(?<!\\)\{/g) || []).length;
  const cb = (cleaned.match(/(?<!\\)\}/g) || []).length;
  if (ob > cb) cleaned += '}'.repeat(ob - cb);

  const retry = katex.renderToString(cleaned, opts);
  if (!retry.includes('katex-error')) return retry;

  // Final readable fallback: never leave raw \begin{aligned} or \end{aligned} visible
  const readable = sanitized
    .replace(/\\(?:begin|end)\{(?:aligned|align|matrix|cases|array)\*?\}/gi, '')
    .replace(/\\(?:left|right)\s*[\\.]?/gi, '')
    .replace(/&/g, ' ')
    .replace(/\\\\/g, '<br/>')
    .trim();
  return `<span class="math-fallback">${readable}</span>`;
}

/**
 * Parses a string containing LaTeX, MathML, HTML tags, and diagrams into safely rendered React nodes.
 */
export function renderMathContent(rawInput) {
  const rawStr = toSafeString(rawInput);
  if (!rawStr.trim()) return null;

  try {
    const content = preprocessMarksContent(rawStr);
    const mathRegex = new RegExp(
      `(\\$\\$[\\s\\S]*?\\$\\$|\\$([^$]+?)\\$|\\\\begin\\{(?:${ENV_LIST})\\*?\\}[\\s\\S]*?\\\\end\\{(?:${ENV_LIST})\\*?\\})`,
      'g'
    );

    const renderedHtml = content.replace(mathRegex, (match) => {
      let formula = match;
      let isBlock = false;

      if (match.startsWith('$$') && match.endsWith('$$')) {
        formula = match.slice(2, -2);
        isBlock = true;
      } else if (match.startsWith('\\begin{')) {
        formula = match;
        isBlock = true;
      } else if (match.startsWith('$') && match.endsWith('$')) {
        formula = match.slice(1, -1);
        if (formula.includes('\\begin{') || formula.includes('\\\\')) {
          isBlock = true;
        }
      }

      try {
        return renderFormulaToHtml(formula, isBlock);
      } catch {
        return match;
      }
    });

    // Clean any leftover unescaped dollar signs & any stray orphan \end{aligned}
    const cleanHtml = renderedHtml
      .replace(/(?<!\\)\${1,3}/g, '')
      .replace(new RegExp(`\\\\end\\{(?:${ENV_LIST})\\*?\\}`, 'gi'), '');

    return (
      <span
        className="math-rendered leading-relaxed inline-block max-w-full w-full"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
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

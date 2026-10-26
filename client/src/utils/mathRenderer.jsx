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

  // 1. Convert breaks inside math mode to LaTeX newlines or spaces (never print '< br/ >')
  f = f.replace(/<\s*br\s*\/?\s*>/gi, '\\\\ ');
  f = f.replace(/&lt;\s*br\s*\/?\s*&gt;/gi, '\\\\ ');

  // 2. Strip only known HTML tags, NEVER mathematical inequalities like '< 4' or '> 0'!
  f = f.replace(/<\/?(span|p|div|b|i|u|strong|em|font|table|tr|td|th|tbody|thead|sup|sub|center|h[1-6]|ul|ol|li)[^>]*>/gi, '');

  // 3. Strip all unescaped dollar signs from inside math mode
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
 * Normalizes MARKS App raw text, fixing broken HTML breaks,
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

  // 3. Handle cases where $...$ or $$...$$ improperly wraps across HTML <br/> breaks
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

        // Check if chunk contains multi-word English text outside \text{}
        const textStripped = p.replace(/\\text\s*\{[^}]*\}/g, '');
        const words = textStripped.match(/[a-zA-Z]{3,}/g) || [];
        const mathKeywords = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'lim', 'max', 'min', 'det', 'exp', 'deg', 'dim', 'ker', 'gcd', 'lcm', 'sqrt', 'frac', 'mathrm', 'mathbf', 'mathit', 'mathbb', 'mathcal', 'right', 'left', 'begin', 'aligned', 'matrix', 'cases']);
        const proseWords = words.filter(w => !mathKeywords.has(w.toLowerCase()));

        if (proseWords.length >= 2) {
          // English prose with math symbols! Leave prose as normal HTML, wrap only math tokens
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

  // 4. Wrap naked LaTeX math in non-delimited segments
  // Split strictly by existing $ delimiters AND <br/> tags so HTML tags are NEVER mangled!
  const segments = content.split(/(\$\$[\s\S]*?\$\$|\$[^$]+?\$|<br\/>)/g);
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg || seg.startsWith('$') || seg === '<br/>') continue;

    // Check if segment contains LaTeX math commands (e.g. \sqrt, \frac, \mathbb, \left, \right)
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
        // Pure equation segment: wrap safely in $$
        segments[i] = `$$${seg.trim()}$$`;
      } else {
        // Mixed prose and math: wrap set definitions like S_1 = \{ ... \} and Greek/math symbols
        segments[i] = seg.replace(/([a-zA-Z0-9_\{\}\^:]+\s*=\s*\\(?:left)?\\?\{[^$]+?\\(?:right)?\\?\})/g, '$$$1$$')
                         .replace(/\\(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Delta|Theta|Lambda|Xi|Pi|Sigma|Phi|Psi|Omega|sqrt|frac|pm|mp|times|div|le|ge|ne|approx|equiv|partial|nabla|infty|int|sum|prod|cup|cap|subset|subseteq|notin|to|rightarrow|leftarrow|leftrightarrow|dots|cdots|ldots|cdot|circ|degree)\b(?:\s*\{[^}]*\})?/g, (m) => `$${m}$`);
      }
    }
  }
  content = segments.join('');

  // 5. If there are environments without $$ like \begin{aligned} ... \end{aligned}
  if (!content.includes('$$') && /\\begin\{(?:aligned|align|matrix|pmatrix|bmatrix|cases|array|gather|equation)\*?\}/.test(content)) {
    content = content.replace(/(\\begin\{(?:aligned|align|matrix|pmatrix|bmatrix|cases|array|gather|equation)\*?\}[\s\S]*?\\end\{(?:aligned|align|matrix|pmatrix|bmatrix|cases|array|gather|equation)\*?\})/g, '$$$1$$');
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
    const regex = /(\$\$[\s\S]*?\$\$|\$([^$]+?)\$|\\begin\{(?:aligned|align|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|array|gather|equation|split|multline)\*?\}[\s\S]*?\\end\{(?:aligned|align|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|cases|array|gather|equation|split|multline)\*?\})/g;
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
            } catch {
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

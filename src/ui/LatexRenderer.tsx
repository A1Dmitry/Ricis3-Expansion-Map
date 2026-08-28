import React from 'react';
import katex from 'katex';

interface LatexRendererProps {
  content: string;
  className?: string;
}

/**
 * Preprocess raw TeX document wrappers (\begin{quote}, \textbf{}, \detokenize{}, \begin{enumerate}, \begin{verbatim})
 * into clean Markdown with embedded KaTeX formulas ($...$, $$...$$).
 */
export function preprocessLatexContent(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // 1. Convert \begin{verbatim} ... \end{verbatim} to ```lean4 ... ```
  text = text.replace(/\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/gi, (_, code) => {
    return `\n\`\`\`lean4\n${code.trim()}\n\`\`\`\n`;
  });

  // 2. Remove document environment tags
  text = text.replace(/\\begin\{quote\}/gi, '');
  text = text.replace(/\\end\{quote\}/gi, '');
  text = text.replace(/\\begin\{enumerate\}/gi, '');
  text = text.replace(/\\end\{enumerate\}/gi, '');
  text = text.replace(/\\begin\{itemize\}/gi, '');
  text = text.replace(/\\end\{itemize\}/gi, '');

  // 3. Convert \item into bullet list
  text = text.replace(/\\item\s+/gi, '\n* ');

  // 4. Convert \detokenize{text} -> `text`
  text = text.replace(/\\detokenize\{([^}]+)\}/g, '`$1`');

  // 5. Convert \href{url}{text} -> [text](url)
  text = text.replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, '[$2]($1)');

  // 6. Convert \textbf{text} -> **text**
  text = text.replace(/\\textbf\{([^}]+)\}/g, '**$1**');

  // 7. Convert \texttt{text} -> `text`
  text = text.replace(/\\texttt\{([^}]+)\}/g, '`$1`');

  return text;
}

/**
 * Render LaTeX math expressions ($...$, $$...$$, \begin{aligned}...\end{aligned})
 * and Markdown-formatted text using KaTeX.
 */
export const LatexRenderer: React.FC<LatexRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const processedContent = preprocessLatexContent(content);

  // Split content by code blocks (```...```) first to keep Lean 4 / LaTeX code readable
  const blocks = processedContent.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-2 leading-relaxed text-gray-200 ${className}`}>
      {blocks.map((block, idx) => {
        if (block.startsWith('```')) {
          // Code block rendering (Lean 4 / LaTeX code)
          const match = block.match(/^```(\w*)\n?([\s\S]*?)```$/);
          const lang = match ? match[1] : '';
          const code = match ? match[2] : block.slice(3, -3);

          return (
            <div key={idx} className="my-2.5 rounded-lg border border-cyan-900/60 bg-[#05080f] overflow-hidden shadow-inner">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a0f1d] border-b border-cyan-900/40 text-[10px] font-mono text-cyan-400">
                <span className="uppercase font-bold tracking-wider">{lang || 'LEAN 4 PROOF'}</span>
                <span className="text-gray-500">RICIS-III Engine</span>
              </div>
              <pre className="p-3 font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed selection:bg-cyan-900 selection:text-white">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }

        // Render standard text paragraph with LaTeX and inline math
        return (
          <div key={idx} className="whitespace-pre-wrap">
            {renderFormattedText(block)}
          </div>
        );
      })}
    </div>
  );
};

/** Parse line-by-line and convert math expressions to KaTeX rendered HTML */
function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    if (!line.trim()) {
      return <div key={lineIdx} className="h-1.5" />;
    }

    // Check if line is a display math block ($$ ... $$ or \begin{aligned} ... \end{aligned})
    const displayMathMatch = line.match(/^(\$\$|\\\[)([\s\S]*?)(\$\$|\\\])$/) || line.match(/^(\\begin\{[a-zA-Z*]+\}[\s\S]*?\\end\{[a-zA-Z*]+\})$/);
    if (displayMathMatch) {
      const latex = displayMathMatch[2] || displayMathMatch[1];
      return (
        <div key={lineIdx} className="my-2 p-2.5 bg-[#0a0e1a] border border-cyan-900/40 rounded-lg overflow-x-auto text-center shadow-sm">
          <KatexMath math={latex} displayMode={true} />
        </div>
      );
    }

    // Check for unwrapped bare LaTeX math expressions (often present in RICIS-III dumps)
    // We ensure it starts with \ to avoid false positives on normal text that happens to have a LaTeX command.
    const isBareLatex = line.trim().startsWith('\\') && /\\(lim|frac|to|xrightarrow|infty|int|sum|sqrt|cdot|times|text\{|alpha|beta|gamma|Delta)/.test(line) && !line.includes('$') && !line.includes('`') && !line.includes('**');
    if (isBareLatex) {
      return (
        <div key={lineIdx} className="my-2 p-2.5 bg-[#0a0e1a] border border-cyan-900/40 rounded-lg overflow-x-auto text-center shadow-sm">
          <KatexMath math={line.trim()} displayMode={true} />
        </div>
      );
    }

    // Process inline math $...$ or \(...\) and bold text (*...* or **...**)
    return (
      <p key={lineIdx} className="my-1">
        {renderInlineElements(line)}
      </p>
    );
  });
}

/** Helper to render inline elements (LaTeX math $...$, bold text **...**, code `...`) */
function renderInlineElements(line: string): React.ReactNode[] {
  // Regex splitting by $$...$$, $...$, \(...\), `...`, **...**, [text](url), and bare https?:// urls
  const pattern = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$|\\\(.*?\\\)|`[^`]+?`|\*\*[^*]+?\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s<>"']+)/g;
  const parts = line.split(pattern);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Bare URL https://...
    if (part.startsWith('http://') || part.startsWith('https://')) {
      const cleaned = part.replace(/[)\],.;:!?]+$/g, '');
      const trailing = part.slice(cleaned.length);
      return (
        <React.Fragment key={idx}>
          <a
            href={cleaned}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-200 underline underline-offset-2 transition-colors break-all"
            onClick={e => e.stopPropagation()}
          >
            {cleaned}
          </a>
          {trailing}
        </React.Fragment>
      );
    }

    // Link [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-200 underline underline-offset-2 transition-colors mx-0.5"
        >
          {linkMatch[1]}
        </a>
      );
    }

    // Display math inline $$...$$
    if (part.startsWith('$$') && part.endsWith('$$')) {
      const latex = part.slice(2, -2);
      return <KatexMath key={idx} math={latex} displayMode={true} />;
    }

    // Inline math $...$ or \(...\)
    if ((part.startsWith('$') && part.endsWith('$')) || (part.startsWith('\\(') && part.endsWith('\\)'))) {
      const latex = part.startsWith('$') ? part.slice(1, -1) : part.slice(2, -2);
      return <KatexMath key={idx} math={latex} displayMode={false} />;
    }

    // Inline code `...`
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="px-1.5 py-0.5 mx-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Bold text **...**
    if (part.startsWith('**') && part.endsWith('**')) {
      const cleanText = part.slice(2, -2);
      return <strong key={idx} className="font-bold text-cyan-200">{cleanText}</strong>;
    }

    return <span key={idx}>{part}</span>;
  });
}

/** Component that renders a single KaTeX math formula safely */
const KatexMath: React.FC<{ math: string; displayMode: boolean }> = ({ math, displayMode }) => {
  try {
    const html = katex.renderToString(math, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: 'htmlAndMathml',
    });

    return (
      <span
        className={displayMode ? 'block my-1 text-cyan-300 text-sm font-serif overflow-x-auto py-0.5' : 'inline-block px-1 text-cyan-300 text-sm'}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    return (
      <code className="px-1 py-0.5 bg-red-950 text-red-300 rounded text-xs font-mono">
        {math}
      </code>
    );
  }
};

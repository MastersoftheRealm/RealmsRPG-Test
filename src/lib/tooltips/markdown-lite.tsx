import type { ReactNode } from 'react';
import React from 'react';

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let index = 0;

  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/;

  while (remaining.length > 0) {
    const match = remaining.match(tokenRegex);
    if (!match || match.index === undefined) {
      nodes.push(<React.Fragment key={`t-${index++}`}>{remaining}</React.Fragment>);
      break;
    }

    if (match.index > 0) {
      nodes.push(
        <React.Fragment key={`t-${index++}`}>{remaining.slice(0, match.index)}</React.Fragment>,
      );
    }

    const token = match[0];
    if (token.startsWith('**')) {
      nodes.push(<strong key={`b-${index++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('*')) {
      nodes.push(<em key={`i-${index++}`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={`c-${index++}`}
          className="rounded border border-border-light bg-surface-alt px-1 py-0.5 font-mono text-xs"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        nodes.push(
          <a
            key={`l-${index++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-link-fg underline"
          >
            {label}
          </a>,
        );
      } else {
        nodes.push(<React.Fragment key={`t-${index++}`}>{token}</React.Fragment>);
      }
    }

    remaining = remaining.slice(match.index + token.length);
  }

  return nodes;
}

export function renderMarkdownLite(markdown: string): ReactNode {
  const lines = markdown.split('\n').map((line) => line.trimEnd());
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line === undefined || !line.trim()) {
      i += 1;
      continue;
    }

    if (line.startsWith('- ')) {
      const bullets: ReactNode[] = [];
      while (i < lines.length) {
        const bullet = lines[i];
        if (bullet === undefined || !bullet.startsWith('- ')) break;
        bullets.push(<li key={`li-${i}`}>{renderInline(bullet.slice(2))}</li>);
        i += 1;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc space-y-1 pl-5">
          {bullets}
        </ul>,
      );
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {renderInline(line)}
      </p>,
    );
    i += 1;
  }

  return <div className="space-y-2 text-sm text-text-primary">{elements}</div>;
}

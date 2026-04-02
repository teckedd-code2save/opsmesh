'use client';

import type { CSSProperties } from 'react';
import { useState } from 'react';
import { tokens } from './ui';

export function TruncatedText({
  text,
  limit = 200,
  style,
}: {
  text: string;
  limit?: number;
  style?: CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > limit;
  const display = needsTruncation && !expanded ? text.slice(0, limit).trimEnd() + '…' : text;

  return (
    <span style={style}>
      {display}
      {needsTruncation && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setExpanded((v) => !v);
          }}
          style={{
            marginLeft: 6,
            background: 'none',
            border: 'none',
            padding: 0,
            color: tokens.accent,
            fontSize: 'inherit',
            fontWeight: 600,
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: 2,
          }}
        >
          {expanded ? 'Show less' : 'View more'}
        </button>
      )}
    </span>
  );
}

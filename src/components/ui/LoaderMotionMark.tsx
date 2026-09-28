'use client';

import type { JSX } from 'react';

/** A compact line-drawn route motif with the exact, existing AscendRev logo. */
export default function LoaderMotionMark(): JSX.Element {
  return (
    <svg
      className="loader-mark"
      viewBox="0 0 320 132"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="loader-route" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#00b8a9" />
          <stop offset="0.52" stopColor="#e5bd45" />
          <stop offset="1" stopColor="#f7fbff" />
        </linearGradient>
        <radialGradient id="loader-node">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#e5bd45" />
        </radialGradient>
      </defs>

      <path className="loader-route-line loader-route-line-one" pathLength="1" d="M48 103 C91 86 119 105 159 92 S230 83 272 102" />
      <path className="loader-route-line loader-route-line-two" pathLength="1" d="M72 111 C108 94 128 79 166 89 S226 113 254 94" />
      <path className="loader-route-line loader-route-line-three" pathLength="1" d="M104 98 C129 111 145 108 176 91 S219 76 237 91" />

      <circle className="loader-route-node loader-route-node-one" cx="84" cy="93" r="2.2" />
      <circle className="loader-route-node loader-route-node-two" cx="160" cy="92" r="3.2" />
      <circle className="loader-route-node loader-route-node-three" cx="237" cy="91" r="2.4" />

      <image
        href="/ascendrev-loader-logo-transparent.png"
        x="29"
        y="3"
        width="262"
        height="87"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}

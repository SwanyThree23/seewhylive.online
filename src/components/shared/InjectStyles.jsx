import React from 'react';

// Injects mobile-specific global CSS that cannot be expressed as Tailwind utilities.
// Rendered once at the app root so it runs before any paint.
export default function InjectStyles() {
  return (
    <style>{`
      /* Nav bars, tab strips, button rows — block selection on all chrome */
      nav, header, [role="tablist"], [role="tab"],
      .bottom-nav, .tab-bar, .toolbar, .action-bar {
        -webkit-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
      }

      /* Headings are decorative chrome — no drag-select on mobile */
      h1, h2, h3, h4, h5, h6 {
        -webkit-user-select: none;
        user-select: none;
      }

      /* Profile names, usernames, badges in lists */
      .username, .display-name, .creator-name, .badge-label {
        -webkit-user-select: none;
        user-select: none;
      }

      /* Message bubbles and longform content MUST stay selectable */
      .chat-bubble, .chat-message, .message-body, .message-content,
      .post-content, .prose, .bio-text, .stream-title,
      p[class*="content"], span[class*="body"] {
        -webkit-user-select: text !important;
        user-select: text !important;
        -webkit-touch-callout: default !important;
      }

      /* Prevent double-tap zoom on interactive chrome (buttons, links, nav items) */
      button, a, [role="button"] {
        touch-action: manipulation;
      }
    `}</style>
  );
}

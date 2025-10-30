Chatbot component
=================

What this adds
---------------

- `src/components/chat/Chatbot.tsx` — a small floating chat UI that searches `src/data/siteContent.json` and responds with matching snippets.

How to use
----------

1. Import and place the component somewhere in your app (for example in `src/App.tsx`):

```tsx
import Chatbot from "./components/chat/Chatbot";

function App() {
  return (
    <>
      {/* existing app markup */}
      <Chatbot />
    </>
  );
}
```

2. Expand `src/data/siteContent.json` with additional pages/components you want the assistant to know about. Each entry should have `id`, `title`, `source`, `content`, and optional `tags`.

Notes & next steps
------------------
- This is a local, client-side retriever using simple keyword matching.
- For better answers, consider integrating a backend that builds a proper search index or uses embeddings with an LLM (server-side) and call that from the chat UI.

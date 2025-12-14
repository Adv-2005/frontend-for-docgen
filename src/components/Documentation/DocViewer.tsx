// components/Documentation/DocViewer.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function DocViewer({ content }) {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import Link from 'next/link';
import { processObsidianLinks } from '@/lib/markdown-utils';

/**
 * MarkdownRenderer Component
 * 
 * Renders markdown with support for:
 * - GitHub Flavored Markdown (tables, strikethrough, etc.)
 * - Obsidian [[wiki links]]
 * - Code syntax highlighting
 * - Custom styling
 * 
 * React Learning:
 * - Component composition with react-markdown
 * - Custom components for specific markdown elements
 * - Processing content before rendering
 */
interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Process Obsidian [[links]] before rendering
  const processedContent = processObsidianLinks(content);

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom link component for internal navigation
          a: ({ node, href, children, ...props }) => {
            // Check if it's an internal link
            if (href?.startsWith('/')) {
              return (
                <Link
                  href={href}
                  className="text-purple-600 hover:text-purple-800 underline font-medium"
                >
                  {children}
                </Link>
              );
            }
            // External link
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
                {...props}
              >
                {children} 🔗
              </a>
            );
          },
          // Custom heading styles
          h1: ({ children }) => (
            <h1 className="text-4xl font-bold text-gray-800 mt-8 mb-4 border-b-2 border-purple-200 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-3xl font-bold text-gray-800 mt-6 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-2xl font-semibold text-gray-800 mt-4 mb-2">
              {children}
            </h3>
          ),
          // Code blocks with styling
          code: ({ node, className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-mono text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={`${className} block`} {...props}>
                {children}
              </code>
            );
          },
          // Blockquotes with styling
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-400 pl-4 py-2 my-4 italic text-gray-700 bg-purple-50 rounded-r">
              {children}
            </blockquote>
          ),
          // Lists with proper spacing
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-2 my-4 ml-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-2 my-4 ml-4">
              {children}
            </ol>
          ),
          // Tables with styling
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-gray-300">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 bg-purple-100 px-4 py-2 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-4 py-2">
              {children}
            </td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>

      <style jsx global>{`
        .markdown-content {
          line-height: 1.8;
          color: #374151;
        }
        
        .markdown-content p {
          margin-bottom: 1rem;
        }
        
        .markdown-content img {
          max-width: 100%;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .markdown-content pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        
        .markdown-content hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}


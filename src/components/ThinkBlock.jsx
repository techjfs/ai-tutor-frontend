// ThinkBlock.jsx
import React, { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const ThinkBlock = ({ children }) => {
    const [expanded, setExpanded] = useState(true);

    // 检查children的类型，确保是字符串
    const content = typeof children === 'string'
        ? children
        : Array.isArray(children)
            ? children.map(child =>
                typeof child === 'string'
                    ? child
                    : child?.props?.children || ''
            ).join('')
            : '';

    return (
        <div className="think-container" style={{
            border: '1px solid #e2e8f0',
            borderRadius: '0.375rem',
            margin: '1rem 0',
            overflow: 'hidden'
        }}>
            <div
                className="think-header"
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f7fafc',
                    cursor: 'pointer',
                    fontWeight: '500'
                }}
            >
                <span style={{ marginRight: '0.5rem' }}>{expanded ? "▼" : "▶"}</span>
                <span className="think-label">内部思考过程</span>
            </div>
            {expanded && (
                <div className="think-content" style={{
                    padding: '1rem',
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    backgroundColor: '#f8f9fa',
                    borderTop: '1px solid #e2e8f0'
                }}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};

export default ThinkBlock;
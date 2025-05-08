import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// 自定义组件，用于渲染Markdown内容
export const renderMarkdown = (content) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: (props) => <h1 {...props} className="text-2xl font-bold mt-4 mb-2" />,
                h2: (props) => <h2 {...props} className="text-xl font-bold mt-4 mb-2" />,
                h3: (props) => <h3 {...props} className="text-lg font-bold mt-3 mb-1" />,
                p: (props) => <p {...props} className="my-2" />,
                ul: (props) => <ul {...props} className="list-disc pl-6 my-2" />,
                ol: (props) => <ol {...props} className="list-decimal pl-6 my-2" />,
                li: (props) => <li {...props} className="my-1" />,
                a: (props) => (
                    <a {...props} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" />
                ),
                blockquote: (props) => (
                    <blockquote {...props} className="pl-4 border-l-4 border-gray-300 text-gray-700 italic my-2" />
                ),
                hr: (props) => <hr {...props} className="my-4 border-t border-gray-300" />,
                code: ({ inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                        <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                            className="rounded-md"
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    ) : (
                        <code
                            className={inline ? "bg-gray-100 px-1 py-0.5 rounded" : "block bg-gray-100 p-3 rounded my-2 overflow-x-auto font-mono text-sm"}
                            {...props}
                        >
                            {children}
                        </code>
                    );
                },
                div: ({ className, ...props }) => {
                    // 处理推荐问题的特殊样式
                    if (className === 'extend_questions') {
                        return <div {...props} className="extend_questions flex flex-wrap gap-2 mt-3" />;
                    }
                    return <div {...props} />;
                }
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

// 从推荐问题内容中提取问题列表
export const extractRecommendedQuestions = (content) => {
    if (!content) return [];

    // 查找extend_questions标签内的内容
    const extendQuestionsRegex = /<div class="extend_questions">([\s\S]*?)<\/div>/g;
    const match = extendQuestionsRegex.exec(content);

    if (!match || !match[1]) return [];

    // 提取<p>标签内的问题
    const questionsRegex = /<p>(.*?)<\/p>/g;
    const questions = [];
    let questionMatch;

    while ((questionMatch = questionsRegex.exec(match[1])) !== null) {
        questions.push(questionMatch[1]);
    }

    return questions;
};
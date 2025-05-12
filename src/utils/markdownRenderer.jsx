import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ThinkBlock from "../components/ThinkBlock";
import rehypeRaw from 'rehype-raw';

// 自定义组件，用于渲染Markdown内容
export const renderMarkdown = (content) => {
    // 将<think>标签替换为可处理的HTML标签
    const processedContent = content.replace(
        /<think>/g, '<div class="think-block-marker">'
    ).replace(
        /<\/think>/g, '</div>'
    );

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
                div: ({ node, className, children, ...props }) => {
                    // 处理think块
                    if (className === 'think-block-marker') {
                        return <ThinkBlock>{children}</ThinkBlock>;
                    }

                    // 处理推荐问题的特殊样式
                    if (className === 'extend_questions') {
                        return <div {...props} className="extend_questions flex flex-wrap gap-2 mt-3">{children}</div>;
                    }

                    // 其他div正常处理
                    return <div className={className} {...props}>{children}</div>;
                },
                h1: (props) => <h1 {...props} className="text-2xl font-bold mt-4 mb-2" />,
                h2: (props) => <h2 {...props} className="text-xl font-bold mt-4 mb-2" />,
                h3: (props) => <h3 {...props} className="text-lg font-bold mt-3 mb-1" />,
                p: (props) => <p {...props} className="my-2 break-words" />, // 添加 break-words
                ul: (props) => <ul {...props} className="list-disc pl-6 my-2" />,
                ol: (props) => <ol {...props} className="list-decimal pl-6 my-2" />,
                li: (props) => <li {...props} className="my-1" />,
                a: (props) => (
                    <a {...props} className="text-blue-600 hover:underline break-words" target="_blank" rel="noopener noreferrer" />
                ),
                blockquote: (props) => (
                    <blockquote {...props} className="pl-4 border-l-4 border-gray-300 text-gray-700 italic my-2 overflow-x-auto" />
                ),
                hr: (props) => <hr {...props} className="my-4 border-t border-gray-300" />,
                code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                        <div className="overflow-x-auto w-full"> {/* 添加容器控制宽度和溢出 */}
                            <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                                className="rounded-md"
                                customStyle={{ width: '100%' }} // 确保代码块响应式
                                wrapLines={true}
                                wrapLongLines={true}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        </div>
                    ) : (
                        <code
                            className={inline ? "bg-gray-100 px-1 py-0.5 rounded break-words" : "block bg-gray-100 p-3 rounded my-2 overflow-x-auto font-mono text-sm w-full"}
                            {...props}
                        >
                            {children}
                        </code>
                    );
                },
                // 添加表格的样式处理
                table: (props) => (
                    <div className="overflow-x-auto w-full my-4">
                        <table {...props} className="min-w-full border-collapse" />
                    </div>
                ),
                th: (props) => <th {...props} className="border border-gray-300 px-4 py-2 bg-gray-100" />,
                td: (props) => <td {...props} className="border border-gray-300 px-4 py-2" />,
                // 处理图片
                img: (props) => (
                    <img {...props} className="max-w-full h-auto my-4" alt={props.alt || ''} />
                ),
            }}
        >
            {processedContent}
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
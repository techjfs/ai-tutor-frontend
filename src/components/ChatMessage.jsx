import React, { useContext } from 'react';
import { renderMarkdown, extractRecommendedQuestions } from '../utils/markdownRenderer.jsx';
import { ChatContext } from '../contexts/ChatContext';
import './ChatMessage.css'; // 引入自定义CSS

const ChatMessage = ({ message }) => {
    const { sendQuestion } = useContext(ChatContext);
    const { role, content, status, isFollowup } = message;

    // 记录消息的isFollowup属性，便于调试
    if (role === 'assistant') {
        console.log("ChatMessage显示 - isFollowup:", isFollowup);
    }

    // 提取推荐问题（如果有）
    const recommendedQuestions =
        role === 'assistant' && status === 'complete'
            ? extractRecommendedQuestions(content)
            : [];

    // 处理点击推荐问题
    const handleQuestionClick = (question) => {
        sendQuestion(question);
    };

    return (
        <div className={`py-6 ${role === 'assistant' ? 'bg-claude-light' : 'bg-white'}`}>
            <div className="max-w-3xl mx-auto px-4">
                <div className="flex items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${
                        role === 'assistant'
                            ? 'bg-claude-accent text-white'
                            : 'bg-gray-200 text-gray-700'
                    }`}>
                        {role === 'assistant' ? 'AI' : '你'}
                    </div>

                    <div className="flex-1 overflow-hidden">
                        {/* 用户消息直接显示，AI消息通过Markdown渲染 */}
                        {role === 'user' ? (
                            <p className="whitespace-pre-wrap">{content}</p>
                        ) : (
                            <div className="prose max-w-none markdown-content">
                                {/* 如果是追问回复，显示标记 */}
                                {isFollowup && (
                                    <div className="mb-3">
                                        <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                                            追问回复 ↩
                                        </span>
                                    </div>
                                )}

                                {content && renderMarkdown(content)}

                                {/* 如果正在生成，显示闪烁的光标 */}
                                {status === 'generating' && (
                                    <span className="inline-block w-2 h-4 bg-black ml-1 animate-pulse align-text-bottom"></span>
                                )}

                                {/* 推荐问题按钮 */}
                                {recommendedQuestions.length > 0 && status === 'complete' && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {recommendedQuestions.map((question, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleQuestionClick(question)}
                                                className="inline-flex items-center px-3 py-1.5 bg-claude-dark hover:bg-gray-200 rounded-md text-sm text-claude-accent transition-colors"
                                            >
                                                {question}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
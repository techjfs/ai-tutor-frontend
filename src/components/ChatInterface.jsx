import React, { useContext, useState, useRef, useEffect } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import ChatMessage from './ChatMessage';
import { scrollToBottom } from '../utils/chatUtils';

const ChatInterface = () => {
    const {
        messages,
        activeConversationId,
        sendQuestion,
        isGenerating,
        stopGeneration
    } = useContext(ChatContext);

    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // 自动调整文本框高度
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    };

    // 消息列表更新时滚动到底部
    useEffect(() => {
        scrollToBottom(messagesEndRef);
    }, [messages]);

    // 输入框值变化时自动调整高度
    useEffect(() => {
        adjustTextareaHeight();
    }, [inputValue]);

    // 处理文本框输入
    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    // 处理发送消息
    const handleSendMessage = () => {
        if (inputValue.trim() && !isGenerating) {
            sendQuestion(inputValue);
            setInputValue('');
            // 重置文本框高度
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    // 处理按键事件（回车发送，Shift+回车换行）
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // 空状态显示
    if (!activeConversationId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-claude-light">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-semibold mb-2">欢迎使用 AI 学习规划</h2>
                    <p className="text-gray-600 mb-6">请创建新对话或从左侧选择已有对话</p>
                    <button
                        onClick={() => {
                            const context = require('../contexts/ChatContext');
                            context.ChatContext._currentValue.createNewConversation();
                        }}
                        className="bg-claude-accent hover:bg-purple-700 text-white px-6 py-3 rounded-md transition-colors"
                    >
                        创建新对话
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-claude-light">
            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <h3 className="text-xl font-medium mb-2">开始您的 AI 学习规划之旅</h3>
                        <p className="text-gray-600 mb-4 max-w-lg">
                            可以向我询问有关AI学习路径规划的问题，例如：
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
                            {[
                                "如何成为一名AI工程师？",
                                "我是计算机专业学生，想学习大模型开发，请给我一个学习路径",
                                "我有Python基础，想转行做机器学习，三个月内如何入门？",
                                "LLM微调需要学习哪些知识点？"
                            ].map((question, index) => (
                                <button
                                    key={index}
                                    className="bg-white hover:bg-gray-50 border border-gray-200 rounded-md p-3 text-left text-sm transition-colors"
                                    onClick={() => sendQuestion(question)}
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map(message => (
                            <ChatMessage key={message.id} message={message} />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* 输入框 */}
            <div className="border-t border-claude-border bg-white px-4 py-3">
                <div className="max-w-3xl mx-auto">
                    <div className="relative">
            <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="输入您的学习规划问题..."
                className="w-full border border-gray-300 rounded-md py-3 pl-4 pr-16 resize-none min-h-[52px] max-h-[200px] focus:outline-none focus:border-claude-accent focus:ring-1 focus:ring-claude-accent"
                disabled={isGenerating}
                rows={1}
            />
                        {isGenerating ? (
                            <button
                                onClick={stopGeneration}
                                className="absolute right-3 bottom-3 text-white bg-red-500 hover:bg-red-600 rounded-md px-3 py-1 text-sm transition-colors"
                            >
                                停止
                            </button>
                        ) : (
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim()}
                                className={`absolute right-3 bottom-3 ${
                                    inputValue.trim()
                                        ? 'text-white bg-claude-accent hover:bg-purple-700'
                                        : 'text-gray-400 bg-gray-200'
                                } rounded-md px-3 py-1 text-sm transition-colors`}
                            >
                                发送
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
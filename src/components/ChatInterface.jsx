import React, { useContext, useState, useRef, useEffect } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import ChatMessage from './ChatMessage';

const ChatInterface = () => {
    const {
        messages,
        activeConversationId,
        sendQuestion,
        isGenerating,
        stopGeneration,
        createNewConversation
    } = useContext(ChatContext);

    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);
    const messageContainerRef = useRef(null);
    const textareaRef = useRef(null);
    const isScrollLocked = useRef(false);

    // Refs for checking message changes
    const prevMessagesLengthRef = useRef(messages.length);
    const lastMessageContentRef = useRef(messages[messages.length - 1]?.content || '');

    // Auto adjust textarea height
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    };

    // Improved scroll function with debounce logic
    const scrollToBottom = () => {
        // If scroll is locked, don't attempt to scroll
        if (isScrollLocked.current) return;

        // Lock scrolling temporarily to prevent bouncing
        isScrollLocked.current = true;

        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        } else if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }

        // Unlock scrolling after a delay
        setTimeout(() => {
            isScrollLocked.current = false;
        }, 300);
    };

    // Main scroll logic with optimizations
    useEffect(() => {
        const hasNewMessage = messages.length > prevMessagesLengthRef.current;
        const currentLastMessageContent = messages[messages.length - 1]?.content || '';
        const hasContentChanged = currentLastMessageContent !== lastMessageContentRef.current;

        // Update refs for next comparison
        prevMessagesLengthRef.current = messages.length;
        lastMessageContentRef.current = currentLastMessageContent;

        // Scroll only if necessary to reduce jitter
        if (hasNewMessage) {
            // For new messages, scroll immediately
            requestAnimationFrame(scrollToBottom);
        } else if (hasContentChanged && isGenerating) {
            // For content updates during generation, use a more controlled approach
            // Don't scroll immediately for every content change - use a timer
            const timer = setTimeout(scrollToBottom, 150);
            return () => clearTimeout(timer);
        }
    }, [messages, isGenerating]);

    // Watch for generation stopping
    useEffect(() => {
        if (!isGenerating && messages.length > 0) {
            // When generation stops, do a final scroll
            const timer = setTimeout(scrollToBottom, 200);
            return () => clearTimeout(timer);
        }
    }, [isGenerating, messages.length]);

    // Resize handling
    useEffect(() => {
        const handleResize = () => {
            if (messages.length > 0 && !isScrollLocked.current) {
                scrollToBottom();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [messages.length]);

    // Adjust textarea height when input changes
    useEffect(() => {
        adjustTextareaHeight();
    }, [inputValue]);

    // Handle input changes
    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    // Handle sending messages
    const handleSendMessage = () => {
        if (inputValue.trim() && !isGenerating) {
            sendQuestion(inputValue);
            setInputValue('');
            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
            // Scroll to bottom shortly after sending
            setTimeout(scrollToBottom, 50);
        }
    };

    // Handle key events (Enter to send, Shift+Enter for new line)
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Empty state display
    if (!activeConversationId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-claude-light">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-semibold mb-2">欢迎使用 AI 学习规划</h2>
                    <p className="text-gray-600 mb-6">请创建新对话或从左侧选择已有对话</p>
                    <button
                        onClick={createNewConversation}
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
            {/* Message list */}
            <div
                ref={messageContainerRef}
                className="flex-1 overflow-y-auto"
            >
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
                                    onClick={() => {
                                        sendQuestion(question);
                                        // Scroll to bottom after clicking suggestion button
                                        setTimeout(scrollToBottom, 50);
                                    }}
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
                        <div ref={messagesEndRef} style={{ float: "left", clear: "both" }} />
                    </>
                )}
            </div>

            {/* Input area */}
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
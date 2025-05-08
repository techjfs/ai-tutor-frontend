import React, { createContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    // 对话列表状态
    const [conversations, setConversations] = useState([]);
    // 当前选中的对话ID
    const [activeConversationId, setActiveConversationId] = useState(null);
    // 当前对话中的消息列表
    const [messages, setMessages] = useState([]);
    // 是否正在生成回复
    const [isGenerating, setIsGenerating] = useState(false);
    // 当前的任务ID（用于停止生成）
    const [currentTaskId, setCurrentTaskId] = useState(null);
    // WebSocket连接
    const [ws, setWs] = useState(null);
    // 选中的对话IDs（用于批量删除）
    const [selectedIds, setSelectedIds] = useState([]);


    // 用一个外部变量来追踪当前的消息状态
    let currentMessages = [];

    // 组件初始化时，同步外部变量
    useEffect(() => {
        currentMessages = messages;
    }, [messages]);

    // 从localStorage加载对话列表
    useEffect(() => {
        const savedConversations = localStorage.getItem('aiTutorConversations');
        if (savedConversations) {
            const parsedConversations = JSON.parse(savedConversations);
            setConversations(parsedConversations);

            // 如果有对话，选择最近的一个作为活动对话
            if (parsedConversations.length > 0) {
                const lastConversation = parsedConversations[0];
                setActiveConversationId(lastConversation.id);
                setMessages(lastConversation.messages || []);
            }
        }
    }, []);

    // 保存对话列表到localStorage
    useEffect(() => {
        if (conversations.length > 0) {
            localStorage.setItem('aiTutorConversations', JSON.stringify(conversations));
        }
    }, [conversations]);

    // 当活动对话ID改变时，加载对应的消息
    useEffect(() => {
        if (activeConversationId) {
            const activeConversation = conversations.find(conv => conv.id === activeConversationId);
            if (activeConversation) {
                setMessages(activeConversation.messages || []);
            }
        } else {
            setMessages([]);
        }
    }, [activeConversationId, conversations]);

    // 初始化WebSocket连接
    useEffect(() => {
        const connectWebSocket = () => {
            const wsUrl = 'ws://localhost:8050/ws/llm';
            const websocket = new WebSocket(wsUrl);

            websocket.onopen = () => {
                console.log('WebSocket 连接成功');
            };

            websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('收到消息:', data);

                if (data.type === 'llm_response') {
                    handleLLMResponse(data);
                } else if (data.type === 'task_started') {
                    setCurrentTaskId(data.task_id);
                } else if (data.type === 'command_sent') {
                    if (data.command === 'stop') {
                        setIsGenerating(false);
                        setCurrentTaskId(null);
                    }
                }
            };

            websocket.onclose = (event) => {
                console.log('WebSocket 连接关闭:', event);
                setTimeout(() => {
                    console.log('尝试重新连接...');
                    connectWebSocket();
                }, 3000);
            };

            websocket.onerror = (error) => {
                console.error('WebSocket 错误:', error);
            };

            setWs(websocket);
        };

        connectWebSocket();

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, []);

    // 处理LLM响应
    const handleLLMResponse = (data) => {
        const { event, data: responseData } = data;

        if (event === 'start') {
            // 开始生成，更新UI状态
            setIsGenerating(true);
        }
        else if (event === 'message') {
            // 在更新状态之前，先更新我们的外部变量
            const newMessages = [...currentMessages];
            console.log("Current messages before update:", newMessages.length, newMessages);

            // 检查是否已有AI回复消息，如果有则追加，否则创建新消息
            const lastMessage = newMessages.length > 0 ? newMessages[newMessages.length - 1] : null;
            console.log("Last message:", lastMessage);

            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.status === 'generating') {
                console.log("Appending to existing message");
                lastMessage.content += responseData;
            } else {
                console.log("Creating new message");
                newMessages.push({
                    id: uuidv4(),
                    role: 'assistant',
                    content: responseData,
                    status: 'generating',
                    timestamp: new Date().toISOString()
                });
            }

            // 更新外部变量和React状态
            currentMessages = newMessages;
            console.log("Updated messages:", currentMessages.length, currentMessages);

            // 更新React状态
            setMessages(currentMessages);

            // 同时更新conversations中的对应对话
            updateActiveConversation();
        }
        else if (event === 'end' || event === 'interrupted' || event === 'error') {
            // 完成生成，更新最后一条消息的状态
            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.status === 'generating') {
                    lastMessage.status = 'complete';
                }
                // 更新外部变量
                currentMessages = newMessages;
                return newMessages;
            });

            // 更新conversations中的对应对话
            updateActiveConversation();

            // 重置生成状态
            setIsGenerating(false);
            setCurrentTaskId(null);
        }
    };

    // 更新当前活动对话
    const updateActiveConversation = () => {
        if (activeConversationId) {
            setConversations(prevConversations => {
                return prevConversations.map(conv => {
                    if (conv.id === activeConversationId) {
                        return { ...conv, messages, lastUpdated: new Date().toISOString() };
                    }
                    return conv;
                });
            });
        }
    };

    // 创建新对话
    const createNewConversation = () => {
        const newId = uuidv4();
        const newConversation = {
            id: newId,
            title: '新对话',
            messages: [],
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };

        setConversations([newConversation, ...conversations]);
        setActiveConversationId(newId);
        setMessages([]);
        setSelectedIds([]);
    };

    // 发送问题
    const sendQuestion = (question) => {
        if (!question.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

        // 判断是新对话还是追问
        const isNewConversation = messages.length === 0;

        // 创建用户消息
        const userMessage = {
            id: uuidv4(),
            role: 'user',
            content: question,
            timestamp: new Date().toISOString()
        };

        // 如果是新对话且没有活动对话，先创建一个
        if (isNewConversation && !activeConversationId) {
            createNewConversation();
        }

        // 更新消息列表
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        // 更新对话标题（如果是新对话）
        if (isNewConversation) {
            setConversations(prevConversations => {
                return prevConversations.map(conv => {
                    if (conv.id === activeConversationId) {
                        return {
                            ...conv,
                            title: question.length > 30 ? question.substring(0, 30) + '...' : question,
                            messages: updatedMessages,
                            lastUpdated: new Date().toISOString()
                        };
                    }
                    return conv;
                });
            });
        } else {
            // 追问情况，只更新消息
            updateActiveConversation();
        }

        // 发送问题到WebSocket
        ws.send(JSON.stringify({
            type: 'question',
            question: question
        }));
    };

    // 停止生成
    const stopGeneration = () => {
        if (ws && currentTaskId) {
            ws.send(JSON.stringify({
                type: 'stop',
                task_id: currentTaskId
            }));
        }
    };

    // 删除选中的对话
    const deleteSelectedConversations = () => {
        if (selectedIds.length === 0) return;

        const newConversations = conversations.filter(conv => !selectedIds.includes(conv.id));
        setConversations(newConversations);

        // 如果当前活动对话被删除，选择新的活动对话
        if (selectedIds.includes(activeConversationId)) {
            if (newConversations.length > 0) {
                setActiveConversationId(newConversations[0].id);
            } else {
                setActiveConversationId(null);
                setMessages([]);
            }
        }

        setSelectedIds([]);
    };

    // 切换对话选择状态
    const toggleConversationSelection = (id) => {
        setSelectedIds(prevIds => {
            if (prevIds.includes(id)) {
                return prevIds.filter(prevId => prevId !== id);
            } else {
                return [...prevIds, id];
            }
        });
    };

    // 选择对话
    const selectConversation = (id) => {
        setActiveConversationId(id);
    };

    return (
        <ChatContext.Provider value={{
            conversations,
            messages,
            activeConversationId,
            isGenerating,
            currentTaskId,
            selectedIds,
            sendQuestion,
            stopGeneration,
            createNewConversation,
            selectConversation,
            toggleConversationSelection,
            deleteSelectedConversations
        }}>
            {children}
        </ChatContext.Provider>
    );
};
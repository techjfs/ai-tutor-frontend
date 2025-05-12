import React, { createContext, useState, useEffect, useRef } from 'react';
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
    // 追问状态
    const [isFollowup, setIsFollowup] = useState(false);

    // 使用useRef来跟踪当前消息状态，而不是外部变量
    const currentMessagesRef = useRef([]);
    // 添加一个ref来跟踪activeConversationId
    const activeConversationIdRef = useRef(null);
    // 添加一个ref来跟踪isFollowup
    const isFollowupRef = useRef(false);

    // 当messages变化时更新ref
    useEffect(() => {
        currentMessagesRef.current = messages;
    }, [messages]);

    // 当activeConversationId变化时更新ref
    useEffect(() => {
        activeConversationIdRef.current = activeConversationId;
    }, [activeConversationId]);

    // 当isFollowup变化时更新ref
    useEffect(() => {
        isFollowupRef.current = isFollowup;
    }, [isFollowup]);

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
        } else {
            localStorage.removeItem("aiTutorConversations");
        }
    }, [conversations]);

    // 当活动对话ID改变时，加载对应的消息
    useEffect(() => {
        if (activeConversationId) {
            const activeConversation = conversations.find(conv => conv.id === activeConversationId);
            if (activeConversation) {
                // 直接设置消息，不依赖on conversations变化
                setMessages(activeConversation.messages || []);
            }
        } else {
            setMessages([]);
        }
    }, [activeConversationId]);

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
                // console.log('收到消息:', data);

                if (data.type === 'llm_response') {
                    handleLLMResponse(data);
                } else if (data.type === 'task_started') {
                    setCurrentTaskId(data.task_id);

                    // 检查是否为追问 - 来自后端的is_followup字段
                    const followupStatus = !!data.is_followup;
                    setIsFollowup(followupStatus);
                    isFollowupRef.current = followupStatus;
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
            // 使用函数式更新确保获取最新状态
            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                const currentIsFollowup = isFollowupRef.current;

                // 检查是否已有AI回复消息，如果有则追加，否则创建新消息
                const lastMessage = newMessages.length > 0 ? newMessages[newMessages.length - 1] : null;

                if (lastMessage && lastMessage.role === 'assistant' && lastMessage.status === 'generating') {
                    // 创建新对象而不是直接修改
                    newMessages[newMessages.length - 1] = {
                        ...lastMessage,
                        content: lastMessage.content + responseData
                    };
                } else {
                    // 创建新消息
                    const newMessage = {
                        id: uuidv4(),
                        role: 'assistant',
                        content: responseData,
                        status: 'generating',
                        timestamp: new Date().toISOString(),
                        isFollowup: currentIsFollowup
                    };
                    newMessages.push(newMessage);
                }

                // 在函数内部更新对话
                updateActiveConversation(newMessages);

                return newMessages;
            });
        }
        else if (event === 'end' || event === 'interrupted' || event === 'error') {
            // 完成生成，更新最后一条消息的状态
            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.status === 'generating') {
                    lastMessage.status = 'complete';
                    // 确保isFollowup不会因后续状态变化而改变
                    lastMessage.isFollowup = lastMessage.isFollowup || false;
                }

                // 更新conversations中的对应对话
                updateActiveConversation(newMessages);

                return newMessages;
            });

            // 重置生成状态
            setIsGenerating(false);
            setCurrentTaskId(null);

            // 不要在这里重置isFollowup，等到新问题时自然重置
            console.log('生成结束，isFollowup将在下一次提问时重置，当前值:', isFollowupRef.current);
        }
    };

    // 更新当前活动对话
    const updateActiveConversation = (updatedMessages = null) => {
        // 使用ref获取最新的activeConversationId
        const currentActiveId = activeConversationIdRef.current;

        if (currentActiveId) {
            const messagesToUpdate = updatedMessages || currentMessagesRef.current;

            setConversations(prevConversations => {
                // 创建一个新的conversations数组，确保引用变化触发组件更新
                return prevConversations.map(conv => {
                    if (conv.id === currentActiveId) {
                        // 创建新对象，不修改原对象
                        return {
                            ...conv,
                            messages: [...messagesToUpdate], // 创建消息数组的副本
                            lastUpdated: new Date().toISOString()
                        };
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
        setConversations(prevConversations => [newConversation, ...prevConversations]);
        setActiveConversationId(newId);
        setMessages([]);
        setSelectedIds([]);
        // 新对话，重置追问状态
        setIsFollowup(false);
        isFollowupRef.current = false;
    };

    // 发送问题
    const sendQuestion = (question) => {
        if (!question.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

        // 判断是新对话还是追问
        const currentMessages = currentMessagesRef.current;
        const isNewConversation = currentMessages.length === 0;
        const activeId = activeConversationIdRef.current;

        // 创建用户消息
        const userMessage = {
            id: uuidv4(),
            role: 'user',
            content: question,
            timestamp: new Date().toISOString()
        };

        // 如果是新对话且没有活动对话，先创建一个
        if (isNewConversation && !activeId) {
            createNewConversation();
        }

        // 更新消息列表
        const updatedMessages = [...currentMessagesRef.current, userMessage];
        setMessages(updatedMessages);

        // 更新对话标题（如果是新对话）
        if (isNewConversation) {
            setConversations(prevConversations => {
                return prevConversations.map(conv => {
                    if (conv.id === activeConversationIdRef.current) {
                        return {
                            ...conv,
                            title: question.length > 30 ? question.substring(0, 30) + '...' : question,
                            messages: [...updatedMessages], // 创建消息数组的副本
                            lastUpdated: new Date().toISOString()
                        };
                    }
                    return conv;
                });
            });
        } else {
            // 追问情况，只更新消息
            updateActiveConversation(updatedMessages);
        }

        // 新问题时可以清除之前的isFollowup状态
        // 后端会根据conversation_id判断是否为追问
        // 我们重置前端状态以便于下一次响应更新正确的标志
        setIsFollowup(false);
        isFollowupRef.current = false;

        // 发送问题到WebSocket
        // 通过传递conversation_id，后端可以判断这是新对话还是追问
        ws.send(JSON.stringify({
            type: 'question',
            question: question,
            conversation_id: activeConversationIdRef.current
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
        // 先保存当前对话的消息（如果有）
        if (activeConversationId) {
            updateActiveConversation();
        }

        // 然后设置新的活动对话
        setActiveConversationId(id);

        // 找到新选中的对话
        const selectedConversation = conversations.find(conv => conv.id === id);
        if (selectedConversation) {
            // 直接设置消息，而不是依赖于useEffect
            setMessages(selectedConversation.messages || []);
        }

        // 切换对话时重置追问状态
        setIsFollowup(false);
        isFollowupRef.current = false;
    };

    return (
        <ChatContext.Provider value={{
            conversations,
            messages,
            activeConversationId,
            isGenerating,
            isFollowup,
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
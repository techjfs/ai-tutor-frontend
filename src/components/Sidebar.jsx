import React, { useContext, useState } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import { formatDate } from '../utils/chatUtils';

const Sidebar = () => {
    const {
        conversations,
        activeConversationId,
        selectConversation,
        selectedIds,
        isGenerating,
        toggleConversationSelection
    } = useContext(ChatContext);

    // 添加展开/折叠状态
    const [isExpanded, setIsExpanded] = useState(true);

    const changeConversation = (conversationId) => {
        if(!isGenerating) {
            selectConversation(conversationId);
        }
    }

    // 切换侧边栏展开/折叠状态
    const toggleSidebar = () => {
        setIsExpanded(!isExpanded);
    };

    // 没有对话时显示的空状态
    if (conversations.length === 0) {
        return (
            <aside className={`${isExpanded ? 'w-64' : 'w-16'} bg-white border-r border-claude-border h-full overflow-y-auto flex flex-col transition-width duration-300 ease-in-out`}>
                <div className="flex justify-end p-2">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded hover:bg-gray-100"
                    >
                        {isExpanded ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 18l-6-6 6-6" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18l6-6-6-6" />
                            </svg>
                        )}
                    </button>
                </div>
                {isExpanded && (
                    <div className="p-4 text-center text-gray-500 mt-10">
                        <p>没有对话记录</p>
                        <p className="text-sm mt-2">点击右上角"新建对话"按钮开始</p>
                    </div>
                )}
            </aside>
        );
    }

    return (
        <aside className={`${isExpanded ? 'w-64' : 'w-16'} bg-white border-r border-claude-border h-full overflow-y-auto flex flex-col transition-width duration-300 ease-in-out`}>
            <div className="flex justify-end p-2">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded hover:bg-gray-100"
                >
                    {isExpanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    )}
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.map(conversation => (
                    <div
                        key={conversation.id}
                        className={`flex items-center ${isExpanded ? 'p-3' : 'p-2 justify-center'} border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                            activeConversationId === conversation.id ? 'bg-claude-light' : ''
                        }`}
                    >
                        {isExpanded ? (
                            <>
                                <input
                                    type="checkbox"
                                    className="mr-3 h-4 w-4 text-claude-accent"
                                    checked={selectedIds.includes(conversation.id)}
                                    onChange={() => toggleConversationSelection(conversation.id)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div
                                    className="flex-1 min-w-0"
                                    onClick={() => changeConversation(conversation.id)}
                                >
                                    <h3 className="text-sm font-medium text-gray-900 truncate">
                                        {conversation.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(conversation.lastUpdated)}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div
                                className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full"
                                onClick={() => changeConversation(conversation.id)}
                            >
                                {conversation.title.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default Sidebar;
import React, { useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import { formatDate } from '../utils/chatUtils';

const Sidebar = () => {
    const {
        conversations,
        activeConversationId,
        selectConversation,
        selectedIds,
        toggleConversationSelection
    } = useContext(ChatContext);

    // 没有对话时显示的空状态
    if (conversations.length === 0) {
        return (
            <aside className="w-64 bg-white border-r border-claude-border h-full overflow-y-auto flex flex-col">
                <div className="p-4 text-center text-gray-500 mt-10">
                    <p>没有对话记录</p>
                    <p className="text-sm mt-2">点击右上角"新建对话"按钮开始</p>
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-64 bg-white border-r border-claude-border h-full overflow-y-auto flex flex-col">
            <div className="flex-1 overflow-y-auto">
                {conversations.map(conversation => (
                    <div
                        key={conversation.id}
                        className={`flex items-center p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                            activeConversationId === conversation.id ? 'bg-claude-light' : ''
                        }`}
                    >
                        <input
                            type="checkbox"
                            className="mr-3 h-4 w-4 text-claude-accent"
                            checked={selectedIds.includes(conversation.id)}
                            onChange={() => toggleConversationSelection(conversation.id)}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div
                            className="flex-1 min-w-0"
                            onClick={() => selectConversation(conversation.id)}
                        >
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                {conversation.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {formatDate(conversation.lastUpdated)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default Sidebar;
import React, { useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';

const Header = () => {
    const {
        createNewConversation,
        selectedIds,
        deleteSelectedConversations
    } = useContext(ChatContext);

    return (
        <header className="bg-white border-b border-claude-border py-3 px-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center">
                <h1 className="text-xl font-semibold text-claude-text">AI 学习规划</h1>
            </div>
            <div className="flex space-x-3">
                {selectedIds.length > 0 ? (
                    <button
                        onClick={deleteSelectedConversations}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
                    >
                        删除选中({selectedIds.length})
                    </button>
                ) : null}
                <button
                    onClick={createNewConversation}
                    className="bg-claude-accent hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                >
                    新建对话
                </button>
            </div>
        </header>
    );
};

export default Header;
// 判断是否是新对话（没有历史消息）
export const isNewConversation = (messages) => {
    return messages.length === 0;
};

// 格式化日期
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

// 为对话生成标题
export const generateConversationTitle = (question) => {
    if (!question) return '新对话';

    // 截取问题的前30个字符作为标题
    const title = question.trim().length > 30 ?
        question.trim().substring(0, 30) + '...' :
        question.trim();

    return title;
};

// 滚动到底部
export const scrollToBottom = (elementRef) => {
    if (elementRef && elementRef.current) {
        elementRef.current.scrollTop = elementRef.current.scrollHeight;
    }
};
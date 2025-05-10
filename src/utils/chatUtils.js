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

/**
 * 将指定的DOM元素滚动到视图底部
 * @param {React.RefObject} ref 要滚动的元素引用
 * @param {Object} options 滚动选项
 * @param {string} options.behavior 滚动行为，'auto'或'smooth'
 * @param {number} options.delay 滚动延迟（毫秒）
 */
export const scrollToBottom = (ref, options = {}) => {
    const { behavior = 'smooth', delay = 0 } = options;

    const scroll = () => {
        if (ref.current) {
            ref.current.scrollIntoView({
                behavior,
                block: 'end',
                inline: 'nearest'
            });
        }
    };

    if (delay > 0) {
        setTimeout(scroll, delay);
    } else {
        scroll();
    }
};

/**
 * 滚动容器到底部
 * @param {HTMLElement} container 要滚动的容器元素
 * @param {Object} options 滚动选项
 * @param {string} options.behavior 滚动行为，'auto'或'smooth'
 */
export const scrollContainerToBottom = (container, options = {}) => {
    const { behavior = 'smooth' } = options;

    if (container) {
        const scrollOptions = {
            top: container.scrollHeight,
            behavior
        };

        container.scrollTo(scrollOptions);
    }
};

/**
 * 检查是否应该自动滚动（基于用户是否正在查看最近的消息）
 * 如果用户已经滚动到底部或接近底部，返回true
 * 如果用户已经向上滚动查看历史消息，返回false
 * @param {HTMLElement} container 滚动容器
 * @param {number} threshold 阈值，接近底部的像素数（默认50px）
 * @returns {boolean} 是否应该自动滚动
 */
export const shouldAutoScroll = (container, threshold = 50) => {
    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    return distanceFromBottom <= threshold;
};
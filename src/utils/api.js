// WebSocket连接配置
export const WS_URL = 'ws://localhost:8050/ws/llm';

// 创建WebSocket连接
export const createWebSocketConnection = () => {
    return new WebSocket(WS_URL);
};

// 发送问题
export const sendQuestionToWebSocket = (ws, question) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'question',
            question: question
        }));
        return true;
    }
    return false;
};

// 停止生成
export const stopGenerationRequest = (ws, taskId) => {
    if (ws && ws.readyState === WebSocket.OPEN && taskId) {
        ws.send(JSON.stringify({
            type: 'stop',
            task_id: taskId
        }));
        return true;
    }
    return false;
};
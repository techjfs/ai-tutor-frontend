import React from 'react';
import { ChatProvider } from './contexts/ChatContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';

function App() {
    return (
        <ChatProvider>
            <div className="flex flex-col h-screen">
                <Header />
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <ChatInterface />
                </div>
            </div>
        </ChatProvider>
    );
}

export default App;
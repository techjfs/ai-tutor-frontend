import React, { useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';

const RecommendedQuestions = ({ questions }) => {
    const { sendQuestion } = useContext(ChatContext);

    if (!questions || questions.length === 0) {
        return null;
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex flex-wrap gap-2">
                {questions.map((question, index) => (
                    <button
                        key={index}
                        onClick={() => sendQuestion(question)}
                        className="inline-flex items-center px-3 py-1.5 bg-claude-dark hover:bg-gray-200 rounded-md text-sm text-claude-accent transition-colors"
                    >
                        {question}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default RecommendedQuestions;
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, AlertCircle } from 'lucide-react';
import { geminiService, GeminiMessage } from '../services/gemini';
import { storageService } from '../services/firebaseStorage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  'How can I improve my resume?',
  'What skills should I learn for my next role?',
  'How do I prepare for technical interviews?',
  'What certifications are valuable for my career?',
  'How can I negotiate a better salary?',
];

// Simple formatted message component for basic markdown-like rendering
function FormattedMessage({ content }: { content: string }) {
  const formatText = (text: string) => {
    // Split by code blocks
    const parts = text.split(/(```[\s\S]*?```|`[^`]+`)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Code block
        const code = part.slice(3, -3).trim();
        return (
          <pre key={index} className="bg-gray-800 text-gray-100 p-3 rounded-lg my-2 overflow-x-auto">
            <code className="text-sm">{code}</code>
          </pre>
        );
      } else if (part.startsWith('`') && part.endsWith('`')) {
        // Inline code
        return (
          <code key={index} className="bg-gray-200 text-gray-900 px-1.5 py-0.5 rounded text-sm">
            {part.slice(1, -1)}
          </code>
        );
      } else {
        // Regular text with bold and line breaks
        const lines = part.split('\n');
        return lines.map((line, lineIndex) => {
          // Handle bold text
          const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
          const formatted = boldParts.map((boldPart, boldIndex) => {
            if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
              return <strong key={boldIndex}>{boldPart.slice(2, -2)}</strong>;
            }
            return <span key={boldIndex}>{boldPart}</span>;
          });
          
          return (
            <p key={`${index}-${lineIndex}`} className="my-1">
              {formatted}
            </p>
          );
        });
      }
    });
  };

  return <div>{formatText(content)}</div>;
}

interface AIAssistantProps {
  hasResume: boolean;
}

export default function AIAssistant({ hasResume }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your Career AI Assistant. I can help you with resume optimization, interview preparation, career planning, and professional development. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const conversationHistory: GeminiMessage[] = messages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // Include resume context if available
      const resume = await storageService.getCurrentResume();
      let contextualMessage = text;
      if (resume && conversationHistory.length === 0) {
        // On first message or when needed, include resume context
        contextualMessage = `Here is my resume for context:\n\n${resume.text.substring(0, 2000)}\n\nQuestion: ${text}`;
      }

      const response = await geminiService.chatResponse(contextualMessage, conversationHistory);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Career AI Assistant</h2>
        <p className="text-gray-600">Ask me anything about your career development</p>
      </div>

      {!hasResume && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Tip: Upload Your Resume</h3>
            <p className="text-blue-700 text-sm">For more personalized career advice, upload your resume using the "Upload Resume" button above. I'll have context about your experience and skills!</p>
          </div>
        </div>
      )}

      <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-5 h-5" />
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>

              <div
                className={`flex-1 max-w-[80%] ${
                  message.role === 'user' ? 'flex justify-end' : ''
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap prose prose-sm max-w-none">
                    {message.role === 'assistant' ? (
                      <FormattedMessage content={message.content} />
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 px-2">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <Loader className="w-5 h-5 text-gray-600 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(question)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-2 rounded-lg transition-colors text-left"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question here..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

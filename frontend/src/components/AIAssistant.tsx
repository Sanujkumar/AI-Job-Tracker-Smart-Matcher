'use client';
import { useState, useEffect, useRef } from 'react';
import { assistantApi } from '@/lib/api';
import { AssistantMessage, FilterUpdate } from '@/types';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

interface AIAssistantProps {
  onFilterUpdate?: (update: FilterUpdate) => void;
}

export default function AIAssistant({ onFilterUpdate }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    try {
      const { conversation } = await assistantApi.getConversation();
      setMessages(conversation.messages || []);
    } catch (error) {
      console.error('Failed to load conversation');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: AssistantMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { response, filterUpdate } = await assistantApi.sendMessage(input);

      const assistantMessage: AssistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        filterUpdate
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (filterUpdate && onFilterUpdate) {
        onFilterUpdate(filterUpdate);
      }
    } catch (error) {
      const errorMessage: AssistantMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again!',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 flex items-center justify-center z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          <div className="p-4 border-b flex justify-between items-center bg-primary-600 rounded-t-2xl">
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:bg-primary-700 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Ask me anything about jobs, filters, or features!</p>
                <div className="mt-4 space-y-2 text-xs">
                  <p className="text-gray-400">Try: "Show only remote jobs"</p>
                  <p className="text-gray-400">Or: "High match scores only"</p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="btn-primary disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

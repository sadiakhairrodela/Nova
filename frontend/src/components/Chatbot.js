import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const CHATBOT_URL = 'http://localhost:8000/chat';

const CATEGORY_ICONS = {
  video_recording:  '🎥',
  video_upload:     '📤',
  video_status:     '📊',
  baby_profile:     '👶',
  consent:          '✅',
  notifications:    '🔔',
  expert_advice:    '💼',
  community:        '👥',
  data_privacy:     '🔒',
  follow_up:        '📅',
  account:          '👤',
  troubleshooting:  '🔧',
  safety_disclaimer:'⚠️',
  general:          '💬',
};

const WELCOME = {
  type: 'bot',
  text: "Hi! I'm the Nova chatbot 👋\n\nI can help you with:\n• Recording and uploading videos\n• Understanding video status\n• Consent and privacy settings\n• Navigating the platform\n\nWhat would you like to know?",
};

const Chatbot = () => {
  const [isOpen, setIsOpen]       = useState(false);
  const [messages, setMessages]   = useState([WELCOME]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [offline, setOffline]     = useState(false);
  const messagesEndRef            = useRef(null);
  const inputRef                  = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setInput('');
    setMessages(prev => [...prev, { type: 'user', text: question }]);
    setLoading(true);
    setOffline(false);

    try {
      const res = await axios.post(CHATBOT_URL, { question }, { timeout: 15000 });
      setMessages(prev => [...prev, {
        type:     'bot',
        text:     res.data.answer,
        category: res.data.category,
        confidence: res.data.confidence,
      }]);
    } catch (err) {
      setOffline(true);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: "I'm having trouble connecting right now. Please try again in a moment, or use the Expert Advice Desk for help.",
        category: 'general',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => setMessages([WELCOME]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat panel */}
      {isOpen && (
        <div className="mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 w-[380px] flex flex-col"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-xl">🤖</div>
              <div>
                <p className="font-bold text-sm">Nova Chatbot</p>
                <p className="text-xs text-blue-100 flex items-center space-x-1">
                  <span className={`w-2 h-2 rounded-full inline-block ${offline ? 'bg-red-400' : 'bg-green-400'}`}></span>
                  <span>{offline ? 'Offline' : 'AI-powered · Non-diagnostic'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={clearChat} title="Clear chat"
                className="w-8 h-8 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 flex items-center justify-center text-sm transition">
                🗑
              </button>
              <button onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-white bg-opacity-10 hover:bg-opacity-20 flex items-center justify-center text-sm transition">
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 mt-1">🤖</div>
                )}
                <div className={`max-w-[82%] ${msg.type === 'user' ? '' : 'space-y-1'}`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.category && msg.type === 'bot' && (
                    <div className="flex items-center space-x-1 pl-1">
                      <span className="text-xs">{CATEGORY_ICONS[msg.category] || '💬'}</span>
                      <span className="text-xs text-gray-400 capitalize">{msg.category.replace(/_/g, ' ')}</span>
                      {msg.confidence > 0 && (
                        <span className="text-xs text-gray-300">· {Math.round(msg.confidence * 100)}%</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs">🤖</div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex space-x-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex-shrink-0">
            <div className="flex space-x-2">
              <input ref={inputRef} type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything about ddodle…"
                disabled={loading}
                className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
              <button onClick={send} disabled={!input.trim() || loading}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition">
                ↑
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              ⚠️ Non-diagnostic — not medical advice
            </p>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setIsOpen(o => !o)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-110 flex items-center justify-center text-2xl">
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
};

export default Chatbot;

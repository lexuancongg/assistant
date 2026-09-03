'use client';
import { useState } from 'react';
import { Send, FileText, Copy, ThumbsUp } from 'lucide-react';
import { CHAT_MESSAGES } from '@/lib/fake-data';

export default function ChatPanel() {
    const [input, setInput] = useState('');

    return (
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col min-w-0">
            <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">AI Assistant</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                {CHAT_MESSAGES.map((msg) =>
                    msg.role === 'user' ? (
                        <div key={msg.id} className="flex justify-end">
                            <div className="bg-blue-600 text-white text-sm px-3.5 py-2 rounded-2xl rounded-tr-sm max-w-[75%]">
                                {msg.content}
                            </div>
                        </div>
                    ) : (
                        <div key={msg.id} className="flex justify-start">
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3.5 max-w-[85%] text-sm">
                                <p className="text-gray-800 font-medium mb-2">{msg.content}</p>
                                {msg.summaryPoints && (
                                    <ul className="flex flex-col gap-1 text-gray-600">
                                        {msg.summaryPoints.map((point, i) => (
                                            <li key={i} className="flex gap-1.5">
                                                <span className="text-gray-300">•</span>
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {msg.sourceFile && (
                                    <div className="mt-3 pt-2.5 border-t border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs text-blue-600">
                                            <FileText className="w-3.5 h-3.5" strokeWidth={2} />
                                            <span className="underline">{msg.sourceFile}</span>
                                            <span className="text-gray-400">({msg.sourcePages})</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-300">
                                            <Copy className="w-3.5 h-3.5 cursor-pointer hover:text-gray-500" strokeWidth={2} />
                                            <ThumbsUp className="w-3.5 h-3.5 cursor-pointer hover:text-gray-500" strokeWidth={2} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                )}
            </div>

            <div className="px-5 py-3.5 border-t border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask anything about your documents..."
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                    />
                    <button
                        className="w-7 h-7 shrink-0 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40"
                        disabled={!input.trim()}
                        aria-label="Gửi"
                    >
                        <Send className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
}

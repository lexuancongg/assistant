path = r"frontend/app/(dashboard)/ai/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

# 1. Add GeminiDiamondIcon
icon_def = """function GeminiDiamondIcon({ className = 'w-4 h-4 text-gray-500' }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z" />
        </svg>
    );
}

const DEFAULT_SAMPLE_SESSIONS: ChatHistorySession[] = [];"""

if "function GeminiDiamondIcon" not in c:
    c = c.replace("const DEFAULT_SAMPLE_SESSIONS: ChatHistorySession[] = [];", icon_def, 1)

# 2. Update AI Overview Header icon
overview_header_target = """<div className="w-5 h-5 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <Sparkles className="w-4 h-4 fill-blue-500/20" />
                                    </div>"""
overview_header_repl = """<div className="w-5 h-5 flex items-center justify-center text-gray-500 dark:text-gray-400">
                                        <GeminiDiamondIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    </div>"""
c = c.replace(overview_header_target, overview_header_repl, 1)

# 3. Update Chat Assistant Avatar and User Message Bubble
msg_target = """                                            {!isUser && (
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                                                    <Sparkles className="w-4 h-4" />
                                                </div>
                                            )}

                                            <div
                                                className={`max-w-[85%] select-text ${
                                                    isUser
                                                        ? 'bg-[#c2e7ff] text-[#001d35] font-medium rounded-2xl rounded-br-xs px-4 py-2.5 text-[13.5px] leading-relaxed shadow-3xs'
                                                        : 'w-full bg-[#f8fafd] dark:bg-slate-800/85 border border-gray-200/90 dark:border-slate-700/80 rounded-2xl rounded-tl-xs p-4 sm:p-5 text-[13.5px] leading-relaxed shadow-xs text-gray-800 dark:text-slate-100'
                                                }`}
                                            >"""

msg_repl = """                                            {!isUser && (
                                                <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-1">
                                                    <GeminiDiamondIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                </div>
                                            )}

                                            <div
                                                className={`select-text ${
                                                    isUser
                                                        ? 'bg-[#f0f4f9] dark:bg-slate-800 text-[#1f1f1f] dark:text-slate-100 rounded-[20px] px-5 py-3.5 text-[14px] leading-relaxed max-w-[85%] font-normal'
                                                        : 'w-full bg-[#f8fafd] dark:bg-slate-800/85 border border-gray-200/90 dark:border-slate-700/80 rounded-2xl rounded-tl-xs p-4 sm:p-5 text-[13.5px] leading-relaxed shadow-xs text-gray-800 dark:text-slate-100 max-w-[85%]'
                                                }`}
                                            >"""
c = c.replace(msg_target, msg_repl, 1)

# 4. Update isGenerating loading animation
gen_target = """                                {isGenerating && (
                                    <div className="flex gap-3 items-center pt-2 pl-1 animate-in fade-in duration-200">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1a73e8] via-[#8ab4f8] to-[#c2e7ff] flex items-center justify-center text-white shadow-sm ring-2 ring-blue-100 dark:ring-blue-900/40 animate-pulse shrink-0">
                                            <Sparkles className="w-4 h-4 fill-white" />
                                        </div>
                                        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#f0f4f9] dark:bg-slate-800/80 border border-gray-200/60 dark:border-slate-700/60 shadow-2xs">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce"></span>
                                            </div>
                                            <span className="text-[12.5px] font-medium text-gray-600 dark:text-slate-300">
                                                Gemini đang xử lý câu trả lời...
                                            </span>
                                        </div>
                                    </div>
                                )}"""

gen_repl = """                                {isGenerating && (
                                    <div className="flex items-center gap-3 pt-3 pl-1 animate-in fade-in duration-200">
                                        <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
                                            <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                            <GeminiDiamondIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                        </div>
                                    </div>
                                )}"""
c = c.replace(gen_target, gen_repl, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print("Update completed successfully!")

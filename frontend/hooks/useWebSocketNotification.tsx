'use client';

import React, { useEffect, useRef } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import toast from 'react-hot-toast';

export interface WsNotification {
    id: number | string;
    title: string;
    message: string;
    type: string;
    fileId?: number | string;
    fileName?: string;
    fileType?: string;
    folderId?: number | string;
    folderName?: string;
    uploaderId?: number | string;
    uploaderName?: string;
    uploaderAvatar?: string;
    timestamp?: string;
}

export function useWebSocketNotification() {
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        let user: any = null;
        try {
            const stored = localStorage.getItem('user');
            if (stored) user = JSON.parse(stored);
        } catch (e) {}

        const userId = user?.id;
        const deptId = user?.departmentId || user?.department?.id;
        const companyId = user?.companyId || user?.company?.id;

        const stompClient = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws') as any,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                console.log('⚡ STOMP WebSocket connected successfully');

                // 1. Subscribe to Broadcast channel
                stompClient.subscribe('/topic/notifications', (message: IMessage) => {
                    handleIncomingMessage(message);
                });

                // 2. Subscribe to User Personal channel
                if (userId) {
                    stompClient.subscribe(`/topic/user/${userId}`, (message: IMessage) => {
                        handleIncomingMessage(message);
                    });
                }

                // 3. Subscribe to Department channel
                if (deptId) {
                    stompClient.subscribe(`/topic/department/${deptId}`, (message: IMessage) => {
                        handleIncomingMessage(message);
                    });
                }

                // 4. Subscribe to Company channel
                if (companyId) {
                    stompClient.subscribe(`/topic/company/${companyId}`, (message: IMessage) => {
                        handleIncomingMessage(message);
                    });
                }
            },
            onStompError: (frame) => {
                console.warn('STOMP Broker error:', frame.headers['message'], frame.body);
            },
            onWebSocketClose: () => {
                console.log('STOMP WebSocket closed');
            },
        });

        stompClient.activate();
        clientRef.current = stompClient;

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, []);

    const playNotificationSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } catch (e) {
            // Audio context not allowed before user gesture
        }
    };

    const handleIncomingMessage = (message: IMessage) => {
        try {
            const notif: WsNotification = JSON.parse(message.body);
            playNotificationSound();

            // Dispatch global event for NotificationDropdown to add item and increase badge
            window.dispatchEvent(
                new CustomEvent('new_ws_notification', { detail: notif })
            );

            // Trigger sleek Toast Notification
            toast.custom(
                (t) => (
                    <div
                        className={`${
                            t.visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-2 opacity-0 scale-95 pointer-events-none'
                        } max-w-md w-full bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.12),0_4px_12px_-2px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7)] rounded-2xl pointer-events-auto flex p-4 border border-blue-200/80 dark:border-blue-900/60 border-l-4 border-l-blue-500 transition-all duration-300 ease-out`}
                    >
                        <div className="flex-1 w-0">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20 font-bold text-sm flex items-center justify-center shrink-0">
                                    {notif.uploaderAvatar || 'U'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                            {notif.title || 'Thông báo mới'}
                                        </p>
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                    </div>
                                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5 truncate">
                                        {notif.fileName || 'Tài liệu mới'}
                                    </p>
                                    <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                                        {notif.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-between pl-3 border-l border-neutral-100 dark:border-neutral-800 ml-3 shrink-0">
                            <button
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    if (notif.fileId) {
                                        window.location.href = `/files`;
                                    } else {
                                        window.location.href = `/files`;
                                    }
                                }}
                                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
                            >
                                Xem ngay
                            </button>
                            <button
                                onClick={() => toast.dismiss(t.id)}
                                className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition text-right"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                ),
                { duration: 6000, position: 'top-right' }
            );
        } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
        }
    };
}
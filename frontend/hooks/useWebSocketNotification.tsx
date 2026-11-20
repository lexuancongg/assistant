'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { API_ROOT } from '@/utils/api/apiClientFixed';

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
    const router = useRouter();

    useEffect(() => {
        let user: any = null;
        let token: string | null = null;
        try {
            const stored = localStorage.getItem('user');
            if (stored) user = JSON.parse(stored);
            token = localStorage.getItem('accessToken');
        } catch (e) {}

        const userId = user?.id;
        const deptId = user?.departmentId || user?.department?.id;
        const companyId = user?.companyId || user?.company?.id;

        const stompClient = new Client({
            webSocketFactory: () => new SockJS(`${API_ROOT}/ws`) as any,
            connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
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
            const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtxClass) return;
            const ctx = new AudioCtxClass();
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
            setTimeout(() => {
                try {
                    ctx.close();
                } catch {}
            }, 600);
        } catch (e) {
            // Audio context not allowed before user gesture
        }
    };

    const handleIncomingMessage = (message: IMessage) => {
        try {
            const notif: WsNotification = JSON.parse(message.body);

            // Bỏ qua nếu người dùng hiện tại chính là người tải file lên
            let currentUserId: any = null;
            try {
                const stored = localStorage.getItem('user');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    currentUserId = parsed?.id;
                }
            } catch (e) {}

            if (notif.uploaderId != null && currentUserId != null && String(notif.uploaderId) === String(currentUserId)) {
                return;
            }

            playNotificationSound();

            // Dispatch global event for NotificationDropdown to add item and increase badge
            window.dispatchEvent(
                new CustomEvent('new_ws_notification', { detail: notif })
            );

            // Toast chuẩn Google Drive Dark Snackbar giống trang Home / Files
            toast.custom(
                (t) => (
                    <div
                        className={`${
                            t.visible
                                ? 'translate-y-0 opacity-100 scale-100'
                                : 'translate-y-2 opacity-0 scale-95 pointer-events-none'
                        } flex items-center justify-between gap-4 bg-[#202124] text-white px-4 py-2.5 rounded-[4px] shadow-2xl border border-white/10 transition-all duration-200 select-none max-w-lg pointer-events-auto`}
                    >
                        <span className="text-[13.5px] font-normal text-[#e8eaed] tracking-tight truncate max-w-sm">
                            {notif.message || notif.title || 'Thông báo mới'}
                        </span>
                        <div className="flex items-center gap-3 shrink-0 ml-1">
                            <button
                                type="button"
                                onClick={() => {
                                    toast.dismiss(t.id);
                                    if (notif.type === 'ACCESS_REQUEST') {
                                        router.push('/access-requests');
                                    } else if (notif.fileId) {
                                        router.push(`/files?fileId=${notif.fileId}`);
                                    } else if (notif.folderId) {
                                        router.push(`/files?folderId=${notif.folderId}`);
                                    } else {
                                        router.push('/files');
                                    }
                                }}
                                className="text-white hover:text-[#8ab4f8] font-medium text-[13.5px] hover:underline cursor-pointer transition px-1 py-0.5"
                            >
                                Xem
                            </button>
                            <button
                                type="button"
                                onClick={() => toast.dismiss(t.id)}
                                className="p-1 text-gray-400 hover:text-white rounded-full transition cursor-pointer hover:bg-white/10"
                                title="Đóng"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ),
                { duration: 6000, position: 'bottom-left' }
            );
        } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
        }
    };
}

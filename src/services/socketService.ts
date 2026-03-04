import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

let socket: Socket | null = null;

export const socketService = {
    connect: (token?: string) => {
        if (socket) return socket;

        socket = io(SOCKET_URL, {
            auth: {
                token
            }
        });

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });

        return socket;
    },

    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    },

    getSocket: () => socket,

    onTableUpdate: (callback: (data: any) => void) => {
        socket?.on('table_update', callback);
    },

    onNewOrder: (callback: (data: any) => void) => {
        socket?.on('new_order', callback);
    },

    offTableUpdate: () => {
        socket?.off('table_update');
    },

    offNewOrder: () => {
        socket?.off('new_order');
    }
};

import { create } from 'zustand'
import YuukiPS from '@/api/yuukips'

export interface Message {
    id: string
    type: 'command' | 'response'
    content: string
    timestamp: Date
}

interface FloatingWindowStore {
    isMinimized: boolean
    messages: Message[]
    yuukips: YuukiPS
    toggleMinimize: () => void
    sendCommand: (uid: string, code: string, server: string, command: string) => void
    clearMessages: () => void
    setMessage: (message: Message) => void
}

export const useFloatingWindow = create<FloatingWindowStore>((set, get) => ({
    isMinimized: true,
    messages: [],
    yuukips: new YuukiPS(),
    setMessage: (message: Message) => set(state => ({ messages: [...state.messages, message] })),

    toggleMinimize: () => set(state => ({ isMinimized: !state.isMinimized })),

    sendCommand: async (uid: string, code: string, server: string, command: string) => {
        const newCommand: Message = {
            id: Date.now().toString(),
            type: 'command',
            content: command,
            timestamp: new Date(),
        }

        set(state => ({ messages: [...state.messages, newCommand] }))

        if (!uid || !code || !server) {
            const noSettings: Message = {
                id: Date.now().toString(),
                type: 'response',
                content: 'Please configure your player settings in the settings page.',
                timestamp: new Date(),
            }
            set(state => ({ messages: [...state.messages, noSettings] }))
            return
        }

        get().yuukips.sendCommand(uid, code, server, command)
    },

    clearMessages: () => set({ messages: [] })
}))
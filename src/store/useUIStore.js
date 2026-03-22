import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUIStore = create(
    persist(
        (set) => ({
            sidebarOpen: true,
            theme: 'light',
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'ui-storage',
        }
    )
)

export default useUIStore

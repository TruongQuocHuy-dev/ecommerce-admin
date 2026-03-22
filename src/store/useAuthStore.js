import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            permissions: [],
            isAuthenticated: false,

            setUser: (user) => set({ user }),
            setToken: (token) => set({ token, isAuthenticated: !!token }),
            setPermissions: (permissions) => set({ permissions }),

            login: (user, token, permissions = []) => set({
                user,
                token,
                permissions,
                isAuthenticated: true
            }),

            logout: () => set({
                user: null,
                token: null,
                permissions: [],
                isAuthenticated: false
            }),

            hasPermission: (permission) => {
                const state = get()
                // Super admin check
                if (state.user?.role === 'super_admin') return true
                return state.permissions.includes(permission)
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                permissions: state.permissions,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
)

export default useAuthStore

import axios from 'axios'
import toast from 'react-hot-toast'
import useAuthStore from '../store/useAuthStore'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from zustand store
    const token = useAuthStore.getState().token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Here you would implement refresh token logic
        // For now, we will just logout
        useAuthStore.getState().logout()
        window.location.href = '/login'
        toast.error('Session expired. Please login again.')
        return Promise.reject(error)
      } catch (authError) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(authError)
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.')
      // Optionally redirect to forbidden page
      // window.location.href = '/403'
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    }

    // Handle generic network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.')
    }

    return Promise.reject(error)
  }
)

export default api

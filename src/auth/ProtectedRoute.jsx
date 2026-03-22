import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import { hasPermission } from '../utils/permissions'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, user } = useAuthStore()
    const location = useLocation()

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (allowedRoles.length > 0 && !hasPermission(user?.role, allowedRoles)) {
        return <Navigate to="/403" replace />
    }

    return children
}

export default ProtectedRoute

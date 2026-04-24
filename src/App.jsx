import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Orders from './pages/Orders'
import ManualOrder from './pages/ManualOrder'
import OrderDetail from './pages/OrderDetail'
import Discounts from './pages/Discounts'
import Sellers from './pages/Sellers'
import Reviews from './pages/Reviews'
import PendingProducts from './pages/PendingProducts'
import StockManagement from './pages/StockManagement'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Banners from './pages/Banners'
import AuditLogs from './pages/AuditLogs'
import ProtectedRoute from './auth/ProtectedRoute'
import ErrorBoundary from './components/ui/ErrorBoundary'
import NotFound from './components/ui/NotFound'
import Forbidden from './components/ui/Forbidden'
import { PERMISSIONS } from './utils/permissions'

const APP_NAME = 'Shopee Clone Admin'

const getPageTitle = (pathname) => {
    if (pathname === '/login') return `Đăng nhập | ${APP_NAME}`
    if (pathname === '/403') return `Không có quyền truy cập | ${APP_NAME}`
    if (pathname === '/404') return `Không tìm thấy trang | ${APP_NAME}`

    if (pathname === '/') return `Bảng điều khiển | ${APP_NAME}`
    if (pathname === '/users') return `Quản lý người dùng | ${APP_NAME}`
    if (pathname === '/products') return `Quản lý sản phẩm | ${APP_NAME}`
    if (pathname === '/products/pending') return `Sản phẩm chờ duyệt | ${APP_NAME}`
    if (pathname === '/products/stock') return `Quản lý tồn kho | ${APP_NAME}`
    if (pathname === '/categories') return `Quản lý danh mục | ${APP_NAME}`
    if (pathname === '/orders') return `Đơn hàng | ${APP_NAME}`
    if (pathname === '/orders/create') return `Tạo đơn hàng thủ công | ${APP_NAME}`
    if (pathname.startsWith('/orders/')) return `Chi tiết đơn hàng | ${APP_NAME}`
    if (pathname === '/sellers') return `Quản lý người bán | ${APP_NAME}`
    if (pathname === '/discounts') return `Quản lý khuyến mãi | ${APP_NAME}`
    if (pathname === '/reviews') return `Đánh giá sản phẩm | ${APP_NAME}`
    if (pathname === '/reports') return `Báo cáo | ${APP_NAME}`
    if (pathname === '/settings') return `Cài đặt | ${APP_NAME}`
    if (pathname === '/banners') return `Quản lý banner | ${APP_NAME}`
    if (pathname === '/audit-logs') return `Nhật ký hệ thống | ${APP_NAME}`

    return APP_NAME
}

const PageTitleManager = () => {
    const { pathname } = useLocation()

    useEffect(() => {
        document.title = getPageTitle(pathname)
    }, [pathname])

    return null
}

function App() {
    return (
        <ErrorBoundary>
            <PageTitleManager />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/403" element={<Forbidden />} />
                <Route path="/404" element={<NotFound />} />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute allowedRoles={PERMISSIONS.VIEW_DASHBOARD}>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Dashboard />} />

                    <Route
                        path="users"
                        element={
                            <ProtectedRoute allowedRoles={PERMISSIONS.VIEW_USERS}>
                                <Users />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="products"
                        element={
                            <ProtectedRoute allowedRoles={PERMISSIONS.VIEW_PRODUCTS}>
                                <Products />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="categories"
                        element={
                            <ProtectedRoute allowedRoles={PERMISSIONS.VIEW_PRODUCTS}>
                                <Categories />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="orders"
                        element={
                            <ProtectedRoute allowedRoles={PERMISSIONS.VIEW_ORDERS}>
                                <Orders />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="orders/create"
                        element={
                            <ProtectedRoute allowedRoles={['admin', 'order_manager']}>
                                <ManualOrder />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="orders/:id"
                        element={
                            <ProtectedRoute allowedRoles={PERMISSIONS.VIEW_ORDERS}>
                                <OrderDetail />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="sellers"
                        element={
                            <ProtectedRoute allowedRoles={PERMISSIONS.VIEW_SELLERS}>
                                <Sellers />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="discounts"
                        element={
                            <ProtectedRoute allowedRoles={PERMISSIONS.MANAGE_PRODUCTS}>
                                <Discounts />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="reviews"
                        element={
                            <ProtectedRoute allowedRoles={PERMISSIONS.VIEW_REVIEWS}>
                                <Reviews />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="products/pending"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <PendingProducts />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="products/stock"
                        element={
                            <ProtectedRoute allowedRoles={['admin', 'seller']}>
                                <StockManagement />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="reports"
                        element={
                            <ProtectedRoute allowedRoles={PERMISSIONS.VIEW_REPORTS}>
                                <Reports />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="settings"
                        element={
                            <ProtectedRoute allowedRoles={PERMISSIONS.VIEW_SETTINGS}>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="banners"
                        element={
                            <ProtectedRoute allowedRoles={PERMISSIONS.MANAGE_SETTINGS}>
                                <Banners />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="audit-logs"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AuditLogs />
                            </ProtectedRoute>
                        }
                    />
                </Route>

                <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
        </ErrorBoundary>
    )
}

export default App

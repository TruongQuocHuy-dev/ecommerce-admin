import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import useUIStore from '../../store/useUIStore'
import clsx from 'clsx'

const Layout = () => {
    const { sidebarOpen } = useUIStore()

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
            {/* Subtle gradient overlay */}
            <div className="fixed inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 pointer-events-none" />

            <Sidebar />
            <div
                className={clsx(
                    "flex-1 flex flex-col transition-all duration-300 relative z-10",
                    sidebarOpen ? "lg:ml-64" : "lg:ml-0"
                )}
            >
                <Header />
                <main className="flex-1 p-6 overflow-auto">
                    <div className="animate-slide-up">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Layout

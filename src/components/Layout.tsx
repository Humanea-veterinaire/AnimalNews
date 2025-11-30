import { Link, Outlet, useLocation } from 'react-router-dom';


export default function Layout() {
    const location = useLocation();
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                        <img src={`${import.meta.env.BASE_URL}humanea-logo.png`} alt="Humanea" className="h-10 md:h-12 w-auto" />
                    </Link>
                    <nav>
                        {location.pathname === '/' && (
                            <Link to="/caregiver/login" className="text-sm font-medium text-gray-500 hover:text-humanea-bordeaux transition-colors">
                                Espace soignant
                            </Link>
                        )}
                    </nav>
                </div>
            </header>
            <main className="flex-1 w-full max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-4 sm:py-8">
                <Outlet />
            </main>
            <footer className="bg-white border-t py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
                    © {new Date().getFullYear()} Humanea Clinique Vétérinaire
                </div>
            </footer>
        </div>
    );
}

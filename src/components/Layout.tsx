import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut } from 'lucide-react';


export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Get current user
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    // Scroll to top on route change (fixes mobile issue where header overlaps content)
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                        <img src={`${import.meta.env.BASE_URL}humanea-logo.png`} alt="Humanea" className="h-10 md:h-12 w-auto" />
                    </Link>
                    <nav className="flex items-center gap-4">
                        {user && location.pathname.startsWith('/caregiver') &&
                            location.pathname !== '/caregiver/login' &&
                            location.pathname !== '/caregiver/signup' ? (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-humanea-bordeaux transition-colors"
                                title="Se déconnecter"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Déconnexion</span>
                            </button>
                        ) : (location.pathname === '/' || location.pathname === '/owner') && (
                            <Link to="/caregiver/login" className="text-sm font-medium text-gray-500 hover:text-humanea-bordeaux transition-colors">
                                Espace soignant
                            </Link>
                        )}
                    </nav>
                </div>
            </header>
            <main className="flex-1 w-full max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-4 sm:py-8 pt-4">
                <Outlet />
            </main>
            <footer className="bg-white border-t py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
                    © {new Date().getFullYear()} AnimalNews
                </div>
            </footer>
        </div>
    );
}

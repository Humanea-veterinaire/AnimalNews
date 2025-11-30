import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';

export default function CaregiverLogin() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    useEffect(() => {
        // Check if user is already logged in
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // User is already logged in, redirect to dashboard
                navigate('/caregiver/dashboard');
            }
        };
        checkAuth();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            navigate('/caregiver/dashboard');
        } catch (err: any) {
            setError(err.message || "Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/caregiver/login`,
            });

            if (error) throw error;

            setResetSuccess(true);
        } catch (err: any) {
            setError(err.message || "Erreur lors de l'envoi de l'email");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-humanea-violet mb-6 text-center">Connexion soignant</h2>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                    <input
                        type="password"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="flex justify-end text-sm">
                    <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-humanea-bordeaux hover:underline"
                    >
                        Mot de passe oublié ?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-humanea-bordeaux text-white py-2 rounded-lg hover:bg-humanea-light transition-colors disabled:opacity-50"
                >
                    {loading ? 'Connexion...' : 'Se connecter'}
                </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <Link to="/caregiver/signup" className="text-humanea-bordeaux hover:underline">
                    S'inscrire
                </Link>
            </p>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                        {resetSuccess ? (
                            <>
                                <h2 className="text-xl font-bold mb-4 text-green-600">Email envoyé !</h2>
                                <p className="text-gray-600 mb-6">
                                    Un lien de réinitialisation a été envoyé à <strong>{resetEmail}</strong>.
                                    Vérifiez votre boîte de réception et suivez les instructions.
                                </p>
                                <button
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setResetSuccess(false);
                                        setResetEmail('');
                                    }}
                                    className="w-full px-4 py-2 bg-humanea-bordeaux text-white rounded-lg hover:bg-humanea-light transition-colors"
                                >
                                    Fermer
                                </button>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold mb-4 text-humanea-violet">Réinitialiser le mot de passe</h2>
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </div>
                                )}
                                <p className="text-gray-600 mb-4 text-sm">
                                    Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                                </p>
                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            placeholder="votre-email@exemple.com"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowForgotPassword(false);
                                                setResetEmail('');
                                                setError(null);
                                            }}
                                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 px-4 py-2 bg-humanea-bordeaux text-white rounded-lg hover:bg-humanea-light transition-colors disabled:opacity-50"
                                        >
                                            {loading ? 'Envoi...' : 'Envoyer'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

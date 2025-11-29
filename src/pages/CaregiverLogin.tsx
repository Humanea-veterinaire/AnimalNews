import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';

export default function CaregiverLogin() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded text-humanea-bordeaux focus:ring-humanea-bordeaux" />
                        Se souvenir de moi
                    </label>
                    <a href="#" className="text-humanea-bordeaux hover:underline">Mot de passe oublié ?</a>
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
        </div>
    );
}

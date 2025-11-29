import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';

export default function CaregiverSignup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        if (!formData.email.endsWith('@humanea-veterinaire.fr')) {
            setError("L'email doit se terminer par @humanea-veterinaire.fr");
            return;
        }

        setLoading(true);

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                    },
                },
            });

            if (signUpError) throw signUpError;

            alert("Inscription réussie ! Veuillez confirmer votre email avant de vous connecter.");
            navigate('/caregiver/login');
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-humanea-violet mb-6 text-center">Inscription Soignant</h2>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 mb-4 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                        <input
                            name="firstName"
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none"
                            value={formData.firstName}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                        <input
                            name="lastName"
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none"
                            value={formData.lastName}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel</label>
                    <input
                        type="email"
                        name="email"
                        required
                        placeholder="prenom.nom@humanea-veterinaire.fr"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                    <input
                        type="password"
                        name="password"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none"
                        value={formData.password}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-humanea-bordeaux text-white py-2 rounded-lg hover:bg-humanea-light transition-colors disabled:opacity-50"
                >
                    {loading ? 'Inscription...' : "S'inscrire"}
                </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
                Déjà un compte ?{' '}
                <Link to="/caregiver/login" className="text-humanea-bordeaux hover:underline">
                    Se connecter
                </Link>
            </p>
        </div>
    );
}

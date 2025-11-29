import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            navigate(`/owner?email=${encodeURIComponent(email)}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="w-full max-w-md text-center space-y-8">
                <h1 className="text-4xl font-bold text-humanea-violet">
                    Des nouvelles de votre compagnon
                </h1>
                <p className="text-gray-600 text-lg">
                    Entrez votre adresse email pour consulter les nouvelles de votre animal hospitalisé.
                </p>

                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="email"
                        required
                        placeholder="votre-email@exemple.com"
                        className="w-full px-6 py-4 rounded-full border-2 border-humanea-bordeaux/20 focus:border-humanea-bordeaux focus:ring-2 focus:ring-humanea-bordeaux/20 outline-none transition-all text-lg shadow-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="mt-6 w-full bg-humanea-bordeaux text-white font-semibold py-4 rounded-full hover:bg-humanea-light transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
                    >
                        Consulter les nouvelles
                    </button>
                </form>
            </div>
        </div>
    );
}

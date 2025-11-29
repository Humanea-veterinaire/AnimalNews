import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Animal } from '../types';
import { Plus, LayoutList, Archive as ArchiveIcon, Shield, Trash2, UserCheck } from 'lucide-react';
import ExpandedAnimalCard from '../components/ExpandedAnimalCard';

export default function CaregiverDashboard() {
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [connections, setConnections] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState<Animal | null>(null);
    const [activeTab, setActiveTab] = useState<'hospitalized' | 'archived' | 'admin'>('hospitalized');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCaregiver, setSelectedCaregiver] = useState<string>('all');
    const [caregivers, setCaregivers] = useState<Array<{ id: string; first_name: string; last_name: string; email: string; role: string }>>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [allProfiles, setAllProfiles] = useState<Array<{ id: string; first_name: string; last_name: string; email: string; role: string }>>([]);
    const [error, setError] = useState<string | null>(null);
    const [newAnimal, setNewAnimal] = useState<Partial<Animal>>({
        name: '',
        last_name: '',
        species: 'Chien',
        owner_email: '',
        is_hospitalized: true
    });

    useEffect(() => {
        checkAdminStatus();
        fetchAnimals();
        fetchCaregivers();
    }, []);

    const checkAdminStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (data?.role === 'admin') {
                setIsAdmin(true);
                fetchAllProfiles();
            }
        }
    };

    const fetchAllProfiles = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .neq('role', 'owner') // Don't manage owners here
            .order('created_at', { ascending: false });

        if (data) setAllProfiles(data);
    };

    const promoteToAdmin = async (profileId: string) => {
        if (!window.confirm("Voulez-vous vraiment donner les droits d'administrateur à cet utilisateur ?")) return;

        const { error } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', profileId);

        if (!error) {
            setAllProfiles(allProfiles.map(p => p.id === profileId ? { ...p, role: 'admin' } : p));
            alert("Utilisateur promu administrateur !");
        } else {
            alert("Erreur lors de la promotion.");
        }
    };

    const deleteProfile = async (profileId: string) => {
        // Check if the user to be deleted is an admin
        const profileToDelete = allProfiles.find(p => p.id === profileId);
        if (profileToDelete?.role === 'admin') {
            const adminCount = allProfiles.filter(p => p.role === 'admin').length;
            if (adminCount <= 1) {
                alert("Impossible de supprimer le dernier administrateur. Veuillez d'abord promouvoir un autre utilisateur.");
                return;
            }
        }

        if (!window.confirm("ATTENTION : Cette action supprimera définitivement le compte de ce soignant. Continuer ?")) return;

        // Note: This requires the RLS policy created in the migration
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', profileId);

        if (!error) {
            setAllProfiles(allProfiles.filter(p => p.id !== profileId));
            // Also remove from caregivers list if present
            setCaregivers(caregivers.filter(c => c.id !== profileId));
        } else {
            console.error(error);
            alert("Erreur lors de la suppression. Vérifiez que vous avez les droits nécessaires.");
        }
    };

    const fetchAnimals = async () => {
        const { data: animalsData, error } = await supabase
            .from('animals')
            .select('*, assigned_caregiver:assigned_caregiver_id(first_name, last_name)')
            .order('created_at', { ascending: false });

        if (!error && animalsData) {
            setAnimals(animalsData);
            fetchConnections();
        }
        setLoading(false);
    };

    const fetchCaregivers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, role')
            .in('role', ['caregiver', 'admin']); // Fetch both caregivers and admins for the filter

        if (data) setCaregivers(data);
    };

    const fetchConnections = async () => {
        const { data } = await supabase
            .from('owner_connections')
            .select('animal_id, last_connection')
            .order('last_connection', { ascending: false });

        if (data) {
            const lastSeen: Record<string, string> = {};
            data.forEach((conn: any) => {
                if (!lastSeen[conn.animal_id]) {
                    lastSeen[conn.animal_id] = conn.last_connection;
                }
            });
            setConnections(lastSeen);
        }
    };

    const toggleStatus = async (e: React.MouseEvent, animal: Animal) => {
        e.preventDefault();
        const newStatus = !animal.is_hospitalized;

        const { error } = await supabase
            .from('animals')
            .update({ is_hospitalized: newStatus })
            .eq('id', animal.id);

        if (!error) {
            setAnimals(animals.map(a => a.id === animal.id ? { ...a, is_hospitalized: newStatus } : a));
        }
    };

    const deleteAnimal = async (e: React.MouseEvent, animalId: string) => {
        e.preventDefault();
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cet animal ? Cette action est irréversible.')) return;

        const { error } = await supabase
            .from('animals')
            .delete()
            .eq('id', animalId);

        if (!error) {
            setAnimals(animals.filter(a => a.id !== animalId));
        }
    };

    const handleAddAnimal = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const { data: userData } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('animals')
                .insert([{
                    ...newAnimal,
                    assigned_caregiver_id: userData.user?.id // Auto-assign to creator
                }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setAnimals([data, ...animals]);
                setShowAddModal(false);
                setShowSuccessModal(data); // Show success modal
                setNewAnimal({ name: '', species: 'Chien', owner_email: '', is_hospitalized: true });
            }
        } catch (err: any) {
            console.error('Error adding animal:', err);
            setError(err.message || "Impossible d'ajouter l'animal. Vérifiez vos droits.");
        }
    };

    const filteredAnimals = animals
        .filter(a => activeTab === 'hospitalized' ? a.is_hospitalized : !a.is_hospitalized)
        .filter(a =>
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (a.last_name && a.last_name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .filter(a => {
            if (selectedCaregiver === 'all') return true;
            // If no caregiver is assigned, don't filter it out (show in all caregivers)
            if (!a.assigned_caregiver_id) return true;
            return a.assigned_caregiver_id === selectedCaregiver;
        });

    return (
        <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-humanea-violet">Tableau de bord</h1>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('hospitalized')}
                            className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'hospitalized'
                                ? 'bg-white text-humanea-violet shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <LayoutList className="w-4 h-4" />
                            En cours
                        </button>
                        <button
                            onClick={() => setActiveTab('archived')}
                            className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'archived'
                                ? 'bg-white text-humanea-violet shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <ArchiveIcon className="w-4 h-4" />
                            Archives
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === 'admin'
                                    ? 'bg-white text-humanea-violet shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Shield className="w-4 h-4" />
                                Admin
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-humanea-bordeaux text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-humanea-light transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Ajouter un animal</span>
                        <span className="sm:hidden">Ajouter</span>
                    </button>
                </div>
            </div>

            {/* Admin View */}
            {activeTab === 'admin' && isAdmin ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Gestion des soignants</h2>
                        <p className="text-sm text-gray-500">Gérez les comptes et les permissions de l'équipe.</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {allProfiles.map((profile) => (
                            <div key={profile.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${profile.role === 'admin' ? 'bg-humanea-violet' : 'bg-gray-400'
                                        }`}>
                                        {profile.first_name?.[0]}{profile.last_name?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">
                                            {profile.first_name} {profile.last_name}
                                            {profile.role === 'admin' && <span className="ml-2 text-xs bg-humanea-violet/10 text-humanea-violet px-2 py-0.5 rounded-full">Admin</span>}
                                        </h3>
                                        <p className="text-sm text-gray-500">{profile.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {profile.role !== 'admin' && (
                                        <button
                                            onClick={() => promoteToAdmin(profile.id)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Promouvoir Admin"
                                        >
                                            <UserCheck className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteProfile(profile.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Supprimer le compte"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Search and Filter Bar */}
                    <div className="flex flex-col md:flex-row gap-3 mb-6">
                        <input
                            type="text"
                            placeholder="Rechercher un animal..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none"
                        />
                        <select
                            value={selectedCaregiver}
                            onChange={(e) => setSelectedCaregiver(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none bg-white"
                        >
                            <option value="all">Tous les soignants</option>
                            {caregivers.map((caregiver) => (
                                <option key={caregiver.id} value={caregiver.id}>
                                    {caregiver.first_name} {caregiver.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {
                        loading ? (
                            <div className="text-center py-10 text-gray-500">Chargement...</div>
                        ) : (
                            <div className="space-y-4">
                                {filteredAnimals.length > 0 ? (
                                    filteredAnimals.map((animal) => (
                                        <ExpandedAnimalCard
                                            key={animal.id}
                                            animal={animal}
                                            lastSeen={connections[animal.id]}
                                            onToggleStatus={(e) => toggleStatus(e, animal)}
                                            onDelete={(e) => deleteAnimal(e, animal.id)}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        <p className="text-gray-500">
                                            {activeTab === 'hospitalized'
                                                ? "Aucun animal en cours d'hospitalisation."
                                                : "Aucune archive pour le moment."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )
                    }
                </>
            )}

            {/* Add Animal Modal */}
            {
                showAddModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold mb-4 text-humanea-violet">Ajouter un animal</h2>
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleAddAnimal} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                                        <input
                                            required
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none"
                                            value={newAnimal.name}
                                            onChange={(e) => setNewAnimal({ ...newAnimal, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom de famille (optionnel)</label>
                                        <input
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none"
                                            value={newAnimal.last_name || ''}
                                            onChange={(e) => setNewAnimal({ ...newAnimal, last_name: e.target.value })}
                                            placeholder="Invisible pour le propriétaire"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Espèce</label>
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none"
                                        value={newAnimal.species}
                                        onChange={e => setNewAnimal({ ...newAnimal, species: e.target.value })}
                                    >
                                        <option value="Chien">Chien</option>
                                        <option value="Chat">Chat</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Email Propriétaire</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none"
                                        value={newAnimal.owner_email}
                                        onChange={e => setNewAnimal({ ...newAnimal, owner_email: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-humanea-bordeaux text-white rounded-lg hover:bg-humanea-light transition-colors"
                                    >
                                        Ajouter
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Success Modal */}
            {
                showSuccessModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Plus className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-xl font-bold mb-2 text-gray-900">Animal ajouté !</h2>
                            <p className="text-gray-600 mb-6">
                                Souhaitez-vous envoyer un email au propriétaire pour le prévenir ?
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={async () => {
                                        const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;
                                        if (!webhookUrl) {
                                            alert("L'URL du webhook n'est pas configurée.");
                                            return;
                                        }

                                        const btn = document.getElementById('webhook-btn');
                                        if (btn) {
                                            btn.textContent = 'Envoi en cours...';
                                            (btn as HTMLButtonElement).disabled = true;
                                        }

                                        try {
                                            const response = await fetch(webhookUrl, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    animal_name: showSuccessModal.name,
                                                    owner_email: showSuccessModal.owner_email,
                                                    site_url: window.location.origin,
                                                    caregiver_name: "L'équipe Humanea" // You could fetch the current user's name if needed
                                                })
                                            });

                                            if (response.ok) {
                                                alert("Email envoyé avec succès !");
                                                setShowSuccessModal(null);
                                            } else {
                                                throw new Error('Erreur réseau');
                                            }
                                        } catch (e) {
                                            console.error(e);
                                            alert("Erreur lors de l'envoi. Veuillez réessayer.");
                                            if (btn) {
                                                btn.textContent = 'Envoyer un email';
                                                (btn as HTMLButtonElement).disabled = false;
                                            }
                                        }
                                    }}
                                    id="webhook-btn"
                                    className="block w-full px-4 py-2 bg-humanea-violet text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                                >
                                    Envoyer un email
                                </button>

                                <button
                                    onClick={() => setShowSuccessModal(null)}
                                    className="block w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Animal, DailyReport } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Dog, Cat, Clock, ThumbsUp } from 'lucide-react';

export default function OwnerDashboard() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [likedReports, setLikedReports] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (email) fetchAnimals();
    }, [email]);

    useEffect(() => {
        if (selectedAnimal && email) {
            fetchReports(selectedAnimal.id);
            trackConnection(selectedAnimal.id);

            // Set up real-time subscription for report updates
            const channel = supabase
                .channel(`reports_${selectedAnimal.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'daily_reports',
                        filter: `animal_id=eq.${selectedAnimal.id}`
                    },
                    () => {
                        // Refetch reports when any change occurs
                        fetchReports(selectedAnimal.id);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [selectedAnimal, email]);

    const fetchAnimals = async () => {
        const { data } = await supabase.rpc('get_animals_by_owner_email', {
            email_input: email
        });

        if (data) {
            setAnimals(data);
            if (data.length > 0) setSelectedAnimal(data[0]);
        }
        setLoading(false);
    };

    const fetchReports = async (animalId: string) => {
        const { data } = await supabase.rpc('get_animal_reports', {
            p_animal_id: animalId,
            p_owner_email: email
        });

        if (data) {
            const sorted = (data as DailyReport[]).sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            setReports(sorted);

            // Fetch which reports this owner has liked
            const reportIds = sorted.map(r => r.id);
            if (reportIds.length > 0) {
                const { data: likesData } = await supabase
                    .from('report_likes')
                    .select('report_id')
                    .eq('owner_email', email)
                    .in('report_id', reportIds);

                if (likesData) {
                    setLikedReports(new Set(likesData.map(l => l.report_id)));
                }
            }
        }
    };

    const trackConnection = async (animalId: string) => {
        await supabase.from('owner_connections').insert({
            owner_email: email,
            animal_id: animalId,
            last_connection: new Date().toISOString()
        });
    };

    if (!email) return <div className="text-center p-10">Email manquant</div>;
    if (loading) return <div className="text-center p-10">Chargement...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-humanea-violet mb-6">Bonjour</h1>

            {animals.length === 0 ? (
                <div className="bg-white p-8 rounded-xl text-center shadow-sm">
                    <p className="text-gray-600">Aucun animal hospitalisé trouvé pour cet email.</p>
                </div>
            ) : (
                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
                    {/* Animal Navigation - Only show if more than 1 animal */}
                    {animals.length > 1 && (
                        <div className="lg:col-span-1">
                            {/* Mobile: Horizontal Scroll */}
                            <div className="lg:hidden flex overflow-x-auto gap-3 pb-2 mb-2 -mx-4 px-4 scrollbar-hide">
                                {animals.map(animal => (
                                    <button
                                        key={animal.id}
                                        onClick={() => setSelectedAnimal(animal)}
                                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap border ${selectedAnimal?.id === animal.id
                                            ? 'bg-humanea-bordeaux text-white border-humanea-bordeaux shadow-md'
                                            : 'bg-white text-gray-600 border-gray-200'
                                            }`}
                                    >
                                        {animal.species === 'Chien' ? <Dog className="w-4 h-4" /> : <Cat className="w-4 h-4" />}
                                        <span className="font-bold text-sm">{animal.name}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Desktop: Vertical List */}
                            <div className="hidden lg:block space-y-4">
                                <h2 className="font-semibold text-gray-500 uppercase text-xs tracking-wider mb-2">Vos animaux</h2>
                                {animals.map(animal => (
                                    <button
                                        key={animal.id}
                                        onClick={() => setSelectedAnimal(animal)}
                                        className={`w-full text-left p-4 rounded-xl transition-all ${selectedAnimal?.id === animal.id
                                            ? 'bg-humanea-bordeaux text-white shadow-lg transform scale-105'
                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${selectedAnimal?.id === animal.id ? 'bg-white/20' : 'bg-gray-100'}`}>
                                                {animal.species === 'Chien' ? <Dog className="w-5 h-5" /> : <Cat className="w-5 h-5" />}
                                            </div>
                                            <span className="font-bold">{animal.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className={`space-y-6 ${animals.length > 1 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                        {selectedAnimal && (
                            <>
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h2 className="text-2xl font-bold text-humanea-violet mb-1">{selectedAnimal.name}</h2>
                                    <p className="text-gray-500 text-sm">
                                        Admis le {format(new Date(selectedAnimal.admission_date), 'dd MMMM yyyy', { locale: fr })}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Dernière nouvelle
                                    </h3>

                                    {reports.length > 0 ? (
                                        reports.slice(0, 1).map(report => (
                                            <div key={report.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-humanea-rose"></div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                                    <Clock className="w-4 h-4" />
                                                    {format(new Date(report.created_at), "d MMMM 'à' HH:mm", { locale: fr })}
                                                </div>
                                                <p className="text-gray-700 whitespace-pre-wrap mb-4">{report.content}</p>
                                                {report.image_url && (
                                                    <img
                                                        src={report.image_url}
                                                        alt="Nouvelle"
                                                        className="w-full h-auto max-h-[400px] object-contain rounded-lg shadow-sm bg-gray-50 mb-4"
                                                    />
                                                )}

                                                <div className="flex justify-end">
                                                    <button
                                                        onClick={async () => {
                                                            // Call the toggle function
                                                            const { data, error } = await supabase.rpc('toggle_report_like', {
                                                                p_report_id: report.id,
                                                                p_owner_email: email
                                                            });

                                                            if (!error && data && data.length > 0) {
                                                                const result = data[0];

                                                                // Update local state
                                                                const newLikedReports = new Set(likedReports);
                                                                if (result.liked) {
                                                                    newLikedReports.add(report.id);
                                                                } else {
                                                                    newLikedReports.delete(report.id);
                                                                }
                                                                setLikedReports(newLikedReports);

                                                                // Update the report's like count
                                                                setReports(reports.map(r =>
                                                                    r.id === report.id
                                                                        ? { ...r, likes: result.like_count }
                                                                        : r
                                                                ));
                                                            }
                                                        }}
                                                        className={`p-2 rounded-full transition-all ${likedReports.has(report.id)
                                                            ? 'text-humanea-bordeaux'
                                                            : 'text-humanea-bordeaux hover:bg-humanea-bordeaux/5'
                                                            }`}
                                                        title={likedReports.has(report.id) ? "Je n'aime plus" : "J'aime"}
                                                    >
                                                        <ThumbsUp
                                                            className={`w-6 h-6 ${likedReports.has(report.id)
                                                                ? 'fill-current'
                                                                : ''
                                                                }`}
                                                            strokeWidth={1.5}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed">
                                            Pas encore de nouvelles pour le moment.
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

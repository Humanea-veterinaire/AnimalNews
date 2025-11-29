import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Animal, DailyReport } from '../types';
import { ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AnimalDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [animal, setAnimal] = useState<Animal | null>(null);
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [newReport, setNewReport] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        const { data: animalData } = await supabase
            .from('animals')
            .select('*')
            .eq('id', id)
            .single();

        const { data: reportsData } = await supabase
            .from('daily_reports')
            .select('*')
            .eq('animal_id', id)
            .order('created_at', { ascending: false });

        if (animalData) setAnimal(animalData);
        if (reportsData) setReports(reportsData);
        setLoading(false);
    };

    const [uploading, setUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
        }
    };

    const handleAddReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReport.trim() && !selectedImage) return;

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        setUploading(true);
        let imageUrl = null;

        try {
            if (selectedImage) {
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('report-images')
                    .upload(filePath, selectedImage);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('report-images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            const { data, error } = await supabase
                .from('daily_reports')
                .insert({
                    content: newReport,
                    animal_id: id,
                    caregiver_id: userData.user.id,
                    image_url: imageUrl
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setReports([data, ...reports]);
                setNewReport('');
                setSelectedImage(null);
            }
        } catch (error) {
            console.error('Error uploading report:', error);
            alert('Erreur lors de la publication');
        } finally {
            setUploading(false);
        }
    };

    const toggleHospitalization = async () => {
        if (!animal) return;
        const { data } = await supabase
            .from('animals')
            .update({ is_hospitalized: !animal.is_hospitalized })
            .eq('id', animal.id)
            .select()
            .single();

        if (data) setAnimal(data);
    };

    if (loading) return <div className="text-center py-10">Chargement...</div>;
    if (!animal) return <div className="text-center py-10">Animal non trouvé</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Retour
            </button>

            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-humanea-violet mb-2">{animal.name}</h1>
                        <p className="text-gray-500">Propriétaire : {animal.owner_email}</p>
                    </div>
                    <button
                        onClick={toggleHospitalization}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${animal.is_hospitalized
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {animal.is_hospitalized ? 'Hospitalisé' : 'Sorti'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Donner des nouvelles</h2>
                        <form onSubmit={handleAddReport}>
                            <textarea
                                className="w-full border rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none resize-none"
                                placeholder="Écrivez les nouvelles ici..."
                                value={newReport}
                                onChange={e => setNewReport(e.target.value)}
                            />

                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="image-upload"
                                        className="hidden"
                                        onChange={handleImageSelect}
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className="cursor-pointer text-sm text-gray-600 hover:text-humanea-bordeaux flex items-center gap-2 transition-colors"
                                    >
                                        <div className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                            📷 Ajouter une photo
                                        </div>
                                        {selectedImage && <span className="text-green-600 text-xs truncate max-w-[150px]">{selectedImage.name}</span>}
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={(!newReport.trim() && !selectedImage) || uploading}
                                    className="bg-humanea-bordeaux text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-humanea-light transition-colors disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                    {uploading ? 'Envoi...' : 'Publier'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-4">
                        {reports.map((report) => (
                            <div key={report.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                <div className="text-sm text-gray-400 mb-2">
                                    {format(new Date(report.created_at), "d MMMM 'à' HH:mm", { locale: fr })}
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap mb-4">{report.content}</p>
                                {report.image_url && (
                                    <img
                                        src={report.image_url}
                                        alt="Nouvelle"
                                        className="w-full h-auto rounded-lg shadow-sm"
                                    />
                                )}
                            </div>
                        ))}
                        {reports.length === 0 && (
                            <div className="text-center text-gray-500 py-10">Aucune nouvelle pour le moment.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

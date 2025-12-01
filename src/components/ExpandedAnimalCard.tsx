import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Animal, DailyReport } from '../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Send, Archive, Trash2, RefreshCcw, Eye, ChevronUp, ChevronDown, Calendar, Mail, Edit2, Check, X } from 'lucide-react';

interface ExpandedAnimalCardProps {
    animal: Animal;
    lastSeen?: string;
    onToggleStatus: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
}

export default function ExpandedAnimalCard({ animal, lastSeen, onToggleStatus, onDelete }: ExpandedAnimalCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [reports, setReports] = useState<DailyReport[]>([]);
    const [newReport, setNewReport] = useState('');
    const [loadingReports, setLoadingReports] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [editingReportId, setEditingReportId] = useState<string | null>(null);
    const [editedContent, setEditedContent] = useState('');

    useEffect(() => {
        if (isExpanded) {
            fetchReports();
        }
    }, [isExpanded]);

    const fetchReports = async () => {
        setLoadingReports(true);
        const { data } = await supabase
            .from('daily_reports')
            .select('*')
            .eq('animal_id', animal.id)
            .order('created_at', { ascending: false });

        if (data) setReports(data);
        setLoadingReports(false);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedImage(e.target.files[0]);
        }
    };

    const compressImage = async (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Resize if larger than 1200px wide
                    const maxWidth = 1200;
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (blob) resolve(blob);
                            else reject(new Error('Compression failed'));
                        },
                        'image/jpeg',
                        0.85 // 85% quality
                    );
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
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
                // Compress the image before upload
                const compressedBlob = await compressImage(selectedImage);
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${animal.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('report-images')
                    .upload(filePath, compressedBlob);

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
                    animal_id: animal.id,
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
            alert('Erreur lors de la publication : ' + ((error as any).message || JSON.stringify(error)));
        } finally {
            setUploading(false);
        }
    };

    const handleSendEmail = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!window.confirm(`Prévenir par e-mail ${animal.owner_email} qu'il peut consulter les nouvelles de son animal ici ?`)) return;

        setSendingEmail(true);
        const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;

        if (!webhookUrl) {
            alert("L'URL du webhook n'est pas configurée.");
            setSendingEmail(false);
            return;
        }

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    animal_name: animal.name,
                    owner_email: animal.owner_email,
                    site_url: window.location.origin,
                    caregiver_name: "L'équipe Humanea"
                })
            });

            if (response.ok) {
                alert("Email envoyé avec succès !");
            } else {
                throw new Error('Erreur réseau');
            }
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'envoi. Veuillez réessayer.");
        } finally {
            setSendingEmail(false);
        }
    };

    const handleEditReport = (report: DailyReport) => {
        setEditingReportId(report.id);
        setEditedContent(report.content);
    };

    const handleSaveEdit = async (reportId: string) => {
        const { error } = await supabase
            .from('daily_reports')
            .update({ content: editedContent })
            .eq('id', reportId);

        if (!error) {
            setReports(reports.map(r => r.id === reportId ? { ...r, content: editedContent } : r));
            setEditingReportId(null);
            setEditedContent('');
        } else {
            alert("Erreur lors de la modification du rapport");
        }
    };

    const handleCancelEdit = () => {
        setEditingReportId(null);
        setEditedContent('');
    };

    const formatDate = (dateString?: string | null, showTime: boolean = true) => {
        if (!dateString) return "Date inconnue";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Date inconnue";
            const formatStr = showTime ? "'le' dd/MM 'à' HH:mm" : "dd MMMM yyyy";
            return format(date, formatStr, { locale: fr });
        } catch (e) {
            console.error("Date formatting error:", e);
            return "Date inconnue";
        }
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border transition-all ${isExpanded ? 'ring-2 ring-humanea-violet/10' : 'hover:shadow-md border-gray-100'}`}>
            {/* Header / Summary Card */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-6 cursor-pointer"
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full transition-colors ${animal.is_hospitalized
                            ? 'bg-humanea-rose/10 text-humanea-rose'
                            : 'bg-gray-200 text-gray-500'
                            }`}>
                            {animal.species === 'Chien' ? '🐕' : '🐈'}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {animal.name} {animal.last_name && <span className="text-gray-500 font-normal text-lg">({animal.last_name})</span>}
                            </h3>
                            <p className="text-sm text-gray-500">Propriétaire : {animal.owner_email}</p>
                            {animal.assigned_caregiver && (
                                <p className="text-xs text-humanea-violet font-medium mt-0.5">
                                    Responsable : {animal.assigned_caregiver.first_name} {animal.assigned_caregiver.last_name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={onToggleStatus}
                            className={`p-2 rounded-full transition-colors ${animal.is_hospitalized
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                            title={animal.is_hospitalized ? "Marquer comme sorti" : "Réhospitaliser"}
                        >
                            {animal.is_hospitalized ? <Archive className="w-4 h-4" /> : <RefreshCcw className="w-4 h-4" />}
                        </button>

                        {animal.is_hospitalized && (
                            <button
                                onClick={handleSendEmail}
                                disabled={sendingEmail}
                                className="p-2 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors disabled:opacity-50"
                                title="Envoyer un email au propriétaire"
                            >
                                <Mail className="w-4 h-4" />
                            </button>
                        )}

                        {!animal.is_hospitalized && (
                            <button
                                onClick={onDelete}
                                className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                title="Supprimer définitivement"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}

                        <div className="ml-2 p-2 text-gray-400">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1 text-xs text-gray-400 pl-[60px]">
                    <span>
                        Admis le {animal.admission_date
                            ? formatDate(animal.admission_date, false)
                            : formatDate(animal.created_at, true)}
                    </span>
                    {lastSeen && (
                        <span className="flex items-center gap-1 text-humanea-violet font-medium">
                            <Eye className="w-3 h-3" />
                            Vu {formatDate(lastSeen)}
                        </span>
                    )}
                </div>
            </div>

            {/* Expanded Content (Reports) */}
            {isExpanded && (
                <div className="border-t border-gray-100 p-6 bg-gray-50/50 rounded-b-xl">
                    {/* Add Report Form */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Donner des nouvelles</h4>
                        <form onSubmit={handleAddReport}>
                            <textarea
                                className="w-full border rounded-lg p-3 min-h-[80px] text-sm focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none resize-none"
                                placeholder="Écrivez les nouvelles ici..."
                                value={newReport}
                                onChange={e => setNewReport(e.target.value)}
                            />

                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id={`image-upload-${animal.id}`}
                                        className="hidden"
                                        onChange={handleImageSelect}
                                    />
                                    <label
                                        htmlFor={`image-upload-${animal.id}`}
                                        className="cursor-pointer text-xs text-gray-600 hover:text-humanea-bordeaux flex items-center gap-2 transition-colors"
                                    >
                                        <div className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                            📷 Photo
                                        </div>
                                        {selectedImage && <span className="text-green-600 truncate max-w-[100px]">{selectedImage.name}</span>}
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={(!newReport.trim() && !selectedImage) || uploading}
                                    className="bg-humanea-bordeaux text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-humanea-light transition-colors disabled:opacity-50 text-sm"
                                >
                                    <Send className="w-3 h-3" />
                                    {uploading ? '...' : 'Publier'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Reports List */}
                    <div className="space-y-4">
                        {loadingReports ? (
                            <div className="text-center text-gray-400 text-sm py-4">Chargement des nouvelles...</div>
                        ) : reports.length > 0 ? (
                            reports.map((report) => (
                                <div key={report.id} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between gap-2 text-xs text-gray-500 mb-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(report.created_at), "d MMMM 'à' HH:mm", { locale: fr })}
                                            {(report.likes || 0) > 0 && (
                                                <span className="flex items-center gap-1 text-humanea-rose bg-humanea-rose/10 px-2 py-0.5 rounded-full font-medium">
                                                    👍 {report.likes}
                                                </span>
                                            )}
                                        </div>
                                        {editingReportId !== report.id && (
                                            <button
                                                onClick={() => handleEditReport(report)}
                                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    {editingReportId === report.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={editedContent}
                                                onChange={(e) => setEditedContent(e.target.value)}
                                                className="w-full p-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-humanea-bordeaux/20 focus:border-humanea-bordeaux outline-none"
                                                rows={4}
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 transition-colors"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    Annuler
                                                </button>
                                                <button
                                                    onClick={() => handleSaveEdit(report.id)}
                                                    className="px-3 py-1.5 text-sm bg-humanea-bordeaux text-white hover:bg-humanea-light rounded-lg flex items-center gap-1 transition-colors"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                    Enregistrer
                                                </button>
                                            </div>
                                        </div>
                                    ) : report.image_url ? (
                                        <div className="flex gap-4">
                                            <img
                                                src={report.image_url}
                                                alt="Nouvelle"
                                                className="w-40 h-40 object-cover rounded-lg shadow-sm bg-gray-50 flex-shrink-0"
                                                loading="lazy"
                                            />
                                            <p className="text-gray-700 text-sm whitespace-pre-wrap flex-1">{report.content}</p>
                                        </div>
                                    ) : (
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{report.content}</p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-400 text-sm py-4">Aucune nouvelle pour le moment.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

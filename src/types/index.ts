export type Role = 'caregiver';

export interface Profile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: Role;
}

export type Species = 'Chien' | 'Chat';

export interface Animal {
    id: string;
    name: string;
    last_name?: string;
    species: string;
    owner_email: string;
    is_hospitalized: boolean;
    admission_date: string;
    assigned_caregiver_id?: string;
    assigned_caregiver?: {
        first_name: string;
        last_name: string;
    };
    created_at: string;
}

export interface DailyReport {
    id: string;
    content: string;
    animal_id: string;
    caregiver_id: string;
    created_at: string;
    image_url?: string | null;
    likes?: number;
}

export interface OwnerConnection {
    id: string;
    owner_email: string;
    animal_id: string;
    last_connection: string;
}

# Humanea - Application Vétérinaire

Application web pour la clinique vétérinaire Humanea, permettant aux soignants de donner des nouvelles des animaux hospitalisés et aux propriétaires de les consulter.

## Stack Technique

- **Frontend :** React, TypeScript, Tailwind CSS, Lucide Icons, Vite.
- **Backend :** Supabase (Auth, Database, RLS).

## Installation

1.  Cloner le projet.
2.  Installer les dépendances :
    ```bash
    npm install
    ```
3.  Créer un projet Supabase.
4.  Exécuter le script SQL fourni dans `supabase_schema.sql` dans l'éditeur SQL de Supabase pour créer les tables et les politiques de sécurité.
5.  Copier `.env.example` vers `.env.local` et remplir les variables :
    ```
    VITE_SUPABASE_URL=votre_url_supabase
    VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
    ```
6.  Lancer le serveur de développement :
    ```bash
    npm run dev
    ```

## Fonctionnalités

- **Soignants :**
    - Inscription (email @humanea-veterinaire.fr requis).
    - Connexion.
    - Tableau de bord : Liste des animaux, ajout d'animal.
    - Détails animal : Historique, ajout de nouvelles (rapports), changement de statut (hospitalisé/sorti).
- **Propriétaires :**
    - Accès via email sur la page d'accueil.
    - Consultation des animaux liés à leur email.
    - Visualisation des nouvelles.

## Structure de la Base de Données

Voir `supabase_schema.sql` pour les détails.

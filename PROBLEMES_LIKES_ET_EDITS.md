# Problèmes de Likes et Modifications de Rapports

## Problèmes identifiés

### 1. Les likes ne persistent pas
**Symptôme** : Le propriétaire peut reliker la même nouvelle. Le pouce n'est plus coloré quand il revient sur la page.

**Cause** : 
- La table `report_likes` et les fonctions RPC n'existent probablement pas encore dans la base de données Supabase
- Le code frontend est déjà prêt mais attend que la migration soit exécutée

### 2. Les modifications de rapports ne s'enregistrent pas
**Symptôme** : Les modifications faites depuis l'espace soignant ne sont pas visibles ni dans l'espace propriétaire ni après rafraîchissement de la page soignant.

**Cause** :
- Manque de permissions RLS (Row Level Security) pour UPDATE sur la table `daily_reports`
- La policy pour permettre aux soignants de modifier les rapports n'existe pas encore

## Solution

### Étape 1 : Exécuter la migration SQL dans Supabase

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez le contenu du fichier `migration_fix_likes_and_edits.sql`
4. Collez-le dans l'éditeur SQL
5. Exécutez la migration

> ⚠️ **Important** : Avant d'exécuter, vérifiez si certaines tables/fonctions existent déjà pour éviter les erreurs.

### Étape 2 : Vérifier que tout fonctionne

#### Test des likes :
1. Depuis l'espace propriétaire, cliquez sur le pouce d'une nouvelle
2. Rafraîchissez la page
3. Le pouce doit rester coloré
4. Depuis l'espace soignant, vérifiez que le compteur de likes a augmenté

#### Test des modifications :
1. Depuis l'espace soignant, éditez une nouvelle
2. Sauvegardez la modification
3. Rafraîchissez la page soignant - la modification doit être visible
4. Consultez l'espace propriétaire - la modification doit être visible

### Étape 3 : Amélioration du code frontend (optionnelle)

Il y a un petit bug potentiel dans la fonction `fetchReports` de `OwnerDashboard.tsx` : quand les rapports sont rechargés via real-time, les likes ne sont pas rechargés.

## Détails techniques

### Table `report_likes`
```sql
CREATE TABLE report_likes (
    id UUID PRIMARY KEY,
    report_id UUID REFERENCES daily_reports(id),
    owner_email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_id, owner_email)  -- Un propriétaire = 1 seul like par rapport
);
```

### Fonction `toggle_report_like`
Cette fonction :
- Vérifie si le like existe déjà
- Si oui : supprime le like et décrémente le compteur
- Si non : ajoute le like et incrémente le compteur
- Retourne l'état actuel (liked: true/false) et le nombre total de likes

### Policy UPDATE pour daily_reports
```sql
CREATE POLICY "Caregivers can update reports" ON daily_reports
    FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'caregiver')
    );
```

Cette policy permet à tous les utilisateurs avec le rôle 'caregiver' de modifier les rapports.

## Vérification post-migration

Dans Supabase, vérifiez que :

1. **Table `report_likes` existe**
   - Allez dans "Table Editor"
   - Cherchez la table `report_likes`

2. **Les fonctions RPC existent**
   - Allez dans "Database" > "Functions"
   - Vérifiez `toggle_report_like` et `has_user_liked_report`

3. **Les policies RLS sont actives**
   - Allez dans "Authentication" > "Policies"
   - Vérifiez la table `daily_reports` : policy "Caregivers can update reports"
   - Vérifiez la table `report_likes` : policies pour SELECT, INSERT, DELETE

## Notes supplémentaires

- Le système de likes est maintenant stocké en base de données, pas en local
- Chaque like est unique par combinaison (report_id, owner_email)
- Le compteur dans `daily_reports.likes` est maintenu à jour automatiquement
- Les soignants peuvent modifier leurs rapports même après publication

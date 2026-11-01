# Matinal — guide simple

Matinal (nom provisoire) prépare chaque matin un journal personnalisé, à lire ou à écouter.
Tout fonctionne sur le téléphone, gratuitement : aucune clé, aucun abonnement, aucun compte.

## 1. Récupérer l'APK (le fichier d'installation)

1. Va sur la page **Releases** du dépôt GitHub (lien « Releases » à droite de la page du dépôt).
2. Ouvre la version la plus récente (par exemple `v0.1.0-test3`).
3. Dans « Assets », touche le fichier **Matinal-….apk** pour le télécharger.

Chaque modification du code fabrique automatiquement une nouvelle version (onglet **Actions** du dépôt).

## 2. Envoyer l'APK à tes amis

Envoie le fichier `.apk` par **WhatsApp** (en « Document »), par **Google Drive** ou par mail.
Donne-leur aussi le **code d'invitation** : `MATINAL-AMIS` (ou `BONJOUR2026`).

## 3. Installer sur un téléphone Android

1. Ouvre le fichier `.apk` reçu (dans WhatsApp, Drive ou « Téléchargements »).
2. Android affiche « Pour votre sécurité, l'installation d'applications inconnues est bloquée » :
   touche **Paramètres** puis active **Autoriser cette source**, et reviens en arrière.
3. Touche **Installer**. Si Google Play Protect affiche un avertissement
   (« application inconnue »), touche **Plus de détails** puis **Installer quand même**.
4. Ouvre **Matinal**, entre le code d'invitation et réponds aux questions.

Pour une mise à jour : installe simplement le nouvel APK par-dessus, les réglages sont conservés.

## 4. Conseils

- **Notification du matin** : l'autorisation est demandée seulement si tu l'actives.
- **Voix** : Matinal utilise la voix du téléphone. Pour une voix plus naturelle :
  Paramètres Android › Accessibilité › Synthèse vocale › Moteur de Google ›
  Installer les données vocales › Français.
- **Samsung / Xiaomi** : si la notification n'arrive pas, exclue Matinal de
  l'optimisation de la batterie (Paramètres › Applications › Matinal › Batterie › Non restreinte).

## 5. Changer le nom ou les codes

- Nom : `src/config.ts` (`APP_NAME`) et `app.json` (`"name"`).
- Codes d'invitation : `src/config.ts` (`INVITE_CODES`).

## Sources utilisées (gratuites, sans compte)

Open-Meteo (météo, air, pollens, marées), flux RSS de journaux variés (franceinfo, Le Monde,
Le Figaro, Libération, 20 Minutes, Ouest-France, La Croix, BFMTV, France 24, RFI, Courrier international),
Google Actualités (sujets libres, sorties), AlloCiné, L'Équipe, CoinGecko, Yahoo Finance, Deezer,
TheSportsDB, Wikipédia, Nominis, prix-carburants.gouv.fr, POSITIVR.
Ces sources sont utilisées pour un usage personnel et non commercial. Avant un lancement payant,
il faudra passer la météo sur MET Norway et vérifier les conditions de chaque flux.

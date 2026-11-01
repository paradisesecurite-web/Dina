# Matinal — guide simple

Matinal (nom provisoire) prépare chaque matin un journal personnalisé, à lire ou à écouter,
raconté par l'IA Claude avec une voix naturelle. On peut l'interrompre pour poser une question à voix haute.

## Comment ça marche

- Le téléphone récupère les infos du jour dans des sources publiques gratuites.
- Le petit serveur Matinal (Cloudflare, gratuit) les envoie à l'IA Claude, qui rédige le journal,
  puis fabrique la voix avec OpenAI. Les clés API restent sur ce serveur, jamais dans l'application.
- Trois formules au choix dans l'application : Gratuite (sans IA), Standard (Claude Haiku, 10 min de voix IA/jour),
  Premium (Claude Sonnet, 15 min de voix IA/jour). Les plafonds se changent dans `server/src/tiers.ts`.
- Pendant le test, c'est toi qui paies l'IA : surveille tes plafonds sur console.anthropic.com et platform.openai.com.

## Coûts estimés (par ami, par mois, journal de 10 min par jour)

- Premium : environ 2 € d'IA Claude + 4,5 € de voix ≈ 7 €.
- Standard : environ 0,20 € d'IA + 4,5 € de voix ≈ 5 €.
- Gratuite : 0 €.

## Clés et serveur

Les 4 secrets GitHub (Settings › Secrets and variables › Actions) : `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`,
`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. À chaque modification du dossier `server/`, le serveur est
remis en ligne et testé automatiquement (onglet Actions). Ta clé Anthropic actuelle expire le 1er décembre 2026 :
crée-en une nouvelle et remplace le secret `ANTHROPIC_API_KEY`, puis relance « Mettre le serveur en ligne ».

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
- **Questions à voix haute** : touche le micro et parle (« explique-moi ce sujet », « suivant », « pause », « reprends »).
  Le micro n'est demandé qu'à la première question.
- **Voix de secours** : quand la voix IA du jour est épuisée, c'est la voix du téléphone. Pour qu'elle soit plus naturelle :
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

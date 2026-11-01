// Réglages généraux de l'application. Pour renommer l'application,
// change APP_NAME ici et "name" dans app.json.
export const APP_NAME = 'Matinal';
export const APP_VERSION = '0.2.0';

// Codes d'invitation acceptés (sans tenir compte des majuscules).
// Ajoute ou retire des codes ici, puis refabrique l'APK.
export const INVITE_CODES = ['MATINAL-AMIS', 'BONJOUR2026'];

// Identification polie auprès des sources gratuites (certaines l'exigent).
export const USER_AGENT = `${APP_NAME}/${APP_VERSION} (application de test non commerciale)`;

// Adresse du petit serveur (Cloudflare) qui rédige le journal avec l'IA et fabrique la voix.
export const API_URL = 'https://matinal-api.matinal-de5dc7.workers.dev';

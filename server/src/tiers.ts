// Formules proposées dans l'application. Les plafonds protègent ton budget :
// au-delà, l'application repasse sur la voix gratuite du téléphone.
export type TierId = 'gratuit' | 'standard' | 'premium';

export const TIERS: Record<TierId, {
  label: string; price: string; model: string | null;
  aiVoiceMinutesPerDay: number; questionsPerDay: number; journalsPerDay: number; maxMinutes: number;
}> = {
  gratuit: { label: 'Gratuite', price: '0 €', model: null, aiVoiceMinutesPerDay: 0, questionsPerDay: 0, journalsPerDay: 0, maxMinutes: 60 },
  standard: { label: 'Standard', price: '≈ 5 € / mois', model: 'claude-haiku-5-5', aiVoiceMinutesPerDay: 10, questionsPerDay: 5, journalsPerDay: 3, maxMinutes: 60 },
  premium: { label: 'Premium', price: '≈ 10 € / mois', model: 'claude-sonnet-5-5', aiVoiceMinutesPerDay: 15, questionsPerDay: 15, journalsPerDay: 4, maxMinutes: 60 },
};

// Environ 900 caractères lus par minute en français.
export const CHARS_PER_MINUTE = 900;

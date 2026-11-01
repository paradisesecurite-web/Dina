import React, { useState } from 'react';
import { View } from 'react-native';
import { APP_NAME, INVITE_CODES } from '../config';
import { Btn, Field, Gap, Txt } from '../ui/kit';
import { Screen } from '../ui/Screen';

export function Invite({ onOk }: { onOk: () => void }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const check = () => {
    if (INVITE_CODES.map(c => c.toUpperCase()).includes(code.trim().toUpperCase())) onOk();
    else setErr('Ce code n\'est pas reconnu. Demande-le à la personne qui t\'a envoyé l\'application.');
  };
  return (
    <Screen>
      <View style={{ minHeight: 560, justifyContent: 'center' }}>
        <Txt v="label" center>Version de test</Txt>
        <Gap h={8} />
        <Txt v="title" center>☀️ {APP_NAME}</Txt>
        <Gap h={6} />
        <Txt center>Ton journal du matin, rien que pour toi.</Txt>
        <Gap h={36} />
        <Txt v="h3">Code d'invitation</Txt>
        <Gap h={8} />
        <Field value={code} onChangeText={t => { setCode(t); setErr(''); }} placeholder="Ex. : BONJOUR2026" autoCapitalize="characters" autoCorrect={false} onSubmitEditing={check} returnKeyType="done" accessibilityLabel="Code d'invitation" />
        {err ? <Txt v="small" style={{ marginTop: 8 }}>{err}</Txt> : null}
        <Gap h={16} />
        <Btn label="Entrer" onPress={check} disabled={!code.trim()} />
        <Gap h={24} />
        <Txt v="small" center>Gratuit, sans compte et sans publicité. Tout reste sur ton téléphone.</Txt>
      </View>
    </Screen>
  );
}

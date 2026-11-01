#!/bin/bash
# Test sur un téléphone Android virtuel : installe l'APK et parcourt l'application.
APK="$1"; OUT=screens; mkdir -p $OUT
PKG=fr.paradise.matinal
FAILS=0
shot() { adb exec-out screencap -p > "$OUT/$1.png"; echo "📸 $1"; }
ui() { adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb pull /sdcard/ui.xml ui.xml >/dev/null 2>&1; }
fail() { FAILS=$((FAILS+1)); echo "❌ $1"; cp ui.xml "$OUT/echec-$FAILS.xml" 2>/dev/null; adb exec-out screencap -p > "$OUT/echec-$FAILS.png"; }
# attend qu'un texte apparaisse (jusqu'à N secondes)
wait_for() { for i in $(seq 1 ${2:-15}); do ui; python3 scripts/find.py ui.xml "$1" >/dev/null && { echo "✔ visible : $1"; return 0; }; sleep 1; done; fail "jamais apparu : $1"; return 1; }
tap() { for i in 1 2 3; do ui; c=$(python3 scripts/find.py ui.xml "$1") && { adb shell input tap $c; echo "👉 $1"; sleep ${2:-2}; return 0; }; sleep 1; done; fail "introuvable : $1"; return 1; }
typ() { tap "$1" 1 && adb shell input text "$2" && sleep ${3:-2}; adb shell input keyevent 111 >/dev/null 2>&1; sleep 1; }
swipe_up() { adb shell input swipe 160 520 160 140 500; sleep 1.5; }
swipe_down() { adb shell input swipe 160 140 160 560 300; sleep 1; }

adb install -r "$APK" || exit 1
adb logcat -c
adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null
wait_for "Code d'invitation" 60; shot 01-ouverture
typ "Ex. : BONJOUR2026" "MATINAL-AMIS"
tap "Entrer"; wait_for "Bonjour*"; shot 02-bienvenue
tap "Commencer"; wait_for "Comment tu t'appelles ?"
typ "Ton prénom" "Yohann"
tap "Continuer"; wait_for "Qu'attends-tu de ton journal ?"
tap "Être informé vite" 1; tap "Me cultiver" 1; shot 03-attentes
tap "Continuer"; wait_for "Ton rythme le matin ?"
tap "Continuer"; wait_for "Qu'est-ce qui t'intéresse ?"
tap "Actualité" 1; tap "Sport" 1; tap "Bourse & cryptos" 1; shot 04-interets
tap "Continuer"; wait_for "Où habites-tu ?"
typ "Tape le nom de ta ville" "Lyon" 1
wait_for "Auvergne-Rhône-Alpes*" 20; shot 05-ville
tap "Auvergne-Rhône-Alpes*" 2
tap "Continuer"; wait_for "Ma proposition*"; shot 06-proposition
tap "Futuriste" 2; shot 07-proposition-futuriste
tap "Professionnel" 2
tap "C'est parti !"; wait_for "Météo" 40; sleep 5; shot 08-journal
swipe_up; shot 09-journal-suite
swipe_up; swipe_up; shot 10-journal-bas
swipe_down; swipe_down; swipe_down; swipe_down
tap "Écouter*" 8; shot 11-ecoute
tap "Pause" 2
tap "Réglages" 3; wait_for "Apparence"; shot 12-reglages
tap "Nature / zen" 2; tap "Appliquer les réglages assortis à ce thème" 1
adb shell input keyevent 4; wait_for "Belle matinée*" 30; sleep 5; shot 13-journal-zen
echo "===== Erreurs dans le journal Android ====="
adb logcat -d | grep -E "FATAL EXCEPTION|ReactNativeJS.*(rror|ERROR)|E TextToSpeech|E TTS" | head -40
echo "===== Fin ====="
echo "Étapes en échec : $FAILS"
adb shell pidof $PKG >/dev/null && echo "✅ L'application tourne toujours" || echo "❌ L'application s'est arrêtée"

#!/bin/bash
# Test sur un téléphone Android virtuel : installe l'APK et parcourt l'application (vraies infos, vraie IA).
APK="$1"; OUT=screens; mkdir -p $OUT
PKG=fr.paradise.matinal
FAILS=0
shot() { adb exec-out screencap -p > "$OUT/$1.png"; echo "📸 $1"; }
ui() { adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb pull /sdcard/ui.xml ui.xml >/dev/null 2>&1; }
fail() { FAILS=$((FAILS+1)); echo "❌ $1"; cp ui.xml "$OUT/echec-$FAILS.xml" 2>/dev/null; adb exec-out screencap -p > "$OUT/echec-$FAILS.png"; }
swipe_up() { adb shell input swipe 160 480 160 200 500; sleep 1.2; }
swipe_down() { adb shell input swipe 160 200 160 520 300; sleep 0.8; }
wait_for() { for i in $(seq 1 ${2:-15}); do ui; python3 scripts/find.py ui.xml "$1" >/dev/null && { echo "✔ visible : $1"; return 0; }; sleep 1; done; fail "jamais apparu : $1"; return 1; }
# Touche un élément ; s'il n'est pas visible, fait défiler l'écran (jusqu'à 6 fois).
tap() { for i in 1 2 3 4 5 6 7; do ui; c=$(python3 scripts/find.py ui.xml "$1") && { adb shell input tap $c; echo "👉 $1"; sleep ${2:-2}; return 0; }; [ $i -ge 2 ] && swipe_up || sleep 1; done; fail "introuvable : $1"; return 1; }
typ() { tap "$1" 1 && adb shell input text "$2" && sleep ${3:-2}; adb shell input keyevent 111 >/dev/null 2>&1; sleep 1; }
allow() { for t in "Autoriser*" "Allow*" "While using the app" "Only this time" "Lorsque l'appli*"; do ui; c=$(python3 scripts/find.py ui.xml "$t") && { adb shell input tap $c; echo "🔓 autorisation"; sleep 1.5; return 0; }; done; return 0; }

adb install -r "$APK" || exit 1
adb logcat -c
adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null
wait_for "Code d'invitation" 60; shot 01-ouverture
typ "Ex. : BONJOUR2026" "MATINAL-AMIS"
tap "Entrer"; wait_for "Ton journal du matin, sur mesure."; shot 02-bienvenue
tap "Commencer"; wait_for "Comment tu t'appelles ?"
typ "Ton prénom" "Yohann"
tap "Continuer"; wait_for "Qu'attends-tu de ton journal ?"
tap "Être informé vite" 1; shot 03-attentes
tap "Continuer"; wait_for "Quelle durée pour ton journal ?"; shot 04-duree
tap "Continuer"; wait_for "Qu'est-ce qui t'intéresse ?"
tap "Actualité France" 1; tap "Monde & géopolitique" 1; tap "Immobilier" 1; shot 05-interets
tap "Continuer"; wait_for "Où habites-tu ?"
typ "Tape le nom de ta ville" "Lyon" 1
wait_for "Auvergne-Rhône-Alpes*" 20; tap "Auvergne-Rhône-Alpes*" 2; shot 06-ville
tap "Continuer"; wait_for "Quel ton te plaît ?"; shot 07-ton
tap "Continuer"; wait_for "Choisis ta formule"; shot 08-formule
tap "Continuer"; wait_for "Ma proposition"; shot 09-proposition
tap "C'est parti !" 5
wait_for "Raconté par l'IA*" 150 || wait_for "Version simple*" 5; sleep 3; shot 10-journal
swipe_up; shot 11-journal-suite; swipe_up; swipe_up; shot 12-journal-bas
for i in 1 2 3 4 5 6 7 8; do swipe_down; done
tap "Écouter" 18; shot 13-ecoute-voix-ia
adb logcat -d | grep -iE "ExpoAudio|AudioPlayer|ExoPlayer|MediaCodec.*error" | tail -15
tap "Pause" 2
tap "Question" 3; allow; sleep 4; shot 14-question
tap "Écrire plutôt" 2 || true
typ "Ex. : explique-moi*" "Explique moi le premier sujet de France" 1
tap "Envoyer" 2; wait_for "Réponse" 60; sleep 3; shot 15-reponse
tap "Reprendre" 4; tap "Pause" 2
tap "Réglages" 3; wait_for "Apparence" 10; shot 16-reglages
echo "===== Erreurs dans le journal Android ====="
adb logcat -d | grep -E "FATAL EXCEPTION|ReactNativeJS.*(rror|ERROR)" | head -40
echo "===== Fin ====="
echo "Étapes en échec : $FAILS"
adb shell pidof $PKG >/dev/null && echo "✅ L'application tourne toujours" || echo "❌ L'application s'est arrêtée"

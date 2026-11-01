#!/bin/bash
# Test sur un téléphone Android virtuel : installe l'APK et parcourt l'application.
APK="$1"; OUT=screens; mkdir -p $OUT
PKG=fr.paradise.matinal
shot() { adb exec-out screencap -p > "$OUT/$1.png"; echo "📸 $1"; }
ui() { adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb pull /sdcard/ui.xml ui.xml >/dev/null 2>&1; }
FAILS=0
tap() { ui; c=$(python3 scripts/find.py ui.xml "$1") || { echo "❌ introuvable : $1"; FAILS=$((FAILS+1)); cp ui.xml "$OUT/echec-$FAILS.xml"; adb exec-out screencap -p > "$OUT/echec-$FAILS.png"; return 1; }; adb shell input tap $c; echo "👉 $1"; sleep ${2:-2}; }
typ() { tap "$1" 1 && adb shell input text "$2" && sleep ${3:-2}; adb shell input keyevent 111 >/dev/null 2>&1; }
swipe() { adb shell input swipe 540 1700 540 600 400; sleep 1.5; }

adb install -r "$APK" || exit 1
adb logcat -c
adb shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null
sleep 30; shot 01-ouverture
typ "Code d'invitation" "MATINAL-AMIS"
tap "Entrer" 3; shot 02-bienvenue
tap "Commencer"
typ "Prénom" "Yohann"
tap "Continuer"
tap "Être informé vite"; tap "Me cultiver"; tap "Continuer"
tap "Continuer"
tap "Actualité" 1; tap "Sport" 1; tap "Bourse & cryptos" 1; tap "Horoscope" 1; shot 03-interets
tap "Continuer"
typ "Ville" "Lyon" 6; shot 04-ville
tap "Auvergne-Rhône-Alpes, France" 2 || tap "Lyon" 2
tap "Continuer" 3; shot 05-proposition
tap "Futuriste*" 2; shot 06-proposition-futuriste
tap "Professionnel*" 2
tap "C'est parti !" 25; shot 07-journal
swipe; shot 08-journal-suite
swipe; swipe; shot 09-journal-bas
adb shell input swipe 540 600 540 2000 300; adb shell input swipe 540 600 540 2000 300; sleep 1
tap "Écouter*" 6; shot 10-ecoute
tap "Pause" 2
tap "Réglages" 3; shot 11-reglages
tap "Nature / zen*" 2; tap "Appliquer les réglages assortis à ce thème" 1
adb shell input keyevent 4; sleep 20; shot 12-journal-zen
echo "===== Erreurs dans le journal Android ====="
adb logcat -d | grep -E "FATAL EXCEPTION|AndroidRuntime|ReactNativeJS.*(rror|ERROR|Warning)|TextToSpeech" | head -60
echo "===== Fin ====="; echo "Étapes introuvables : $FAILS"
adb shell pidof $PKG >/dev/null && echo "✅ L'application tourne toujours" || echo "❌ L'application s'est arrêtée"

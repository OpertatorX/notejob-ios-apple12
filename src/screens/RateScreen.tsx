import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RatingScale } from '../components/RatingScale';
import { Company, RatingDraft } from '../types';
import { Language, Translations } from '../i18n/strings';
import { acceptUgcTerms, getOwnRating, getUgcTermsStatus, submitRating, UGC_TERMS_VERSION } from '../lib/ratings';
import { showInterstitialIfReady } from '../lib/ads';

const criteria = ['management', 'compensation', 'culture', 'balance', 'career'] as const;
const EMPTY_DRAFT: RatingDraft = {
  management: 0,
  compensation: 0,
  culture: 0,
  balance: 0,
  career: 0,
  recommend: null,
  employmentStatus: null,
  jobTitle: '',
};

export function RateScreen({ company, t, language, onClose, onDone }: {
  company: Company;
  t: Translations;
  language: Language;
  onClose: () => void;
  onDone: () => void;
}) {
  const fr = language === 'fr';
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [done, setDone] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RatingDraft>(EMPTY_DRAFT);
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const existing = await getOwnRating(company);
        if (active && existing) {
          setDraft(existing);
          setEditing(true);
        }
      } catch {
        // Keep a fresh draft if reading the previous rating fails.
      } finally {
        if (active) setLoadingExisting(false);
      }
    })();
    return () => { active = false; };
  }, [company]);

  const labelMap = useMemo(() => ({
    management: t.managementQuestion,
    compensation: t.compensationQuestion,
    culture: t.cultureQuestion,
    balance: t.balanceQuestion,
    career: t.careerQuestion,
  }), [t]);

  const canNext = step < 5
    ? draft[criteria[step]!] > 0
    : step === 5
      ? draft.recommend !== null
      : draft.employmentStatus !== null;

  const saveRating = async () => {
    await submitRating(company, draft);
    setDone(true);
    await showInterstitialIfReady();
  };

  const requestPublish = async () => {
    setSaving(true);
    try {
      const status = await getUgcTermsStatus();
      if (status.banned) {
        Alert.alert(
          fr ? 'Publication désactivée' : 'Publishing disabled',
          fr
            ? 'Cet identifiant anonyme a été exclu de la publication. Contact : contact.operatorx@proton.me'
            : 'This anonymous identifier has been blocked from publishing. Contact: contact.operatorx@proton.me',
        );
        return;
      }
      if (status.version !== UGC_TERMS_VERSION || !status.acceptedAt) {
        setTermsOpen(true);
        return;
      }
      await saveRating();
    } catch (error: any) {
      if (String(error?.message || '').includes('OBJECTIONABLE_CONTENT')) {
        Alert.alert(
          fr ? 'Contenu refusé' : 'Content rejected',
          fr ? 'Le contenu saisi ne respecte pas les règles de la communauté.' : 'The submitted content does not comply with the community rules.',
        );
      } else {
        Alert.alert(t.ratingFailed);
      }
    } finally {
      setSaving(false);
    }
  };

  const acceptAndPublish = async () => {
    setSaving(true);
    try {
      await acceptUgcTerms();
      setTermsOpen(false);
      await saveRating();
    } catch (error: any) {
      if (String(error?.message || '').includes('OBJECTIONABLE_CONTENT')) {
        Alert.alert(
          fr ? 'Contenu refusé' : 'Content rejected',
          fr ? 'Le contenu saisi ne respecte pas les règles de la communauté.' : 'The submitted content does not comply with the community rules.',
        );
      } else {
        Alert.alert(t.ratingFailed);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loadingExisting) return <View style={styles.loader}><ActivityIndicator color="#174C3D" /></View>;

  if (done) {
    return (
      <SafeAreaView style={styles.doneWrap}>
        <View style={styles.doneCenter}>
          <View style={styles.doneMark}><Text style={styles.doneCheck}>✓</Text></View>
          <Text style={styles.doneTitle}>{editing ? t.updatedThanks : t.thanks}</Text>
          <Text style={styles.doneSub}>{t.anonymous}</Text>
          <TouchableOpacity style={styles.doneButton} onPress={onDone}><Text style={styles.doneButtonText}>{t.backToCompany}</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const criterionLabel = step < 5
    ? (criteria[step] === 'management' ? t.management : criteria[step] === 'compensation' ? t.compensation : criteria[step] === 'culture' ? t.culture : criteria[step] === 'balance' ? t.balance : t.career)
    : '';

  return (
    <>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.top}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.62}><Text style={styles.close}>‹</Text></TouchableOpacity>
              <Text style={styles.progress}>{step + 1} / 7</Text>
            </View>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((step + 1) / 7) * 100}%` }]} /></View>

            <Text style={styles.company}>{company.name} · {company.city}</Text>
            {editing && <Text style={styles.editing}>{t.updateRating}</Text>}

            {step < 5 && (
              <>
                <Text style={styles.stepKicker}>{criterionLabel.toUpperCase()}</Text>
                <Text style={styles.question}>{labelMap[criteria[step]!]}</Text>
                <RatingScale value={draft[criteria[step]!]} onChange={(v) => setDraft({ ...draft, [criteria[step]!]: v })} />
              </>
            )}

            {step === 5 && (
              <>
                <Text style={styles.stepKicker}>{t.recommendation.toUpperCase()}</Text>
                <Text style={styles.question}>{t.wouldRecommend}</Text>
                <View style={styles.binary}>
                  <TouchableOpacity onPress={() => setDraft({ ...draft, recommend: true })} style={[styles.binaryButton, draft.recommend === true && styles.binaryActive]}>
                    <Text style={[styles.binaryText, draft.recommend === true && styles.binaryTextActive]}>{t.yes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setDraft({ ...draft, recommend: false })} style={[styles.binaryButton, draft.recommend === false && styles.binaryActive]}>
                    <Text style={[styles.binaryText, draft.recommend === false && styles.binaryTextActive]}>{t.no}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 6 && (
              <>
                <Text style={styles.stepKicker}>{t.yourExperience.toUpperCase()}</Text>
                <Text style={styles.question}>{t.yourExperience}</Text>
                <View style={styles.binary}>
                  <TouchableOpacity onPress={() => setDraft({ ...draft, employmentStatus: 'current' })} style={[styles.binaryButton, draft.employmentStatus === 'current' && styles.binaryActive]}>
                    <Text style={[styles.binaryText, draft.employmentStatus === 'current' && styles.binaryTextActive]}>{t.current}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setDraft({ ...draft, employmentStatus: 'former' })} style={[styles.binaryButton, draft.employmentStatus === 'former' && styles.binaryActive]}>
                    <Text style={[styles.binaryText, draft.employmentStatus === 'former' && styles.binaryTextActive]}>{t.former}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.fieldLabel}>{t.role}</Text>
                <TextInput
                  value={draft.jobTitle}
                  onChangeText={(jobTitle) => setDraft({ ...draft, jobTitle })}
                  placeholder={t.rolePlaceholder}
                  placeholderTextColor="#8C877F"
                  style={styles.roleInput}
                  maxLength={80}
                />
              </>
            )}

            <View style={styles.spacer} />
            {step < 6 ? (
              <TouchableOpacity disabled={!canNext} onPress={() => setStep(step + 1)} style={[styles.cta, !canNext && styles.ctaDisabled]}>
                <Text style={styles.ctaText}>{t.next}</Text><Text style={styles.ctaArrow}>→</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity disabled={!canNext || saving} onPress={() => void requestPublish()} style={[styles.cta, (!canNext || saving) && styles.ctaDisabled]}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.ctaText}>{editing ? t.saveChanges : t.publish}</Text><Text style={styles.ctaArrow}>→</Text></>}
              </TouchableOpacity>
            )}
            <Text style={styles.anonymous}>{t.anonymous}</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={termsOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setTermsOpen(false)}>
        <SafeAreaView style={styles.termsSafe}>
          <ScrollView contentContainerStyle={styles.termsContent}>
            <Text style={styles.termsKicker}>{fr ? 'AVANT DE PUBLIER' : 'BEFORE PUBLISHING'}</Text>
            <Text style={styles.termsTitle}>{fr ? 'Règles de la communauté' : 'Community rules'}</Text>
            <View style={styles.termsRule} />
            <Text style={styles.termsLead}>{fr ? 'NoteJob est réservé aux personnes de 18 ans et plus. En publiant, vous acceptez les Conditions d’utilisation.' : 'NoteJob is for people aged 18 and over. By publishing, you accept the Terms of Use.'}</Text>
            <Text style={styles.termsHeading}>{fr ? 'Tolérance zéro' : 'Zero tolerance'}</Text>
            <Text style={styles.termsBody}>{fr ? 'Le harcèlement, la haine, les menaces, le contenu sexuel explicite, la divulgation d’informations personnelles, le spam, la fraude et les comportements abusifs sont interdits.' : 'Harassment, hate, threats, explicit sexual content, disclosure of personal information, spam, fraud and abusive behavior are prohibited.'}</Text>
            <Text style={styles.termsHeading}>{fr ? 'Filtrage et modération' : 'Filtering and moderation'}</Text>
            <Text style={styles.termsBody}>{fr ? 'Le contenu est filtré avant publication. Les avis peuvent être signalés, masqués ou leurs auteurs bloqués. Les signalements abusifs sont examinés sous 24 heures et peuvent entraîner le retrait du contenu et l’exclusion de son auteur.' : 'Content is filtered before publication. Ratings can be reported, hidden, and their authors blocked. Abuse reports are reviewed within 24 hours and may result in content removal and user removal.'}</Text>
            <Text style={styles.termsHeading}>{fr ? 'Contact' : 'Contact'}</Text>
            <Text style={styles.termsBody}>contact.operatorx@proton.me</Text>
            <TouchableOpacity disabled={saving} onPress={() => void acceptAndPublish()} style={[styles.termsAccept, saving && styles.ctaDisabled]}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.termsAcceptText}>{fr ? 'J’accepte et je publie' : 'I accept and publish'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity disabled={saving} onPress={() => setTermsOpen(false)} style={styles.termsCancel}><Text style={styles.termsCancelText}>{fr ? 'Annuler' : 'Cancel'}</Text></TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F3EC' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F3EC' },
  screen: { flex: 1, backgroundColor: '#F7F3EC' },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeButton: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  close: { marginTop: -5, fontSize: 37, fontWeight: '300', color: '#173C32' },
  progress: { fontSize: 12, fontWeight: '800', letterSpacing: 0.7, color: '#5E6863' },
  progressTrack: { marginTop: 13, height: 3, borderRadius: 2, backgroundColor: '#DED8CE', overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: '#174C3D' },
  company: { marginTop: 31, fontSize: 11.5, fontWeight: '800', letterSpacing: 0.9, textTransform: 'uppercase', color: '#174C3D' },
  editing: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#77736C' },
  stepKicker: { marginTop: 26, fontSize: 10, fontWeight: '900', letterSpacing: 1.15, color: '#6A706B' },
  question: { marginTop: 10, marginBottom: 28, fontSize: 34, lineHeight: 39, letterSpacing: -1.2, fontWeight: '800', color: '#17261F' },
  binary: { marginTop: 1, flexDirection: 'row', gap: 10 },
  binaryButton: { flex: 1, height: 54, borderRadius: 14, backgroundColor: '#E9E3D9', justifyContent: 'center', alignItems: 'center' },
  binaryActive: { backgroundColor: '#174C3D' },
  binaryText: { color: '#33423B', fontSize: 15, fontWeight: '800' },
  binaryTextActive: { color: '#FFFFFF' },
  fieldLabel: { marginTop: 31, fontSize: 10, fontWeight: '900', letterSpacing: 1.05, textTransform: 'uppercase', color: '#5F645F' },
  roleInput: { marginTop: 8, height: 54, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#CFC9BF', paddingHorizontal: 0, fontSize: 16.5, color: '#17261F' },
  spacer: { flex: 1, minHeight: 34 },
  cta: { marginTop: 30, minHeight: 54, borderRadius: 14, backgroundColor: '#174C3D', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#11352B', shadowOpacity: 0.08, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  ctaDisabled: { opacity: 0.34 },
  ctaText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '800' },
  ctaArrow: { color: '#FFFFFF', fontSize: 21 },
  anonymous: { marginTop: 13, textAlign: 'center', fontSize: 11.5, lineHeight: 16, color: '#858078' },
  doneWrap: { flex: 1, backgroundColor: '#F7F3EC' },
  doneCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 50 },
  doneMark: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#DCE7DE', alignItems: 'center', justifyContent: 'center' },
  doneCheck: { fontSize: 31, color: '#174C3D', fontWeight: '600' },
  doneTitle: { marginTop: 25, textAlign: 'center', fontSize: 34, lineHeight: 39, letterSpacing: -1.2, fontWeight: '800', color: '#173C32' },
  doneSub: { marginTop: 13, textAlign: 'center', fontSize: 14.5, lineHeight: 21, color: '#686860' },
  doneButton: { marginTop: 32, width: '100%', height: 54, borderRadius: 14, backgroundColor: '#174C3D', justifyContent: 'center', alignItems: 'center' },
  doneButtonText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '800' },
  termsSafe: { flex: 1, backgroundColor: '#F7F3EC' },
  termsContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 44 },
  termsKicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, color: '#174C3D' },
  termsTitle: { marginTop: 8, fontSize: 34, lineHeight: 39, letterSpacing: -1.2, fontWeight: '800', color: '#17261F' },
  termsRule: { marginTop: 22, borderTopWidth: 2, borderColor: '#174C3D' },
  termsLead: { marginTop: 22, fontSize: 16, lineHeight: 24, fontWeight: '600', color: '#33423B' },
  termsHeading: { marginTop: 24, fontSize: 17, fontWeight: '800', color: '#17261F' },
  termsBody: { marginTop: 8, fontSize: 14, lineHeight: 22, color: '#5D574F' },
  termsAccept: { marginTop: 30, minHeight: 54, borderRadius: 14, backgroundColor: '#174C3D', alignItems: 'center', justifyContent: 'center' },
  termsAcceptText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  termsCancel: { minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  termsCancelText: { color: '#5D574F', fontSize: 14, fontWeight: '700' },
});

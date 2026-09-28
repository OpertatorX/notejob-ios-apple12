import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Language } from '../i18n/strings';
import { blockRatingAuthor, hideRating, reportRating } from '../lib/ratings';
import { ReviewReportReason } from '../types';

const reasons: Array<{ key: ReviewReportReason; fr: string; en: string }> = [
  { key: 'harassment', fr: 'Harcèlement', en: 'Harassment' },
  { key: 'hate', fr: 'Haine ou discrimination', en: 'Hate or discrimination' },
  { key: 'threat', fr: 'Menace', en: 'Threat' },
  { key: 'sexual', fr: 'Contenu sexuel', en: 'Sexual content' },
  { key: 'personal_info', fr: 'Informations personnelles', en: 'Personal information' },
  { key: 'spam', fr: 'Spam', en: 'Spam' },
  { key: 'other', fr: 'Autre', en: 'Other' },
];

export function ReviewSafetyModal({ visible, ratingId, language, onClose, onRemoved, onBlocked }: {
  visible: boolean;
  ratingId: string | null;
  language: Language;
  onClose: () => void;
  onRemoved: (id: string) => void;
  onBlocked: () => void;
}) {
  const fr = language === 'fr';
  const [mode, setMode] = useState<'actions' | 'report'>('actions');
  const [reason, setReason] = useState<ReviewReportReason>('harassment');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (busy) return;
    setMode('actions');
    setDetails('');
    setReason('harassment');
    onClose();
  };

  const hide = async () => {
    if (!ratingId) return;
    setBusy(true);
    try {
      await hideRating(ratingId);
      onRemoved(ratingId);
      close();
    } catch {
      Alert.alert(fr ? 'Masquage impossible' : 'Unable to hide');
      setBusy(false);
    }
  };

  const block = () => {
    if (!ratingId) return;
    Alert.alert(
      fr ? 'Bloquer cet utilisateur ?' : 'Block this user?',
      fr ? 'Ses avis ne seront plus affichés. Son identité reste anonyme.' : 'Their ratings will no longer be shown. Their identity remains anonymous.',
      [
        { text: fr ? 'Annuler' : 'Cancel', style: 'cancel' },
        { text: fr ? 'Bloquer' : 'Block', style: 'destructive', onPress: async () => {
          setBusy(true);
          try {
            await blockRatingAuthor(ratingId);
            onBlocked();
            close();
          } catch {
            Alert.alert(fr ? 'Blocage impossible' : 'Unable to block');
            setBusy(false);
          }
        } },
      ],
    );
  };

  const report = async () => {
    if (!ratingId) return;
    setBusy(true);
    try {
      await reportRating(ratingId, reason, details);
      Alert.alert(fr ? 'Signalement envoyé' : 'Report sent', fr ? 'Notre équipe examinera ce signalement sous 24 heures.' : 'Our team will review this report within 24 hours.');
      close();
    } catch {
      Alert.alert(fr ? 'Signalement impossible' : 'Unable to report');
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.handle} />
          <Text style={styles.kicker}>NOTEJOB · {fr ? 'SÉCURITÉ' : 'SAFETY'}</Text>
          <Text style={styles.title}>{mode === 'report' ? (fr ? 'Signaler cet avis' : 'Report this rating') : (fr ? 'Options de sécurité' : 'Safety options')}</Text>
          {mode === 'actions' ? (
            <>
              <Row label={fr ? 'Signaler cet avis' : 'Report this rating'} onPress={() => setMode('report')} />
              <Row label={fr ? 'Masquer cet avis' : 'Hide this rating'} onPress={() => void hide()} />
              <Row label={fr ? 'Bloquer cet utilisateur' : 'Block this user'} danger onPress={block} />
              <Row label={fr ? 'Annuler' : 'Cancel'} onPress={close} />
            </>
          ) : (
            <>
              <View style={styles.reasons}>{reasons.map((r) => (
                <TouchableOpacity key={r.key} style={[styles.reason, reason === r.key && styles.reasonActive]} onPress={() => setReason(r.key)}>
                  <Text style={[styles.reasonText, reason === r.key && styles.reasonTextActive]}>{fr ? r.fr : r.en}</Text>
                </TouchableOpacity>
              ))}</View>
              <TextInput value={details} onChangeText={(v) => setDetails(v.slice(0,500))} multiline maxLength={500} placeholder={fr ? 'Précision facultative' : 'Optional details'} placeholderTextColor="#8C877F" style={styles.input} />
              <TouchableOpacity disabled={busy} style={styles.primary} onPress={() => void report()}>{busy ? <ActivityIndicator color="#fff"/> : <Text style={styles.primaryText}>{fr ? 'Envoyer le signalement' : 'Send report'}</Text>}</TouchableOpacity>
              <Row label={fr ? 'Retour' : 'Back'} onPress={() => setMode('actions')} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Row({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return <TouchableOpacity onPress={onPress} style={styles.row}><Text style={[styles.rowText, danger && styles.danger]}>{label}</Text><Text style={styles.arrow}>›</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(14,20,17,0.30)' },
  card: { backgroundColor: '#FBF7F0', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 11, paddingBottom: 28 },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: '#C9C4BC', marginBottom: 15 },
  kicker: { fontSize: 9.5, fontWeight: '900', letterSpacing: 1.2, color: '#174C3D' },
  title: { marginTop: 6, marginBottom: 8, fontSize: 22, lineHeight: 27, fontWeight: '800', color: '#1D2420' },
  row: { minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#DAD5CD', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowText: { fontSize: 15, color: '#2B322E', fontWeight: '600' },
  danger: { color: '#A53E34' },
  arrow: { fontSize: 24, color: '#8A8D88' },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  reason: { borderWidth: 1, borderColor: '#CFC9BF', borderRadius: 99, paddingVertical: 8, paddingHorizontal: 11 },
  reasonActive: { backgroundColor: '#174C3D', borderColor: '#174C3D' },
  reasonText: { fontSize: 12.5, color: '#33423B', fontWeight: '700' },
  reasonTextActive: { color: '#fff' },
  input: { minHeight: 82, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#CFC9BF', paddingVertical: 10, fontSize: 14, color: '#17261F', textAlignVertical: 'top' },
  primary: { marginTop: 14, minHeight: 52, borderRadius: 14, backgroundColor: '#174C3D', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 14.5, fontWeight: '800' },
});

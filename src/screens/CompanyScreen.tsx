import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScoreBar } from '../components/ScoreBar';
import { ReviewSafetyModal } from '../components/ReviewSafetyModal';
import { Company, CompanyStats, ReportReason, VisibleRating } from '../types';
import { Language, Translations } from '../i18n/strings';
import { deleteOwnRating, fetchCompanyStats, fetchVisibleRatings, getOwnRating, submitEstablishmentReport } from '../lib/ratings';
import { isFavorite, toggleFavorite } from '../lib/favorites';

export function CompanyScreen({ company, t, language, onBack, onRate, onSafety }: {
  company: Company;
  t: Translations;
  language: Language;
  onBack: () => void;
  onRate: () => void;
  onSafety: () => void;
}) {
  const fr = language === 'fr';
  const [stats, setStats] = useState<CompanyStats | null>(null);
  const [hasOwnRating, setHasOwnRating] = useState(false);
  const [reviews, setReviews] = useState<VisibleRating[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [safetyRatingId, setSafetyRatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [nextStats, own, visible] = await Promise.all([
      fetchCompanyStats(company),
      getOwnRating(company).catch(() => null),
      fetchVisibleRatings(company).catch(() => []),
    ]);
    setStats(nextStats);
    setHasOwnRating(Boolean(own));
    setReviews(visible);
  }, [company]);

  useEffect(() => {
    void load();
    void isFavorite(company.siret).then(setFavorite);
  }, [company, load]);

  const removeRating = () => {
    Alert.alert(t.deleteRatingTitle, t.deleteRatingBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteOwnRating(company);
            await load();
          } catch {
            Alert.alert(t.ratingFailed);
          }
        },
      },
    ]);
  };

  const sendReport = async (reason: ReportReason) => {
    setReporting(true);
    try {
      await submitEstablishmentReport(company, reason);
      setReportOpen(false);
      Alert.alert(t.reportSent);
    } catch {
      Alert.alert(t.reportFailed);
    } finally {
      setReporting(false);
    }
  };

  const reportRows: Array<{ reason: ReportReason; label: string }> = [
    { reason: 'wrong_name', label: t.reportWrongName },
    { reason: 'wrong_address', label: t.reportWrongAddress },
    { reason: 'closed', label: t.reportClosed },
    { reason: 'duplicate', label: t.reportDuplicate },
    { reason: 'other', label: t.reportOther },
  ];

  const toggleSaved = async () => {
    const next = await toggleFavorite(company);
    setFavorite(next);
  };

  const overall = stats?.count ? stats.overall.toFixed(1) : '—';
  const recommend = stats?.count ? `${Math.round(stats.recommendPercent)} %` : '—';
  const ratingAverage = (r: VisibleRating) => ((r.management + r.compensation + r.culture + r.balance + r.career) / 5).toFixed(1);

  return (
    <>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.headerButton} activeOpacity={0.62}><Text style={styles.backGlyph}>‹</Text></TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={toggleSaved} style={styles.headerButton} activeOpacity={0.62}><Text style={[styles.heart, favorite && styles.heartSaved]}>{favorite ? '♥' : '♡'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setReportOpen(true)} style={styles.headerButton} activeOpacity={0.62}><Text style={styles.more}>•••</Text></TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.identity}>
            <Text style={styles.eyebrow}>ENTREPRISE · {company.city.toUpperCase()}</Text>
            <Text numberOfLines={3} style={styles.companyName}>{company.name}</Text>
            <Text style={styles.location}>{[company.postalCode, company.city].filter(Boolean).join(' · ')}</Text>
            {!!company.address && <Text style={styles.address}>{company.address}</Text>}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.primaryStat}>
              <View style={styles.overallLine}><Text style={styles.overall}>{overall}</Text><Text style={styles.outOf}>/5</Text></View>
              <Text style={styles.statLabel}>{stats?.count || 0} {t.reviews.toLowerCase()}</Text>
            </View>
            <View style={styles.verticalRule} />
            <View style={styles.secondaryStat}>
              <Text style={styles.recommend}>{recommend}</Text>
              <Text style={styles.statLabel}>{t.recommendCompany}</Text>
            </View>
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionKicker}>LE QUOTIDIEN</Text>
            <Text style={styles.sectionTitle}>{t.scoreDetails}</Text>
          </View>

          {!stats ? (
            <ActivityIndicator style={{ marginTop: 30 }} color="#174C3D" />
          ) : (
            <View style={styles.bars}>
              <ScoreBar label={t.management} value={stats.management} />
              <ScoreBar label={t.compensation} value={stats.compensation} />
              <ScoreBar label={t.culture} value={stats.culture} />
              <ScoreBar label={t.balanceLong} value={stats.balance} />
              <ScoreBar label={t.career} value={stats.career} />
              {!stats.count && <Text style={styles.emptyStats}>{t.emptyStats}</Text>}
            </View>
          )}

          {reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionKicker}>{fr ? 'EXPÉRIENCES RÉCENTES' : 'RECENT EXPERIENCES'}</Text>
              {reviews.map((review) => (
                <View key={review.id} style={styles.reviewRow}>
                  <View style={styles.reviewBody}>
                    <View style={styles.reviewTop}>
                      <Text style={styles.reviewScore}>{ratingAverage(review)}/5</Text>
                      <Text style={styles.reviewStatus}>{review.employmentStatus === 'current' ? (fr ? 'Salarié actuel' : 'Current employee') : (fr ? 'Ancien salarié' : 'Former employee')}</Text>
                    </View>
                    {!!review.jobTitle && <Text numberOfLines={1} style={styles.reviewRole}>{review.jobTitle}</Text>}
                    <Text style={styles.reviewMeta}>{review.recommend ? (fr ? 'Recommande cette entreprise' : 'Recommends this company') : (fr ? 'Ne recommande pas cette entreprise' : 'Does not recommend this company')}</Text>
                  </View>
                  <TouchableOpacity accessibilityLabel={fr ? 'Options de sécurité' : 'Safety options'} onPress={() => setSafetyRatingId(review.id)} style={styles.reviewMore}>
                    <Text style={styles.more}>•••</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity accessibilityRole="button" onPress={onRate} activeOpacity={0.82} style={styles.rateButton}>
            <Text style={styles.rateText}>{hasOwnRating ? t.updateRating : t.rateCta}</Text>
            <Text style={styles.rateArrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.secondaryRow}>
            {hasOwnRating && (
              <TouchableOpacity onPress={removeRating} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{t.deleteRating}</Text></TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setReportOpen(true)} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{t.report}</Text></TouchableOpacity>
            <TouchableOpacity onPress={onSafety} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{fr ? 'Sécurité & contact' : 'Safety & contact'}</Text></TouchableOpacity>
          </View>

          <Text style={styles.disclaimer}>{t.disclaimer}</Text>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
        <View style={styles.modalShade}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t.reportTitle}</Text>
            {reportRows.map((row) => (
              <TouchableOpacity disabled={reporting} key={row.reason} onPress={() => void sendReport(row.reason)} style={styles.modalRow}>
                <Text style={styles.modalRowText}>{row.label}</Text><Text style={styles.modalArrow}>›</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setReportOpen(false)} style={styles.modalCancel}><Text style={styles.modalCancelText}>{t.cancel}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ReviewSafetyModal
        visible={Boolean(safetyRatingId)}
        ratingId={safetyRatingId}
        language={language}
        onClose={() => setSafetyRatingId(null)}
        onRemoved={(id) => setReviews((current) => current.filter((r) => r.id !== id))}
        onBlocked={() => void load()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F3EC' },
  header: { height: 54, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', gap: 10 },
  headerButton: { minWidth: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { fontSize: 36, lineHeight: 38, marginTop: -4, color: '#173C32', fontWeight: '300' },
  heart: { fontSize: 24, color: '#173C32' },
  heartSaved: { color: '#B85C36' },
  more: { fontSize: 15, letterSpacing: 1.4, color: '#173C32', fontWeight: '800', marginTop: -4 },
  content: { paddingHorizontal: 24, paddingTop: 21, paddingBottom: 36 },
  identity: { paddingRight: 6 },
  eyebrow: { fontSize: 9.5, fontWeight: '900', letterSpacing: 1.2, color: '#174C3D' },
  companyName: { marginTop: 8, fontSize: 39, lineHeight: 42, letterSpacing: -1.5, fontWeight: '800', color: '#171B19' },
  location: { marginTop: 12, fontSize: 15, fontWeight: '700', color: '#434944' },
  address: { marginTop: 4, fontSize: 13.5, lineHeight: 19, color: '#767973' },
  statsRow: { marginTop: 34, flexDirection: 'row', alignItems: 'stretch', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#D7D1C8', paddingVertical: 23 },
  primaryStat: { flex: 1.05 },
  secondaryStat: { flex: 1, paddingLeft: 20, justifyContent: 'center' },
  verticalRule: { width: StyleSheet.hairlineWidth, backgroundColor: '#D7D1C8', marginLeft: 6 },
  overallLine: { flexDirection: 'row', alignItems: 'baseline' },
  overall: { fontSize: 58, lineHeight: 60, letterSpacing: -2.2, fontWeight: '800', color: '#174C3D' },
  outOf: { marginLeft: 4, fontSize: 16, fontWeight: '700', color: '#174C3D' },
  recommend: { fontSize: 31, lineHeight: 35, letterSpacing: -0.8, fontWeight: '800', color: '#174C3D' },
  statLabel: { marginTop: 5, maxWidth: 150, fontSize: 12.5, lineHeight: 17, color: '#797B76' },
  sectionHead: { marginTop: 31, marginBottom: 9 },
  sectionKicker: { fontSize: 9.5, fontWeight: '900', letterSpacing: 1.2, color: '#174C3D' },
  sectionTitle: { marginTop: 5, fontSize: 21, lineHeight: 26, fontWeight: '800', letterSpacing: -0.35, color: '#1C211F' },
  bars: { marginTop: 2 },
  emptyStats: { marginTop: 12, fontSize: 13.5, lineHeight: 20, color: '#7A7C77' },
  reviewsSection: { marginTop: 30 },
  reviewRow: { minHeight: 92, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#D7D1C8', flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  reviewBody: { flex: 1, paddingRight: 12 },
  reviewTop: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  reviewScore: { fontSize: 21, fontWeight: '800', color: '#174C3D' },
  reviewStatus: { fontSize: 12, fontWeight: '700', color: '#6E716C' },
  reviewRole: { marginTop: 5, fontSize: 14.5, fontWeight: '700', color: '#1C211F' },
  reviewMeta: { marginTop: 5, fontSize: 12.5, lineHeight: 17, color: '#797B76' },
  reviewMore: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  rateButton: { marginTop: 28, height: 54, borderRadius: 14, backgroundColor: '#174C3D', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#11352B', shadowOpacity: 0.08, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  rateText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '800' },
  rateArrow: { color: '#FFFFFF', fontSize: 21 },
  secondaryRow: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  secondaryAction: { paddingVertical: 8 },
  secondaryActionText: { fontSize: 12.5, fontWeight: '700', color: '#6E716C' },
  disclaimer: { marginTop: 22, paddingTop: 17, borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#D8D3CA', fontSize: 11.5, lineHeight: 17, color: '#8B8B85' },
  modalShade: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(14,20,17,0.30)' },
  modalCard: { backgroundColor: '#FBF7F0', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 11, paddingBottom: 24 },
  modalHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: '#C9C4BC', marginBottom: 15 },
  modalTitle: { fontSize: 22, lineHeight: 27, fontWeight: '800', color: '#1D2420', marginBottom: 8 },
  modalRow: { minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#DAD5CD', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalRowText: { fontSize: 15, color: '#2B322E' },
  modalArrow: { fontSize: 24, color: '#8A8D88' },
  modalCancel: { marginTop: 14, height: 48, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '800', color: '#174C3D' },
});

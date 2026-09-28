import AsyncStorage from '@react-native-async-storage/async-storage';
import { Company, CompanyStats, RatingDraft, ReportReason, ReviewReportReason, VisibleRating } from '../types';
import { supabase, supabaseConfigured } from './supabase';

export const UGC_TERMS_VERSION = '2026-09-24';

const EMPTY: CompanyStats = {
  count: 0,
  overall: 0,
  management: 0,
  compensation: 0,
  culture: 0,
  balance: 0,
  career: 0,
  recommendPercent: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

function averageOf(r: RatingDraft) {
  return (r.management + r.compensation + r.culture + r.balance + r.career) / 5;
}

function localKey(siret: string) {
  return `notejob.rating.${siret}`;
}

async function findEstablishmentId(siret: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('establishments').select('id').eq('siret', siret).maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

async function ensureAuthenticated() {
  if (!supabase) throw new Error('Supabase unavailable');
  let { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    ({ data: sessionData, error: sessionError } = await supabase.auth.getSession());
    if (sessionError) throw sessionError;
  }
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Anonymous session unavailable');
  return userId;
}

export async function ensureEstablishment(company: Company): Promise<Company> {
  if (!supabaseConfigured || !supabase) return company;
  await ensureAuthenticated();

  const existingId = await findEstablishmentId(company.siret);
  if (existingId) return { ...company, establishmentId: existingId };

  const { data, error } = await supabase.rpc('ensure_establishment', {
    p_siren: company.siren,
    p_siret: company.siret,
    p_legal_name: company.legalName || company.name,
    p_display_name: company.name,
    p_city: company.city,
    p_postal_code: company.postalCode || null,
    p_address: company.address || null,
    p_industry: company.industry || null,
    p_is_headquarters: Boolean(company.isHeadquarters),
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  const establishmentId = row?.establishment_id as string | undefined;
  const companyId = row?.company_id as string | undefined;
  if (!establishmentId) throw new Error('Missing establishment id');
  return { ...company, id: companyId, establishmentId };
}

export async function fetchCompanyStats(company: Company): Promise<CompanyStats> {
  if (!supabaseConfigured || !supabase) {
    const raw = await AsyncStorage.getItem(localKey(company.siret));
    if (!raw) return EMPTY;
    const r = JSON.parse(raw) as RatingDraft;
    const overall = averageOf(r);
    const rounded = Math.min(5, Math.max(1, Math.round(overall))) as 1 | 2 | 3 | 4 | 5;
    const distribution: CompanyStats['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution[rounded] = 1;
    return {
      count: 1,
      overall,
      management: r.management,
      compensation: r.compensation,
      culture: r.culture,
      balance: r.balance,
      career: r.career,
      recommendPercent: r.recommend ? 100 : 0,
      distribution,
    };
  }

  const establishmentId = await findEstablishmentId(company.siret);
  if (!establishmentId) return EMPTY;

  const { data, error } = await supabase.rpc('establishment_stats_v2', { p_establishment_id: establishmentId });
  if (error || !data || data.length === 0) return EMPTY;
  const row = data[0];
  return {
    count: Number(row.rating_count || 0),
    overall: Number(row.overall || 0),
    management: Number(row.management || 0),
    compensation: Number(row.compensation || 0),
    culture: Number(row.culture || 0),
    balance: Number(row.balance || 0),
    career: Number(row.career || 0),
    recommendPercent: Number(row.recommend_percent || 0),
    distribution: {
      1: Number(row.star_1 || 0),
      2: Number(row.star_2 || 0),
      3: Number(row.star_3 || 0),
      4: Number(row.star_4 || 0),
      5: Number(row.star_5 || 0),
    },
  };
}

export async function fetchVisibleRatings(company: Company): Promise<VisibleRating[]> {
  if (!supabaseConfigured || !supabase) {
    const raw = await AsyncStorage.getItem(localKey(company.siret));
    if (!raw) return [];
    const r = JSON.parse(raw) as RatingDraft;
    return [{
      id: `local-${company.siret}`,
      management: r.management,
      compensation: r.compensation,
      culture: r.culture,
      balance: r.balance,
      career: r.career,
      recommend: Boolean(r.recommend),
      employmentStatus: r.employmentStatus || 'current',
      jobTitle: r.jobTitle || null,
      createdAt: new Date().toISOString(),
    }];
  }

  await ensureAuthenticated();
  const establishmentId = await findEstablishmentId(company.siret);
  if (!establishmentId) return [];

  const { data, error } = await supabase.rpc('get_visible_ratings', {
    p_establishment_id: establishmentId,
    p_limit: 20,
    p_offset: 0,
  });
  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: String(row.id),
    management: Number(row.management),
    compensation: Number(row.compensation),
    culture: Number(row.culture),
    balance: Number(row.balance),
    career: Number(row.career),
    recommend: Boolean(row.recommend),
    employmentStatus: row.employment_status === 'former' ? 'former' : 'current',
    jobTitle: row.job_title || null,
    createdAt: row.created_at || new Date().toISOString(),
  }));
}

export async function getOwnRating(company: Company): Promise<RatingDraft | null> {
  if (!supabaseConfigured || !supabase) {
    const raw = await AsyncStorage.getItem(localKey(company.siret));
    return raw ? (JSON.parse(raw) as RatingDraft) : null;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) return null;

  const establishmentId = await findEstablishmentId(company.siret);
  if (!establishmentId) return null;

  const { data, error } = await supabase
    .from('ratings')
    .select('management,compensation,culture,balance,career,recommend,employment_status,job_title')
    .eq('establishment_id', establishmentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    management: Number(data.management),
    compensation: Number(data.compensation),
    culture: Number(data.culture),
    balance: Number(data.balance),
    career: Number(data.career),
    recommend: Boolean(data.recommend),
    employmentStatus: data.employment_status as 'current' | 'former',
    jobTitle: data.job_title || '',
  };
}

export async function getUgcTermsStatus(): Promise<{ version: string | null; acceptedAt: string | null; banned: boolean }> {
  if (!supabaseConfigured || !supabase) {
    const version = await AsyncStorage.getItem('notejob.ugcTermsVersion');
    return { version, acceptedAt: version ? new Date().toISOString() : null, banned: false };
  }
  await ensureAuthenticated();
  const { data, error } = await supabase.rpc('ugc_terms_status');
  if (error) throw error;
  const row = data?.[0] || null;
  return {
    version: row?.version || null,
    acceptedAt: row?.accepted_at || null,
    banned: Boolean(row?.banned),
  };
}

export async function acceptUgcTerms() {
  if (!supabaseConfigured || !supabase) {
    await AsyncStorage.setItem('notejob.ugcTermsVersion', UGC_TERMS_VERSION);
    return;
  }
  await ensureAuthenticated();
  const { error } = await supabase.rpc('accept_ugc_terms', { p_version: UGC_TERMS_VERSION });
  if (error) throw error;
}

export async function submitRating(company: Company, rating: RatingDraft) {
  if (!supabaseConfigured || !supabase) {
    await AsyncStorage.setItem(localKey(company.siret), JSON.stringify(rating));
    return;
  }

  await ensureAuthenticated();
  const ensured = await ensureEstablishment(company);
  if (!ensured.establishmentId) throw new Error('Missing establishment id');

  const { error } = await supabase.rpc('submit_rating_v2', {
    p_establishment_id: ensured.establishmentId,
    p_management: rating.management,
    p_compensation: rating.compensation,
    p_culture: rating.culture,
    p_balance: rating.balance,
    p_career: rating.career,
    p_recommend: rating.recommend,
    p_employment_status: rating.employmentStatus,
    p_job_title: rating.jobTitle.trim() || null,
  });
  if (error) throw error;
}

export async function deleteOwnRating(company: Company) {
  if (!supabaseConfigured || !supabase) {
    await AsyncStorage.removeItem(localKey(company.siret));
    return;
  }

  await ensureAuthenticated();
  const establishmentId = await findEstablishmentId(company.siret);
  if (!establishmentId) return;
  const { error } = await supabase.rpc('delete_my_rating', { p_establishment_id: establishmentId });
  if (error) throw error;
}

export async function reportRating(ratingId: string, reason: ReviewReportReason, details?: string) {
  if (!supabaseConfigured || !supabase || ratingId.startsWith('local-')) return;
  await ensureAuthenticated();
  const { error } = await supabase.rpc('submit_rating_report', {
    p_rating_id: ratingId,
    p_reason: reason,
    p_details: details?.trim() || null,
  });
  if (error) throw error;
}

export async function hideRating(ratingId: string) {
  if (!supabaseConfigured || !supabase || ratingId.startsWith('local-')) return;
  await ensureAuthenticated();
  const { error } = await supabase.rpc('hide_rating', { p_rating_id: ratingId });
  if (error) throw error;
}

export async function blockRatingAuthor(ratingId: string) {
  if (!supabaseConfigured || !supabase || ratingId.startsWith('local-')) return;
  await ensureAuthenticated();
  const { error } = await supabase.rpc('block_rating_author', { p_rating_id: ratingId });
  if (error) throw error;
}

export async function submitEstablishmentReport(company: Company, reason: ReportReason) {
  if (!supabaseConfigured || !supabase) {
    await AsyncStorage.setItem(`notejob.report.${company.siret}.${reason}`, new Date().toISOString());
    return;
  }

  await ensureAuthenticated();
  const ensured = await ensureEstablishment(company);
  if (!ensured.establishmentId) throw new Error('Missing establishment id');
  const { error } = await supabase.rpc('submit_establishment_report', {
    p_establishment_id: ensured.establishmentId,
    p_reason: reason,
  });
  if (error) throw error;
}

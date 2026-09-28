import { Company } from '../types';
import { supabase, supabaseConfigured } from './supabase';

export type CompanyMedia = {
  logoUrl?: string;
  heroUrl?: string;
  altText?: string;
  scope: 'establishment' | 'company' | 'fallback';
};

type MediaRow = {
  scope_type: 'company' | 'establishment';
  scope_id: string;
  siren: string;
  siret?: string | null;
  logo_path?: string | null;
  hero_path?: string | null;
  alt_text?: string | null;
};

function publicUrl(path?: string | null) {
  if (!path || !supabase) return undefined;
  return supabase.storage.from('company-media').getPublicUrl(path).data.publicUrl || undefined;
}

export async function fetchCompanyMedia(company: Company): Promise<CompanyMedia> {
  if (!supabaseConfigured || !supabase) return { scope: 'fallback' };

  const { data, error } = await supabase
    .from('company_media')
    .select('scope_type,scope_id,siren,siret,logo_path,hero_path,alt_text')
    .eq('siren', company.siren)
    .in('scope_id', [company.siret, company.siren]);

  if (error || !data?.length) return { scope: 'fallback' };

  const rows = data as MediaRow[];
  const chosen = rows.find((row) => row.scope_type === 'establishment' && row.scope_id === company.siret)
    || rows.find((row) => row.scope_type === 'company' && row.scope_id === company.siren);

  if (!chosen) return { scope: 'fallback' };
  const heroUrl = publicUrl(chosen.hero_path);
  const logoUrl = publicUrl(chosen.logo_path);
  if (!heroUrl && !logoUrl) return { scope: 'fallback' };

  return {
    logoUrl,
    heroUrl,
    altText: chosen.alt_text || undefined,
    scope: chosen.scope_type,
  };
}

export type Company = {
  id?: string;
  establishmentId?: string;
  siren: string;
  siret: string;
  name: string;
  legalName?: string;
  city: string;
  postalCode?: string;
  address?: string;
  industry?: string;
  isHeadquarters?: boolean;
  employer?: boolean;
  employeeBand?: string;
  latitude?: number;
  longitude?: number;
  matchQuality?: 'high' | 'strong' | 'possible';
  resolvedPlaceName?: string;
  matchSignals?: string[];
};

export type RatingDraft = {
  management: number;
  compensation: number;
  culture: number;
  balance: number;
  career: number;
  recommend: boolean | null;
  employmentStatus: 'current' | 'former' | null;
  jobTitle: string;
};

export type CompanyStats = {
  count: number;
  overall: number;
  management: number;
  compensation: number;
  culture: number;
  balance: number;
  career: number;
  recommendPercent: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type ReportReason = 'wrong_name' | 'wrong_address' | 'closed' | 'duplicate' | 'other';


export type VisibleRating = {
  id: string;
  management: number;
  compensation: number;
  culture: number;
  balance: number;
  career: number;
  recommend: boolean;
  employmentStatus: 'current' | 'former';
  jobTitle: string | null;
  createdAt: string;
};

export type ReviewReportReason = 'harassment' | 'hate' | 'sexual' | 'personal_info' | 'spam' | 'threat' | 'other';

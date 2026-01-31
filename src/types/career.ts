export type CareerField = 
  | 'software_engineering'
  | 'blockchain_development'
  | 'devops_engineering'
  | 'finance'
  | 'product_management'
  | 'data_science'
  | 'ui_ux_design'
  | 'business_development'
  | 'research_academia'
  | 'marketing'
  | 'legal'
  | 'security'
  | 'venture';

export const CAREER_FIELD_LABELS: Record<CareerField, string> = {
  software_engineering: 'Software Engineering',
  blockchain_development: 'Blockchain Development',
  devops_engineering: 'DevOps Engineering',
  finance: 'Finance',
  product_management: 'Product Management',
  data_science: 'Data Science',
  ui_ux_design: 'UI/UX Design',
  business_development: 'Business Development',
  research_academia: 'Research/Academia',
  marketing: 'Marketing',
  legal: 'Legal',
  security: 'Security',
  venture: 'Venture',
};

export const CAREER_FIELD_OPTIONS: CareerField[] = [
  'software_engineering',
  'blockchain_development',
  'devops_engineering',
  'finance',
  'product_management',
  'data_science',
  'ui_ux_design',
  'business_development',
  'research_academia',
  'marketing',
  'legal',
  'security',
  'venture',
];

export interface Job {
  id: number;
  company: string;
  position: string;
  job_posting_url: string;
  experience_level: string | null;
  notes: string | null;
  career_fields: CareerField[] | null;
  created_at: string;
  last_updated: string | null;
}

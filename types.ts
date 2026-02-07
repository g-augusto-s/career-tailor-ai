
export interface CareerModule {
  id: string;
  title: string;
  description: string;
  unit: string; // Business Unit
  type: 'experience' | 'case_study' | 'skill' | 'education';
}

export interface TargetJob {
  company: string;
  title: string;
  description: string;
  values?: string;
}

export interface GeneratedContent {
  resume: string;
  coverLetter: string;
  interviewTips: string;
}

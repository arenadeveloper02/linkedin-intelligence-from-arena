export type SeniorityLevel = 'C-Level' | 'Director' | 'Manager' | 'IC' | 'Unknown';

export type TabKey = 'overview' | 'people' | 'companies' | 'posts';

export interface CompanyProfile {
  name: string;
  logoUrl: string;
  followerCount: number;
  tagline: string;
  employeeCount: number;
  industry: string;
}

export interface PersonInteraction {
  postKey: string;
  postUrl: string;
  postSnippet: string;
  reactionType: string;
}

export interface Person {
  slug: string;
  fullName: string;
  firstName: string;
  lastName: string;
  linkedinUrl: string;
  headline: string;
  title: string;
  seniorityRaw: string;
  seniority: SeniorityLevel;
  isDecisionMaker: boolean;
  companyName: string;
  companyUrl: string;
  location: string;
  country: string;
  connectionDegree: string;
  followersCount: number;
  connectionsCount: number;
  relationshipType: string;
  isInternal: boolean;
  avatarUrl: string;
  targetCompany: string;
  interactions: PersonInteraction[];
  engagementCount: number;
}

export interface PostItem {
  id: string;
  activityKey: string;
  text: string;
  parsedDatetime: string;
  reactionCounter: number;
  commentCounter: number;
  repostCounter: number;
  shareUrl: string;
  engagerSlugs: string[];
}

export interface EngagementRecord {
  postKey: string;
  personSlug: string;
  engagementType: string;
  reactionType: string;
}

export interface DashboardData {
  company: CompanyProfile | null;
  posts: PostItem[];
  people: Person[];
  engagements: EngagementRecord[];
}

export interface CompanyAggregate {
  name: string;
  peopleCount: number;
  decisionMakerCount: number;
  totalEngagements: number;
  seniorityCounts: Record<SeniorityLevel, number>;
  people: Person[];
}

export interface DistributionItem {
  label: string;
  count: number;
}

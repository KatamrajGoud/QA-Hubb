export type UserRole = 'ADMIN' | 'HEAD' | 'QA' | 'DEVELOPER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
}

export type ProjectStatus = 'ACTIVE' | 'IN_TESTING' | 'COMPLETED' | 'ARCHIVED' | 'ON_HOLD';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProjectMember {
  id: string;
  role: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  techStack: string;
  startDate?: string | null;
  targetDate?: string | null;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  members?: ProjectMember[];
  _count?: {
    bugs: number;
    builds: number;
    resources?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type ResourceCategory =
  | 'URL'
  | 'GOOGLE_SHEET'
  | 'GOOGLE_DOC'
  | 'GITHUB'
  | 'API_DOC'
  | 'APK'
  | 'REQUIREMENT'
  | 'TEST_PLAN'
  | 'BUG_DOC'
  | 'OTHER';

export interface Resource {
  id: string;
  projectId: string;
  title: string;
  category: ResourceCategory;
  url: string;
  description: string;
  addedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PlatformType = 'WEB' | 'ANDROID' | 'IOS' | 'API';
export type QAStatusType = 'PENDING' | 'IN_TESTING' | 'PASSED' | 'FAILED' | 'RETEST_REQUIRED';

export interface Build {
  id: string;
  projectId: string;
  version: string;
  platform: PlatformType;
  releaseDate: string;
  buildUrl: string;
  releaseNotes: string;
  qaStatus: QAStatusType;
  testingNotes: string;
  uploadedById?: string | null;
  uploadedBy?: {
    id: string;
    name: string;
  } | null;
  project?: {
    id: string;
    name: string;
    code: string;
  };
  bugs?: Array<{
    id: string;
    bugId: string;
    title: string;
    severity: string;
    status: string;
  }>;
  _count?: {
    bugs: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type BugSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type BugStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'FIXED'
  | 'RETEST'
  | 'REOPENED'
  | 'CLOSED';

export interface BugComment {
  id: string;
  bugId: string;
  userId: string;
  body: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: UserRole;
  };
}

export interface Bug {
  id: string;
  bugId: string;
  projectId: string;
  buildId?: string | null;
  fixedBuildId?: string | null;
  title: string;
  description: string;
  module: string;
  stepsToRepro: string;
  expected: string;
  actual: string;
  severity: BugSeverity;
  priority: PriorityLevel;
  status: BugStatus;
  evidenceUrl: string;
  retestNotes: string;
  reporterId?: string | null;
  assigneeId?: string | null;
  project?: {
    id: string;
    name: string;
    code: string;
  };
  assignee?: {
    id: string;
    name: string;
  } | null;
  reporter?: {
    id: string;
    name: string;
  } | null;
  build?: {
    id: string;
    version: string;
  } | null;
  fixedBuild?: {
    id: string;
    version: string;
  } | null;
  comments?: BugComment[];
  _count?: {
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DailyUpdate {
  id: string;
  projectId?: string | null;
  userId: string;
  workDone: string;
  currentTask: string;
  blockers: string;
  nextSteps: string;
  timeSpent?: number | null;
  date: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    role: UserRole;
  };
  project?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  details: string;
  createdAt: string;
  userId?: string | null;
  projectId?: string | null;
  user?: {
    id: string;
    name: string;
  } | null;
  project?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface DashboardData {
  projects: {
    total: number;
    active: number;
    inTesting: number;
    completed: number;
  };
  bugs: {
    total: number;
    open: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  builds: {
    awaitingTesting: number;
  };
  blockedProjects: Project[];
  recentActivity: ActivityItem[];
  recentBuilds: Build[];
}

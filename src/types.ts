export type RecentCast = {
  hash: string;
  text: string;
  timestamp: string;
  likes: number;
  recasts: number;
};

export type DashboardUser = {
  fid: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  primaryAddress?: string;
  followersCount?: number;
  followingCount?: number;
  castsCount?: number;
  reactionsCount?: number;
  location?: string;
  bio?: string;
  neynarScore?: number;
  dateOfBirth?: string;
};

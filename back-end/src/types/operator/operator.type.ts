/**
 * A travel agency. It signs up unverified; staff check the tour-operator licence before any of its
 * plans can go live.
 */
export type TOperator = {
  id: string;
  /** The public profile lives at /operators/<slug>. */
  slug: string;
  name: string;
  licenceNo: string;
  city: string;
  foundedYear: number | null;
  about: string;
  languages: string[];
  fleet: string;
  isVerified: boolean;
  /** Median hours to answer a traveller; seeded today, measured once messaging exists. */
  replyHours: number;
  /** The circle behind the initials on the profile and plan pages. */
  color: string;
  coverUrl: string;

  createdAt: Date;
  updatedAt: Date;
};

/** What an agency may edit about itself; verification and reply time are not among them. */
export type TOperatorUpdate = Partial<
  Pick<
    TOperator,
    'name' | 'licenceNo' | 'city' | 'foundedYear' | 'about' | 'languages' | 'fleet' | 'coverUrl'
  >
>;

/** Staff adding an agency by hand: its profile and the first OPERATOR login, which they hand over. */
export type TOperatorCreate = TOperatorUpdate & {
  contactName: string;
  /** An 8-digit phone or an email, as in the sign-in box. */
  login: string;
  password: string;
  /** Set when staff have already checked the licence. */
  isVerified?: boolean;
};

/** Company-level numbers for the profile page, the plan page strip and the admin health table. */
export type TOperatorStats = {
  score: number | null;
  areas: { area: string; score: number | null }[];
  stars: number | null;
  reviewCount: number;
  plansLive: number;
  tripsSold: number;
  /** Bookings the operator itself cancelled, as % of all its bookings. */
  cancelRate: number;
};

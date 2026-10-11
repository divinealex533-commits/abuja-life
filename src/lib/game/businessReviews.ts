export type BusinessReviewSource =
  | "npc_customer"
  | "player_customer"
  | "contract"
  | "event"
  | "other";

export type BusinessReviewSentiment =
  | "terrible"
  | "poor"
  | "average"
  | "good"
  | "excellent";

export interface BusinessReview {
  id: string;
  businessId: string;
  reviewerId: string;
  reviewerName: string;
  source: BusinessReviewSource;
  rating: number;
  sentiment: BusinessReviewSentiment;
  title: string;
  comment: string;
  serviceScore: number;
  valueScore: number;
  qualityScore: number;
  createdAt: number;
  helpfulCount: number;
  verified: boolean;
}

export interface BusinessReviewSummary {
  businessId: string;
  totalReviews: number;
  averageRating: number;
  serviceRating: number;
  valueRating: number;
  qualityRating: number;
  positiveReviews: number;
  neutralReviews: number;
  negativeReviews: number;
  verifiedReviews: number;
  reputationScore: number;
  popularityScore: number;
}

export interface BusinessReviewResult {
  success: boolean;
  review: BusinessReview | null;
  message: string;
}

const STORAGE_KEY =
  "abujaLifeBusinessReviews";

const MIN_RATING = 1;
const MAX_RATING = 5;

const POSITIVE_COMMENTS = [
  "Great service and friendly staff.",
  "I really enjoyed my experience here.",
  "The service was fast and professional.",
  "Very good quality and worth the money.",
  "I would definitely come back again.",
  "One of the better businesses in Abuja.",
  "The staff were helpful and welcoming.",
  "Everything was handled professionally.",
];

const NEUTRAL_COMMENTS = [
  "The experience was okay.",
  "Decent service, but there is room for improvement.",
  "The service was average.",
  "It was an acceptable experience.",
  "Nothing special, but everything worked.",
];

const NEGATIVE_COMMENTS = [
  "The service could be much better.",
  "I expected more from this business.",
  "The experience was disappointing.",
  "The service was slower than expected.",
  "There is definitely room for improvement.",
];

const POSITIVE_TITLES = [
  "Great experience",
  "Excellent service",
  "Worth it",
  "Very impressed",
  "I would return",
];

const NEUTRAL_TITLES = [
  "Decent experience",
  "It was okay",
  "Average service",
  "Could be better",
];

const NEGATIVE_TITLES = [
  "Needs improvement",
  "Not impressed",
  "Disappointing",
  "Could be much better",
];

function loadAllReviews(): Record<
  string,
  BusinessReview[]
> {
  if (
    typeof window === "undefined"
  ) {
    return {};
  }

  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return {};
    }

    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    return parsed as Record<
      string,
      BusinessReview[]
    >;
  } catch {
    return {};
  }
}

function saveAllReviews(
  reviews: Record<
    string,
    BusinessReview[]
  >
): void {
  if (
    typeof window === "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(reviews)
  );
}

function clampRating(
  rating: number
): number {
  return Math.max(
    MIN_RATING,
    Math.min(
      MAX_RATING,
      Math.round(rating * 10) / 10
    )
  );
}

function getSentiment(
  rating: number
): BusinessReviewSentiment {
  if (rating <= 1.5) {
    return "terrible";
  }

  if (rating <= 2.5) {
    return "poor";
  }

  if (rating <= 3.5) {
    return "average";
  }

  if (rating <= 4.5) {
    return "good";
  }

  return "excellent";
}

function getRandomItem<T>(
  items: T[]
): T {
  return items[
    Math.floor(
      Math.random() * items.length
    )
  ];
}

function generateReviewText(
  rating: number
): {
  title: string;
  comment: string;
} {
  if (rating >= 4) {
    return {
      title: getRandomItem(
        POSITIVE_TITLES
      ),
      comment: getRandomItem(
        POSITIVE_COMMENTS
      ),
    };
  }

  if (rating >= 3) {
    return {
      title: getRandomItem(
        NEUTRAL_TITLES
      ),
      comment: getRandomItem(
        NEUTRAL_COMMENTS
      ),
    };
  }

  return {
    title: getRandomItem(
      NEGATIVE_TITLES
    ),
    comment: getRandomItem(
      NEGATIVE_COMMENTS
    ),
  };
}

function calculateReputationScore(
  reviews: BusinessReview[]
): number {
  if (reviews.length === 0) {
    return 0;
  }

  const average =
    reviews.reduce(
      (total, review) =>
        total + review.rating,
      0
    ) / reviews.length;

  const reviewVolumeBonus =
    Math.min(
      20,
      reviews.length * 0.2
    );

  return Number(
    Math.min(
      100,
      average * 18 +
        reviewVolumeBonus
    ).toFixed(1)
  );
}

function calculatePopularityScore(
  reviews: BusinessReview[]
): number {
  if (reviews.length === 0) {
    return 0;
  }

  const average =
    reviews.reduce(
      (total, review) =>
        total + review.rating,
      0
    ) / reviews.length;

  const verifiedCount =
    reviews.filter(
      (review) =>
        review.verified
    ).length;

  const positiveCount =
    reviews.filter(
      (review) =>
        review.rating >= 4
    ).length;

  const volumeScore =
    Math.min(
      30,
      reviews.length * 0.5
    );

  const verifiedScore =
    Math.min(
      20,
      verifiedCount * 0.5
    );

  const positiveScore =
    reviews.length === 0
      ? 0
      : (positiveCount /
          reviews.length) *
        30;

  return Number(
    Math.min(
      100,
      average * 4 +
        volumeScore +
        verifiedScore +
        positiveScore
    ).toFixed(1)
  );
}

export function getBusinessReviews(
  businessId: string
): BusinessReview[] {
  const all =
    loadAllReviews();

  return all[businessId]
    ? [...all[businessId]].sort(
        (a, b) =>
          b.createdAt -
          a.createdAt
      )
    : [];
}

export function getBusinessReview(
  businessId: string,
  reviewId: string
): BusinessReview | null {
  return (
    getBusinessReviews(
      businessId
    ).find(
      (review) =>
        review.id ===
        reviewId
    ) ?? null
  );
}

export function getBusinessReviewCount(
  businessId: string
): number {
  return getBusinessReviews(
    businessId
  ).length;
}

export function getBusinessAverageRating(
  businessId: string
): number {
  const reviews =
    getBusinessReviews(
      businessId
    );

  if (reviews.length === 0) {
    return 0;
  }

  return Number(
    (
      reviews.reduce(
        (total, review) =>
          total +
          review.rating,
        0
      ) / reviews.length
    ).toFixed(2)
  );
}

export function getBusinessRatingStars(
  businessId: string
): string {
  const rating =
    getBusinessAverageRating(
      businessId
    );

  if (rating <= 0) {
    return "☆☆☆☆☆";
  }

  const fullStars =
    Math.floor(rating);

  const hasHalfStar =
    rating - fullStars >=
    0.5;

  let result =
    "★".repeat(
      fullStars
    );

  if (hasHalfStar) {
    result += "½";
  }

  const used =
    fullStars +
    (hasHalfStar ? 1 : 0);

  result +=
    "☆".repeat(
      Math.max(
        0,
        5 - used
      )
    );

  return result;
}

export function canSubmitBusinessReview(
  businessId: string,
  reviewerId: string
): {
  allowed: boolean;
  reason: string;
} {
  if (!businessId.trim()) {
    return {
      allowed: false,
      reason:
        "A business is required.",
    };
  }

  if (!reviewerId.trim()) {
    return {
      allowed: false,
      reason:
        "A reviewer is required.",
    };
  }

  const reviews =
    getBusinessReviews(
      businessId
    );

  const alreadyReviewed =
    reviews.some(
      (review) =>
        review.reviewerId ===
        reviewerId
    );

  if (alreadyReviewed) {
    return {
      allowed: false,
      reason:
        "You have already reviewed this business.",
    };
  }

  return {
    allowed: true,
    reason:
      "Review can be submitted.",
  };
}

export function submitBusinessReview(
  params: {
    businessId: string;
    reviewerId: string;
    reviewerName: string;
    source: BusinessReviewSource;
    rating: number;
    serviceScore?: number;
    valueScore?: number;
    qualityScore?: number;
    title?: string;
    comment?: string;
    verified?: boolean;
  }
): BusinessReviewResult {
  const check =
    canSubmitBusinessReview(
      params.businessId,
      params.reviewerId
    );

  if (!check.allowed) {
    return {
      success: false,
      review: null,
      message: check.reason,
    };
  }

  const rating =
    clampRating(
      params.rating
    );

  const generated =
    generateReviewText(
      rating
    );

  const review: BusinessReview =
    {
      id:
        `review-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,

      businessId:
        params.businessId,

      reviewerId:
        params.reviewerId,

      reviewerName:
        params.reviewerName ||
        "Anonymous Player",

      source:
        params.source,

      rating,

      sentiment:
        getSentiment(
          rating
        ),

      title:
        params.title?.trim() ||
        generated.title,

      comment:
        params.comment?.trim() ||
        generated.comment,

      serviceScore:
        clampRating(
          params.serviceScore ??
            rating
        ),

      valueScore:
        clampRating(
          params.valueScore ??
            rating
        ),

      qualityScore:
        clampRating(
          params.qualityScore ??
            rating
        ),

      createdAt:
        Date.now(),

      helpfulCount: 0,

      verified:
        Boolean(
          params.verified
        ),
    };

  const all =
    loadAllReviews();

  if (!all[params.businessId]) {
    all[params.businessId] =
      [];
  }

  all[
    params.businessId
  ].push(review);

  saveAllReviews(all);

  return {
    success: true,
    review,
    message:
      "Your business review has been submitted.",
  };
}

export function createAutomaticBusinessReview(
  params: {
    businessId: string;
    reviewerId: string;
    reviewerName: string;
    source: BusinessReviewSource;
    rating: number;
    verified?: boolean;
  }
): BusinessReviewResult {
  return submitBusinessReview({
    businessId:
      params.businessId,
    reviewerId:
      params.reviewerId,
    reviewerName:
      params.reviewerName,
    source:
      params.source,
    rating:
      params.rating,
    verified:
      params.verified ?? true,
  });
}

export function markReviewHelpful(
  businessId: string,
  reviewId: string
): BusinessReview | null {
  const all =
    loadAllReviews();

  const reviews =
    all[businessId];

  if (!reviews) {
    return null;
  }

  const review =
    reviews.find(
      (item) =>
        item.id ===
        reviewId
    );

  if (!review) {
    return null;
  }

  review.helpfulCount +=
    1;

  saveAllReviews(all);

  return review;
}

export function deleteBusinessReview(
  businessId: string,
  reviewId: string
): boolean {
  const all =
    loadAllReviews();

  const reviews =
    all[businessId];

  if (!reviews) {
    return false;
  }

  const originalLength =
    reviews.length;

  all[businessId] =
    reviews.filter(
      (review) =>
        review.id !==
        reviewId
    );

  saveAllReviews(all);

  return (
    all[businessId].length <
    originalLength
  );
}

export function getBusinessReviewsByRating(
  businessId: string,
  rating: number
): BusinessReview[] {
  return getBusinessReviews(
    businessId
  ).filter(
    (review) =>
      Math.round(
        review.rating
      ) ===
      Math.round(rating)
  );
}

export function getPositiveBusinessReviews(
  businessId: string
): BusinessReview[] {
  return getBusinessReviews(
    businessId
  ).filter(
    (review) =>
      review.rating >= 4
  );
}

export function getNegativeBusinessReviews(
  businessId: string
): BusinessReview[] {
  return getBusinessReviews(
    businessId
  ).filter(
    (review) =>
      review.rating <= 2
  );
}

export function getVerifiedBusinessReviews(
  businessId: string
): BusinessReview[] {
  return getBusinessReviews(
    businessId
  ).filter(
    (review) =>
      review.verified
  );
}

export function getRecentBusinessReviews(
  businessId: string,
  limit = 10
): BusinessReview[] {
  return getBusinessReviews(
    businessId
  ).slice(0, limit);
}

export function getBusinessReviewSummary(
  businessId: string
): BusinessReviewSummary {
  const reviews =
    getBusinessReviews(
      businessId
    );

  if (reviews.length === 0) {
    return {
      businessId,
      totalReviews: 0,
      averageRating: 0,
      serviceRating: 0,
      valueRating: 0,
      qualityRating: 0,
      positiveReviews: 0,
      neutralReviews: 0,
      negativeReviews: 0,
      verifiedReviews: 0,
      reputationScore: 0,
      popularityScore: 0,
    };
  }

  const averageRating =
    reviews.reduce(
      (total, review) =>
        total +
        review.rating,
      0
    ) / reviews.length;

  const serviceRating =
    reviews.reduce(
      (total, review) =>
        total +
        review.serviceScore,
      0
    ) / reviews.length;

  const valueRating =
    reviews.reduce(
      (total, review) =>
        total +
        review.valueScore,
      0
    ) / reviews.length;

  const qualityRating =
    reviews.reduce(
      (total, review) =>
        total +
        review.qualityScore,
      0
    ) / reviews.length;

  return {
    businessId,

    totalReviews:
      reviews.length,

    averageRating:
      Number(
        averageRating.toFixed(
          2
        )
      ),

    serviceRating:
      Number(
        serviceRating.toFixed(
          2
        )
      ),

    valueRating:
      Number(
        valueRating.toFixed(
          2
        )
      ),

    qualityRating:
      Number(
        qualityRating.toFixed(
          2
        )
      ),

    positiveReviews:
      reviews.filter(
        (review) =>
          review.rating >= 4
      ).length,

    neutralReviews:
      reviews.filter(
        (review) =>
          review.rating === 3
      ).length,

    negativeReviews:
      reviews.filter(
        (review) =>
          review.rating <= 2
      ).length,

    verifiedReviews:
      reviews.filter(
        (review) =>
          review.verified
      ).length,

    reputationScore:
      calculateReputationScore(
        reviews
      ),

    popularityScore:
      calculatePopularityScore(
        reviews
      ),
  };
}

export function getBusinessReputationFromReviews(
  businessId: string
): number {
  return getBusinessReviewSummary(
    businessId
  ).reputationScore;
}

export function getBusinessPopularityFromReviews(
  businessId: string
): number {
  return getBusinessReviewSummary(
    businessId
  ).popularityScore;
}

export function getBusinessRatingDistribution(
  businessId: string
): Record<
  1 | 2 | 3 | 4 | 5,
  number
> {
  const reviews =
    getBusinessReviews(
      businessId
    );

  return {
    1: reviews.filter(
      (review) =>
        Math.round(
          review.rating
        ) === 1
    ).length,

    2: reviews.filter(
      (review) =>
        Math.round(
          review.rating
        ) === 2
    ).length,

    3: reviews.filter(
      (review) =>
        Math.round(
          review.rating
        ) === 3
    ).length,

    4: reviews.filter(
      (review) =>
        Math.round(
          review.rating
        ) === 4
    ).length,

    5: reviews.filter(
      (review) =>
        Math.round(
          review.rating
        ) === 5
    ).length,
  };
}

export function getBusinessReviewTrend(
  businessId: string,
  days = 7
): {
  reviews: number;
  averageRating: number;
  positiveRate: number;
} {
  const cutoff =
    Date.now() -
    days *
      24 *
      60 *
      60 *
      1000;

  const reviews =
    getBusinessReviews(
      businessId
    ).filter(
      (review) =>
        review.createdAt >=
        cutoff
    );

  if (reviews.length === 0) {
    return {
      reviews: 0,
      averageRating: 0,
      positiveRate: 0,
    };
  }

  const averageRating =
    reviews.reduce(
      (total, review) =>
        total +
        review.rating,
      0
    ) / reviews.length;

  const positive =
    reviews.filter(
      (review) =>
        review.rating >= 4
    ).length;

  return {
    reviews:
      reviews.length,

    averageRating:
      Number(
        averageRating.toFixed(
          2
        )
      ),

    positiveRate:
      Number(
        (
          (positive /
            reviews.length) *
          100
        ).toFixed(1)
      ),
  };
}

export function getTopReviewedBusinesses(
  limit = 10
): Array<{
  businessId: string;
  reviews: number;
  rating: number;
  reputation: number;
}> {
  const all =
    loadAllReviews();

  return Object.keys(all)
    .map(
      (businessId) => {
        const summary =
          getBusinessReviewSummary(
            businessId
          );

        return {
          businessId,
          reviews:
            summary.totalReviews,
          rating:
            summary.averageRating,
          reputation:
            summary.reputationScore,
        };
      }
    )
    .sort(
      (a, b) =>
        b.rating -
          a.rating ||
        b.reviews -
          a.reviews
    )
    .slice(0, limit);
}

export function getMostPopularBusinesses(
  limit = 10
): Array<{
  businessId: string;
  popularity: number;
  rating: number;
  reviews: number;
}> {
  const all =
    loadAllReviews();

  return Object.keys(all)
    .map(
      (businessId) => {
        const summary =
          getBusinessReviewSummary(
            businessId
          );

        return {
          businessId,
          popularity:
            summary.popularityScore,
          rating:
            summary.averageRating,
          reviews:
            summary.totalReviews,
        };
      }
    )
    .sort(
      (a, b) =>
        b.popularity -
        a.popularity
    )
    .slice(0, limit);
}

export function getBusinessReviewSourceCounts(
  businessId: string
): Record<
  BusinessReviewSource,
  number
> {
  const reviews =
    getBusinessReviews(
      businessId
    );

  return {
    npc_customer:
      reviews.filter(
        (review) =>
          review.source ===
          "npc_customer"
      ).length,

    player_customer:
      reviews.filter(
        (review) =>
          review.source ===
          "player_customer"
      ).length,

    contract:
      reviews.filter(
        (review) =>
          review.source ===
          "contract"
      ).length,

    event:
      reviews.filter(
        (review) =>
          review.source ===
          "event"
      ).length,

    other:
      reviews.filter(
        (review) =>
          review.source ===
          "other"
      ).length,
  };
}

export function resetBusinessReviews(
  businessId: string
): void {
  const all =
    loadAllReviews();

  delete all[businessId];

  saveAllReviews(all);
}

export function resetAllBusinessReviews(): void {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.removeItem(
    STORAGE_KEY
  );
}
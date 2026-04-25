"use client";

import { useReferralTracker } from "../hooks/useReferralTracker";

type Props = {
  urlParam?: string;
};

export function ReferralTrackerProvider({ urlParam = "ref" }: Props) {
  useReferralTracker(urlParam);
  return null;
}

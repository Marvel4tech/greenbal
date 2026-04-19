import LeaderboardClient from "./LeaderboardClient";

export const metadata = {
  title: "Public Leaderboard",
  description:
    "View the Greenball360 public leaderboard and see how players rank on our free football prediction platform.",
  keywords: [
    "football leaderboard",
    "public leaderboard",
    "free football prediction leaderboard",
    "Greenball360 rankings",
  ],
  alternates: {
    canonical: "/leaderboard",
  },
  openGraph: {
    title: "Public Leaderboard | Greenball360",
    description:
      "Check the latest rankings on the Greenball360 public leaderboard.",
    url: "https://www.greenball360.com/leaderboard",
  },
};

export default function Page() {
  return <LeaderboardClient />;
}
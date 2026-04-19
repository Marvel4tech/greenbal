import HomeClient from "./HomeClient";

export const metadata = {
  title: "Free Football Prediction Platform",
  description:
    "Greenball360 is a free football prediction platform where users can predict match scores, compete on the weekly leaderboard, get rewarded, and follow football news.",
  keywords: [
    "free football prediction platform",
    "predict football scores",
    "football prediction website",
    "free football prediction game",
    "football leaderboard",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Greenball360 | Free Football Prediction Platform",
    description:
      "Predict football scores for free, compete on the weekly leaderboard, get rewarded, and follow the latest football updates on Greenball360.",
    url: "https://www.greenball360.com",
  },
};

export default function Page() {
  return <HomeClient />;
}
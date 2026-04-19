import LogInClient from "./LogInClient";

export const metadata = {
  title: "Sign In",
  description:
    "Sign in to your Greenball360 account and continue using our free football prediction platform.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <LogInClient />;
}
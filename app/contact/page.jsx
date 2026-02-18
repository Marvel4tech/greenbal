import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail, MapPin, Clock, Phone, ArrowRight, ShieldCheck } from "lucide-react"
import Navbar from "@/components/Navbar"

const Page = () => {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* Header */}
      <section className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black/40">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5 px-3 py-1 text-xs text-gray-700 dark:text-gray-200">
            <ShieldCheck className="w-4 h-4 text-primary" />
            We respond as fast as possible
          </div>

          <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Contact us
          </h1>

          <p className="mt-3 max-w-2xl text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
            Need help with your account, predictions, verification emails, or payouts?
            Send us a message and we’ll get back to you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact card */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black/50 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Reach Sportscash18
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              We’re based in <span className="font-semibold">South London</span>. For the fastest help,
              email us with your username + a short description of the issue.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Email</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <a className="hover:underline" href="mailto:support@greenball360.com">
                      support@greenball360.com
                    </a>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Include your username for quicker support.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Location</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">South London, United Kingdom</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Support hours</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Mon – Sun • 9:00am – 9:00pm (UK time)</p>
                </div>
              </div>

              {/* Optional phone placeholder (remove if you don’t want it) */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Phone</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">—</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    We currently handle most support via email.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Button asChild className="gap-2">
                <a href="mailto:support@greenball360.com?subject=Sportscash18%20Support%20Request">
                  Email support <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link href="/about">Read about us</Link>
              </Button>
            </div>
          </div>

          {/* FAQ / quick help */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black/50 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Quick help
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Before you message us, these solve most issues:
            </p>

            <div className="mt-6 space-y-4">
              <FAQ
                q="I didn’t receive a verification email."
                a="Check Spam/Promotions. If it’s still missing, try signing in again to resend, or email support with your email address."
              />
              <FAQ
                q="My prediction didn’t count."
                a="Predictions lock at kickoff. If you submitted after kickoff, the game is closed and won’t accept changes."
              />
              <FAQ
                q="Leaderboard points look wrong."
                a="Leaderboards update after admins publish final results. If it’s still wrong after a result update, contact support with the match + your prediction."
              />
              <FAQ
                q="How do weekly resets work?"
                a="The weekly leaderboard runs Tuesday → Monday (UTC). A new week starts every Tuesday."
              />
            </div>

            <div className="mt-7 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5 p-4">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Tip: When you contact support, include your <span className="font-semibold">username</span>,
                the <span className="font-semibold">game</span> (or match time), and what you expected to happen.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Page

function FAQ({ q, a }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5 p-4">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{q}</p>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{a}</p>
    </div>
  )
}

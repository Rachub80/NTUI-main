import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function ContactPage() {
  return (
    <div className="overflow-x-hidden bg-black text-white">
      <Navbar />
      <section className="bg-black py-20 sm:py-28">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">
              Contact Us
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Let’s build an accessible future together
            </h1>
            <p className="mt-4 text-base text-white/70">
              Tell us about your accessibility goals, your product, or your demo
              needs. We’ll respond within 24 hours with a tailored plan.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
              <h2 className="text-xl font-semibold">Send a message</h2>
              <form className="mt-6 space-y-4">
                <div>
                  <label className="text-sm text-white/70" htmlFor="name">
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Jane Lee"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70" htmlFor="email">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="jane@studio.com"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70" htmlFor="intent">
                    What do you need help with?
                  </label>
                  <select
                    id="intent"
                    name="intent"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none"
                  >
                    <option>Accessibility audit</option>
                    <option>Product demo</option>
                    <option>Custom integration</option>
                    <option>Partnership</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/70" htmlFor="message">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Tell us about your goals, constraints, and timeline."
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Send message
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1b1230] via-black to-black p-6">
                <h3 className="text-lg font-semibold">Contact details</h3>
                <div className="mt-4 space-y-3 text-sm text-white/70">
                  <p>hello@intuition.ai</p>
                  <p>+1 (415) 555-0192</p>
                  <p>San Francisco, CA</p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold">What happens next</h3>
                <ul className="mt-4 space-y-3 text-sm text-white/70">
                  <li>We review your message and accessibility needs.</li>
                  <li>We schedule a 30-minute discovery call.</li>
                  <li>We prepare a tailored demo plan for your team.</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6">
                <p className="text-sm text-emerald-200">
                  Prefer email? Send a note and we’ll reply with a detailed
                  accessibility checklist.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

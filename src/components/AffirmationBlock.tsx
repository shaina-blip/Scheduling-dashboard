import { Sparkle } from "lucide-react";

// Calm & grounding — one settles in for the day, rotates daily.
const AFFIRMATIONS = [
  "One thing at a time. You have everything you need for today.",
  "You don't have to do it all at once. You just have to begin.",
  "Breathe. The work will meet you where you are.",
  "Progress, not perfection. Today is enough.",
  "You've handled every hard day so far. Today is no different.",
  "Slow is steady, and steady is strong.",
  "What matters most will get done. The rest can wait.",
  "You're allowed to move at a pace that feels human.",
  "Calm is a superpower. Lead from it.",
  "Trust the systems you've built — let them carry some of the weight.",
  "Your presence is the most valuable thing you bring today.",
  "Take the next right step. That's all today asks of you.",
  "You are grounded, capable, and exactly where you need to be.",
  "Let today be focused, not frantic.",
];

function affirmationFor(date: Date): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
}

export default function AffirmationBlock({ date }: { date: Date }) {
  const text = affirmationFor(date);
  return (
    <section className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-wild-green/10 px-6 py-7 shadow-soft">
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-brand-100/50 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 left-12 h-24 w-24 rounded-full bg-wild-green/10 blur-2xl" />
      {/* a little constellation — twinkles scattered like stars */}
      <Sparkle className="pointer-events-none absolute right-8 top-5 h-3 w-3 text-brand-300/70" />
      <Sparkle className="pointer-events-none absolute right-20 top-10 h-2 w-2 text-wild-gold/70" />
      <Sparkle className="pointer-events-none absolute right-14 bottom-6 h-2.5 w-2.5 text-wild-plum/50" />
      <div className="relative flex items-start gap-3">
        <Sparkle className="mt-1 h-5 w-5 shrink-0 text-brand-400" />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-brand-400">
            Today&apos;s intention
          </p>
          <p className="font-display mt-1.5 text-xl leading-relaxed text-stone-800 sm:text-2xl">
            {text}
          </p>
        </div>
      </div>
    </section>
  );
}

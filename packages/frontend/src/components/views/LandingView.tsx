import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavigationTab } from '../../types';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Zap,
  User,
  Briefcase,
  Bot,
  Activity,
  Apple,
  HeartPulse,
  Moon,
  Droplets,
  Dumbbell,
  LineChart,
  Star,
  Quote,
  PlayCircle,
  ChevronDown,
} from 'lucide-react';

interface LandingViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  onOpenAuthModal: () => void;
}

/* ------------------------------------------------------------------ */
/* Motion + imagery primitives                                         */
/* ------------------------------------------------------------------ */

const LANDING_CSS = `
/* The hero and CTA band bleed past the centred <main> container. Clip (not
   hidden) keeps position:sticky on the navbar working. */
body { overflow-x: clip; }

@keyframes hlRise      { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
@keyframes hlRiseWord  { from { opacity: 0; transform: translateY(90%) rotate(3deg); } to { opacity: 1; transform: none; } }
@keyframes hlFloat     { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes hlFloatSlow { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
@keyframes hlKenBurns  { 0% { transform: scale(1.04); } 100% { transform: scale(1.16); } }
@keyframes hlMarquee   { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes hlSheen     { 0% { transform: translateX(-130%) skewX(-18deg); } 55%, 100% { transform: translateX(260%) skewX(-18deg); } }
@keyframes hlPulseRing { 0% { transform: scale(.86); opacity: .55; } 70% { transform: scale(1.5); opacity: 0; } 100% { opacity: 0; } }
@keyframes hlBlobDrift { 0%,100% { transform: translate3d(0,0,0) scale(1); } 33% { transform: translate3d(22px,-26px,0) scale(1.07); } 66% { transform: translate3d(-18px,18px,0) scale(.95); } }
@keyframes hlScrollHint{ 0%,100% { transform: translateY(0); opacity: .55; } 50% { transform: translateY(6px); opacity: 1; } }
@keyframes hlTypeDot   { 0%, 60%, 100% { transform: translateY(0); opacity: .45; } 30% { transform: translateY(-4px); opacity: 1; } }

.hl-reveal        { opacity: 0; transform: translateY(28px); transition: opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1); will-change: opacity, transform; }
.hl-reveal-left   { transform: translateX(-32px); }
.hl-reveal-right  { transform: translateX(32px); }
.hl-reveal-scale  { transform: translateY(20px) scale(.96); }
.hl-reveal.is-in  { opacity: 1; transform: none; }

.hl-word { display: inline-block; animation: hlRiseWord .85s cubic-bezier(.22,1,.36,1) both; }
.hl-word-mask { display: inline-block; overflow: hidden; vertical-align: bottom; padding-bottom: .08em; }

.hl-float      { animation: hlFloat 6s ease-in-out infinite; }
.hl-float-slow { animation: hlFloatSlow 9s ease-in-out infinite; }
.hl-blob       { animation: hlBlobDrift 18s ease-in-out infinite; }

.hl-kb img { animation: hlKenBurns 18s ease-in-out infinite alternate; }

.hl-shot {
  position: relative; overflow: hidden;
  transition: transform .7s cubic-bezier(.22,1,.36,1), box-shadow .7s cubic-bezier(.22,1,.36,1);
}
.hl-shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hl-shot::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(180deg, rgba(44,36,32,0) 38%, rgba(44,36,32,.62) 100%);
}
.hl-shot-plain::after { display: none; }

.hl-tilt { transition: transform .8s cubic-bezier(.22,1,.36,1), box-shadow .8s cubic-bezier(.22,1,.36,1); }
.hl-tilt:hover { transform: translateY(-8px) scale(1.012); box-shadow: var(--hl-shadow-xl); }

.hl-zoom img { transition: transform 1.1s cubic-bezier(.22,1,.36,1), filter .7s ease; }
.hl-zoom:hover img { transform: scale(1.08); }

.hl-sheen { position: relative; overflow: hidden; isolation: isolate; }
.hl-sheen::after {
  content: ''; position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.42), transparent);
  transform: translateX(-130%) skewX(-18deg);
}
.hl-sheen:hover::after { animation: hlSheen 1s ease-out; }

.hl-cta-lift { transition: transform .4s cubic-bezier(.22,1,.36,1), box-shadow .4s ease; }
.hl-cta-lift:hover { transform: translateY(-2px); }
.hl-cta-lift:active { transform: translateY(0) scale(.985); }
.hl-arrow { transition: transform .4s cubic-bezier(.22,1,.36,1); }
.hl-cta-lift:hover .hl-arrow { transform: translateX(4px); }

.hl-marquee { display: flex; width: max-content; animation: hlMarquee 34s linear infinite; }
.hl-marquee-wrap:hover .hl-marquee { animation-play-state: paused; }

.hl-underline { position: relative; display: inline-block; }
.hl-underline::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -2px; height: 6px; border-radius: 6px;
  background: var(--hl-green-medium); opacity: .28; transform: scaleX(0); transform-origin: left;
  transition: transform .9s cubic-bezier(.22,1,.36,1) .25s;
}
.is-in .hl-underline::after, .hl-reveal.is-in.hl-underline::after { transform: scaleX(1); }

.hl-step-line { transform-origin: top; transform: scaleY(0); transition: transform 1.3s cubic-bezier(.22,1,.36,1); }
.is-in .hl-step-line { transform: scaleY(1); }

.hl-dot-ring { position: absolute; inset: -6px; border-radius: 999px; border: 2px solid var(--hl-green); animation: hlPulseRing 2.6s ease-out infinite; }

.hl-scroll-hint { animation: hlScrollHint 2s ease-in-out infinite; }

.hl-type-dot { animation: hlTypeDot 1.1s ease-in-out infinite; }

.hl-plan-row { transition: background .35s ease, transform .35s cubic-bezier(.22,1,.36,1); }
.hl-plan-row:hover { transform: translateX(3px); }

@media (prefers-reduced-motion: reduce) {
  .hl-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  .hl-word, .hl-float, .hl-float-slow, .hl-blob, .hl-kb img, .hl-marquee,
  .hl-dot-ring, .hl-scroll-hint, .hl-type-dot { animation: none !important; }
  .hl-sheen:hover::after { animation: none !important; }
  .hl-underline::after, .hl-step-line { transform: none !important; }
}
`;

const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    if (mq.addEventListener) {
      mq.addEventListener('change', sync);
      return () => mq.removeEventListener('change', sync);
    }
    mq.addListener(sync);
    return () => mq.removeListener(sync);
  }, []);
  return reduced;
};

/**
 * Translates an element against the scroll direction while it is on screen.
 * Writes straight to the node inside a rAF so scrolling never triggers a render.
 */
const useParallax = (strength: number, scale = 1, enabled = true) => {
  const ref = useRef<any>(null);
  useEffect(() => {
    const el = ref.current as HTMLElement | null;
    if (!el) return;
    if (!enabled) {
      el.style.transform = '';
      return;
    }
    let raf = 0;
    let visible = true;

    const apply = () => {
      raf = 0;
      if (!visible) return;
      const rect = el.getBoundingClientRect();
      const fromCentre = rect.top + rect.height / 2 - window.innerHeight / 2;
      const shift = -fromCentre * strength;
      el.style.transform = 'translate3d(0,' + shift.toFixed(2) + 'px,0) scale(' + scale + ')';
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };

    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        visible = entries[0].isIntersecting;
        if (visible) onScroll();
      },
      { rootMargin: '240px 0px' }
    );
    io.observe(el);

    el.style.willChange = 'transform';
    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength, scale, enabled]);
  return ref;
};

/** Adds `is-in` once the node scrolls into view (one-shot). */
const useInView = (threshold = 0.18) => {
  const ref = useRef<any>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current as HTMLElement | null;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        if (entries[0].isIntersecting) { setInView(true); io.disconnect(); }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
};

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  variant?: 'up' | 'left' | 'right' | 'scale';
  className?: string;
  as?: any;
}

const Reveal: React.FC<RevealProps> = ({ children, delay = 0, variant = 'up', className = '', as: Tag = 'div' }) => {
  const [ref, inView] = useInView();
  const variantClass =
    variant === 'left' ? 'hl-reveal-left'
      : variant === 'right' ? 'hl-reveal-right'
        : variant === 'scale' ? 'hl-reveal-scale'
          : '';
  return (
    <Tag
      ref={ref}
      className={'hl-reveal ' + variantClass + (inView ? ' is-in' : '') + ' ' + className}
      style={{ transitionDelay: delay + 'ms' }}
    >
      {children}
    </Tag>
  );
};

/**
 * Remote photography with a graceful fallback: if the CDN image fails we swap in
 * a brand gradient rather than showing a broken-image frame.
 */
interface PhotoProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  eager?: boolean;
  fallback?: string;
}

const Photo: React.FC<PhotoProps> = ({ src, alt, className = '', eager = false, fallback = 'var(--hl-gradient-hero)' }) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div
        className={className}
        role="img"
        aria-label={alt}
        style={{ background: fallback, width: '100%', height: '100%' }}
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={className}
      style={{
        opacity: loaded ? 1 : 0,
        filter: loaded ? 'none' : 'blur(14px)',
        transition: 'opacity .8s ease, filter .8s ease, transform 1.1s cubic-bezier(.22,1,.36,1)',
      }}
    />
  );
};

/** Animated number that counts up the first time its stat card is seen. */
const CountUp: React.FC<{ value: string; run: boolean; duration?: number }> = ({ value, run, duration = 1700 }) => {
  const [text, setText] = useState(value);
  const parsed = value.match(/^([^0-9]*)([0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/);

  useEffect(() => {
    if (!parsed) { setText(value); return; }
    const prefix = parsed[1];
    const rawNumber = parsed[2];
    const suffix = parsed[3];
    const target = parseFloat(rawNumber.replace(/,/g, ''));
    const decimals = rawNumber.includes('.') ? rawNumber.split('.')[1].length : 0;
    const grouped = rawNumber.includes(',');

    if (!run || !isFinite(target)) {
      setText(prefix + (run ? rawNumber : (decimals ? (0).toFixed(decimals) : '0')) + suffix);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = target * eased;
      const shown = decimals
        ? current.toFixed(decimals)
        : grouped
          ? Math.round(current).toLocaleString('en-US')
          : String(Math.round(current));
      setText(prefix + shown + suffix);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, value, duration]);

  return <>{text}</>;
};

/* ------------------------------------------------------------------ */
/* Imagery — Unsplash CDN                                              */
/* ------------------------------------------------------------------ */

const U = (id: string, w: number) =>
  'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&q=80&w=' + w;

const IMG = {
  heroPrimary: U('1571019613454-1cb2f99b2d8b', 1100),   // strength training
  heroNutrition: U('1512621776951-a57141f2eefd', 700),  // fresh bowl
  heroYoga: U('1544367567-0f2fcb009e0b', 700),          // yoga / mobility
  featureTraining: U('1517836357463-d25dfeac3438', 1000),
  featureNutrition: U('1490645935967-10de6ba17061', 1000),
  featureRecovery: U('1506126613408-eca07ce68773', 1000),
  roleMember: U('1594381898411-846e7d193883', 900),
  roleCoach: U('1552674605-db6ffd4facb5', 900),
  roleAi: U('1534438327276-14e5300c3a48', 900),
  stepsTall: U('1518611012118-696072aa579a', 900),
  ctaBand: U('1599058917765-a780eda07a3e', 1600),
  avatarA: U('1494790108377-be9c29b29330', 200),
  avatarB: U('1507003211169-0a1dd7228f2d', 200),
  avatarC: U('1438761681033-6461ffad8d80', 200),
};

const HEADLINE_LINE_TWO = ['Empowered', 'by', 'HealthyLife', 'AI.'];

/* ------------------------------------------------------------------ */
/* View                                                                */
/* ------------------------------------------------------------------ */

export const LandingView: React.FC<LandingViewProps> = ({ onSelectTab, onOpenAuthModal }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [heroPrompt, setHeroPrompt] = useState('Create a 15-min Ovulation Peak energizing workout');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const reduced = usePrefersReducedMotion();

  const heroRef = useRef<any>(null);
  const heroGlowRef = useParallax(0.06, 1, !reduced);
  const heroArtRef = useParallax(0.05, 1, !reduced);
  const stepsImageRef = useParallax(0.10, 1.14, !reduced);
  const ctaBandRef = useParallax(0.12, 1.2, !reduced);

  const [statsRef, statsInView] = useInView(0.3);

  const handleTestGroqAI = async () => {
    if (!heroPrompt.trim() || isAiLoading) return;
    setIsAiLoading(true);
    // This is a public, unauthenticated marketing demo — it intentionally does not call the
    // real (auth-protected) /ai/chat backend endpoint to avoid an open, unmetered AI proxy.
    // Sign up to try the real AI assistant (AIAssistantView) against your own data.
    setTimeout(() => {
      setAiResponse(
        "Sign up free to get this generated live: HealthyLife AI will build a personalized workout & meal plan from your cycle phase, goals, and preferences."
      );
      setIsAiLoading(false);
    }, 600);
  };

  /* Pointer parallax for the hero art — written as CSS vars, no re-render. */
  const handleHeroPointer = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = heroRef.current as HTMLElement | null;
    if (!el || reduced) return;
    const rect = el.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width - 0.5;
    const my = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty('--hl-mx', mx.toFixed(3));
    el.style.setProperty('--hl-my', my.toFixed(3));
  }, [reduced]);

  const handleHeroLeave = useCallback(() => {
    const el = heroRef.current as HTMLElement | null;
    if (!el) return;
    el.style.setProperty('--hl-mx', '0');
    el.style.setProperty('--hl-my', '0');
  }, []);

  const bleed: React.CSSProperties = { marginInline: 'calc(50% - 50vw)' };

  const stats = [
    { label: 'Active Members in BD', value: '14,280+', icon: User },
    { label: 'AI Bio-Plans Generated', value: '142,980+', icon: Bot },
    { label: 'CycleSync™ Accuracy', value: '99.4%', icon: HeartPulse },
    { label: 'Certified Local Coaches', value: '184+', icon: Briefcase },
  ];

  const marqueeItems = [
    { icon: Activity, label: 'Adaptive Training Load' },
    { icon: Apple, label: 'Macro-Aware Meal Plans' },
    { icon: HeartPulse, label: 'CycleSync™ Phase Engine' },
    { icon: Droplets, label: 'Hydration Intelligence' },
    { icon: Moon, label: 'Recovery & Sleep Scoring' },
    { icon: Dumbbell, label: 'Progressive Overload Logs' },
    { icon: LineChart, label: 'Coach Compliance Analytics' },
  ];

  const steps = [
    {
      n: '01',
      title: 'Tell us your baseline',
      body: 'Two minutes of onboarding — goals, cycle history, dietary preferences, training age and available equipment.',
      icon: User,
    },
    {
      n: '02',
      title: 'AI builds your week',
      body: 'HealthyLife AI maps training load and macros onto your current hormonal phase, then schedules the whole week.',
      icon: Bot,
    },
    {
      n: '03',
      title: 'Adapt with a real coach',
      body: 'Log sessions, meals and water. Your certified coach sees compliance live and tunes the plan with you.',
      icon: Briefcase,
    },
  ];

  const testimonials = [
    {
      quote: 'The phase-aware programming is the first thing that actually matched how my energy moves through the month. I stopped fighting my own body.',
      name: 'Nusrat Jahan',
      role: 'Vitality Plus member · Dhaka',
      avatar: IMG.avatarA,
    },
    {
      quote: 'I manage 40 clients from the coach studio. Compliance stats and the AI plan builder cut my weekly admin from nine hours to about two.',
      name: 'Tanvir Ahmed',
      role: 'Certified strength coach · Chattogram',
      avatar: IMG.avatarB,
    },
    {
      quote: 'Meal generation that understands local food is the reason I stayed. It plans around rice, dal and fish instead of ignoring them.',
      name: 'Farhana Islam',
      role: 'Vitality Plus member · Sylhet',
      avatar: IMG.avatarC,
    },
  ];

  return (
    <div className="pb-20">
      <style>{LANDING_CSS}</style>

      {/* ============================= HERO ============================= */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroPointer}
        onMouseLeave={handleHeroLeave}
        className="relative isolate overflow-hidden"
        style={{
          ...bleed,
          background: 'linear-gradient(168deg, var(--hl-green-light) 0%, var(--hl-surface) 52%, var(--hl-bg) 100%)',
        }}
      >
        {/* Ambient drifting blobs */}
        <div ref={heroGlowRef} className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="hl-blob absolute -top-24 left-[12%] w-[520px] h-[420px] rounded-full blur-[120px]"
            style={{ background: 'var(--hl-green-medium)', opacity: 0.26 }}
          />
          <div
            className="hl-blob absolute top-[38%] right-[4%] w-[440px] h-[380px] rounded-full blur-[130px]"
            style={{ background: 'var(--hl-teal-medium)', opacity: 0.22, animationDelay: '-6s' }}
          />
          <div
            className="hl-blob absolute bottom-[-10%] left-[38%] w-[380px] h-[320px] rounded-full blur-[120px]"
            style={{ background: 'var(--hl-peach-medium)', opacity: 0.18, animationDelay: '-11s' }}
          />
        </div>

        {/* Fine grid texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(var(--hl-border) 1px, transparent 1px), linear-gradient(90deg, var(--hl-border) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            opacity: 0.35,
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 20%, transparent 78%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, #000 20%, transparent 78%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 lg:pt-20 lg:pb-28">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-10 items-center">

            {/* ---------------- Hero copy ---------------- */}
            <div className="space-y-7 text-center lg:text-left">
              <Reveal>
                <div className="hl-badge hl-badge-green inline-flex items-center gap-2 text-[11px] normal-case tracking-normal font-extrabold px-4 py-1.5 shadow-sm">
                  <span className="relative flex w-2 h-2" aria-hidden="true">
                    <span className="hl-dot-ring" />
                    <span className="w-2 h-2 rounded-full" style={{ background: 'var(--hl-green)' }} />
                  </span>
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Organic Tech &amp; Bio-Hormonal Sync Ecosystem</span>
                </div>
              </Reveal>

              <h1
                className="text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-[4.25rem] font-black tracking-tight"
                style={{ color: 'var(--hl-text-primary)' }}
              >
                <span className="hl-word-mask">
                  <span className="hl-word" style={{ animationDelay: '80ms' }}>Your&nbsp;Health</span>
                </span>{' '}
                <span className="hl-word-mask">
                  <span className="hl-word" style={{ animationDelay: '170ms' }}>&amp;&nbsp;Fitness,</span>
                </span>
                <br className="hidden sm:inline" />
                <span className="hl-gradient-text">
                  {HEADLINE_LINE_TWO.map((word, i) => (
                    <span className="hl-word-mask" key={word + i}>
                      <span className="hl-word" style={{ animationDelay: 260 + i * 90 + 'ms' }}>{word}</span>
                      {i < HEADLINE_LINE_TWO.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </span>
              </h1>

              <Reveal delay={120}>
                <p
                  className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg leading-relaxed"
                  style={{ color: 'var(--hl-text-secondary)' }}
                >
                  Harmonize workouts, AI nutrition, and hormonal cycle intelligence in one unified
                  workspace for <span className="hl-underline font-semibold" style={{ color: 'var(--hl-text-primary)' }}>Members and Coaches</span>.
                </p>
              </Reveal>

              {/* Action CTAs */}
              <Reveal delay={200}>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-1">
                  <button
                    onClick={() => onSelectTab('signup')}
                    className="hl-btn-primary hl-cta-lift hl-sheen w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-sm"
                    style={{ boxShadow: '0 12px 30px rgba(61,122,90,.28)' }}
                  >
                    <span>Get Started as Member</span>
                    <ArrowRight className="hl-arrow w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                  </button>

                  <button
                    onClick={onOpenAuthModal}
                    className="hl-btn-ghost hl-cta-lift w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-sm"
                    style={{ background: 'var(--hl-surface)', boxShadow: 'var(--hl-shadow-sm)' }}
                  >
                    <ShieldCheck className="w-4 h-4" style={{ color: 'var(--hl-green)' }} aria-hidden="true" />
                    <span>Sign In</span>
                  </button>
                </div>
              </Reveal>

              <Reveal delay={260}>
                <div
                  className="flex items-center justify-center lg:justify-start gap-3 pt-1 text-xs"
                  style={{ color: 'var(--hl-text-tertiary)' }}
                >
                  <div className="flex -space-x-2">
                    {[IMG.avatarA, IMG.avatarB, IMG.avatarC].map((src, i) => (
                      <span
                        key={i}
                        className="w-7 h-7 rounded-full overflow-hidden border-2"
                        style={{ borderColor: 'var(--hl-surface)' }}
                      >
                        <Photo src={src} alt="" className="w-full h-full object-cover" />
                      </span>
                    ))}
                  </div>
                  <span className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: 'var(--hl-amber)' }} aria-hidden="true" />
                    ))}
                  </span>
                  <span className="font-semibold">4.9 from 2,100+ members</span>
                </div>
              </Reveal>

              {/* Live AI Sandbox */}
              <Reveal delay={320}>
                <div
                  className="hl-card hl-tilt max-w-xl mx-auto lg:mx-0 mt-4 p-4 sm:p-5 text-left space-y-3"
                  style={{ borderColor: 'var(--hl-green-border)', boxShadow: 'var(--hl-shadow-lg)' }}
                >
                  <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--hl-text-secondary)' }}>
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--hl-green)' }}>
                      <Bot className="w-4 h-4" aria-hidden="true" />
                      <span>Test Drive HealthyLife AI Health Advisor</span>
                    </span>
                    <span className="hl-badge hl-badge-green text-[10px] normal-case tracking-normal font-mono">
                      Llama-3.3-70b
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <label htmlFor="hero-ai-prompt" className="sr-only">Ask HealthyLife AI anything</label>
                    <input
                      id="hero-ai-prompt"
                      type="text"
                      value={heroPrompt}
                      onChange={(e) => setHeroPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleTestGroqAI(); }}
                      placeholder="Ask HealthyLife AI anything..."
                      className="flex-1 min-w-0 px-4 py-2.5 rounded-xl text-xs focus:ring-2 focus:outline-none"
                      style={{
                        background: 'var(--hl-surface-alt)',
                        border: '1px solid var(--hl-border)',
                        color: 'var(--hl-text-primary)',
                        transition: 'border-color .3s ease, box-shadow .3s ease',
                      }}
                      onFocus={e => {
                        const t = e.currentTarget as HTMLElement;
                        t.style.borderColor = 'var(--hl-green)';
                        t.style.boxShadow = '0 0 0 4px var(--hl-green-light)';
                      }}
                      onBlur={e => {
                        const t = e.currentTarget as HTMLElement;
                        t.style.borderColor = 'var(--hl-border)';
                        t.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      onClick={handleTestGroqAI}
                      disabled={isAiLoading}
                      className="hl-btn-primary hl-cta-lift px-4 py-2.5 text-xs flex items-center gap-1.5 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{isAiLoading ? 'Thinking...' : 'Generate'}</span>
                    </button>
                  </div>

                  {isAiLoading && (
                    <div className="flex items-center gap-1.5 px-1" aria-hidden="true">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="hl-type-dot w-1.5 h-1.5 rounded-full"
                          style={{ background: 'var(--hl-green-medium)', animationDelay: i * 0.16 + 's' }}
                        />
                      ))}
                    </div>
                  )}

                  {aiResponse && (
                    <div
                      className="p-3.5 rounded-2xl text-xs max-h-48 overflow-y-auto whitespace-pre-line font-sans leading-relaxed animate-fade-slide-up"
                      style={{ background: 'var(--hl-green-light)', border: '1px solid var(--hl-green-border)', color: 'var(--hl-text-primary)' }}
                      role="status"
                    >
                      {aiResponse}
                    </div>
                  )}
                </div>
              </Reveal>
            </div>

            {/* ---------------- Hero art collage ---------------- */}
            <div ref={heroArtRef} className="relative">
              <div
                className="relative mx-auto max-w-[30rem] lg:max-w-none"
                style={{
                  transform: 'translate3d(calc(var(--hl-mx, 0) * 16px), calc(var(--hl-my, 0) * 16px), 0)',
                  transition: 'transform .9s cubic-bezier(.22,1,.36,1)',
                }}
              >
                {/* Primary shot */}
                <Reveal variant="scale">
                  <div
                    className="hl-shot hl-kb hl-zoom rounded-[2rem] aspect-[4/5] sm:aspect-[5/6]"
                    style={{ boxShadow: 'var(--hl-shadow-xl)', border: '1px solid var(--hl-border)' }}
                  >
                    <Photo src={IMG.heroPrimary} alt="Member training with dumbbells" eager />
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 z-[1]">
                      <p className="text-white text-xs font-bold uppercase tracking-[0.18em] opacity-80">Today · Ovulation peak</p>
                      <p className="text-white text-lg sm:text-xl font-black leading-snug mt-1">
                        Strength block, 42 min
                      </p>
                      <div className="mt-3 h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.25)' }}>
                        <span
                          className="block h-full rounded-full"
                          style={{ width: '72%', background: 'var(--hl-gradient-peach)' }}
                        />
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* Floating nutrition card */}
                <div
                  className="hl-float absolute -left-4 sm:-left-10 top-[14%] w-40 sm:w-48"
                  style={{ transform: 'translate3d(calc(var(--hl-mx, 0) * -26px), calc(var(--hl-my, 0) * -22px), 0)' }}
                >
                  <Reveal variant="left" delay={200}>
                    <div
                      className="rounded-2xl overflow-hidden"
                      style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', boxShadow: 'var(--hl-shadow-lg)' }}
                    >
                      <div className="hl-shot hl-shot-plain h-20">
                        <Photo src={IMG.heroNutrition} alt="Fresh nutrient-dense bowl" />
                      </div>
                      <div className="p-3 space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--hl-text-tertiary)' }}>
                          Macros left
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black" style={{ color: 'var(--hl-text-primary)' }}>612</span>
                          <span className="text-[10px] font-bold" style={{ color: 'var(--hl-text-tertiary)' }}>kcal</span>
                        </div>
                        <div className="flex gap-1">
                          {[
                            { w: '48%', c: 'var(--hl-green)' },
                            { w: '30%', c: 'var(--hl-peach)' },
                            { w: '22%', c: 'var(--hl-teal)' },
                          ].map((seg, i) => (
                            <span key={i} className="h-1.5 rounded-full" style={{ width: seg.w, background: seg.c }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                </div>

                {/* Floating cycle card */}
                <div
                  className="hl-float-slow absolute -right-3 sm:-right-8 bottom-[10%] w-44 sm:w-52"
                  style={{ transform: 'translate3d(calc(var(--hl-mx, 0) * 30px), calc(var(--hl-my, 0) * 24px), 0)' }}
                >
                  <Reveal variant="right" delay={320}>
                    <div
                      className="rounded-2xl p-3.5 space-y-2.5"
                      style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', boxShadow: 'var(--hl-shadow-lg)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: 'var(--hl-lavender-light)', color: 'var(--hl-lavender)' }}
                        >
                          <HeartPulse className="w-4 h-4" aria-hidden="true" />
                        </span>
                        <div className="leading-tight">
                          <p className="text-[10px] font-bold" style={{ color: 'var(--hl-text-tertiary)' }}>CycleSync™</p>
                          <p className="text-xs font-black" style={{ color: 'var(--hl-text-primary)' }}>Day 14 · Peak</p>
                        </div>
                      </div>
                      <div className="flex items-end gap-1 h-10" aria-hidden="true">
                        {[34, 46, 60, 74, 88, 96, 78, 58, 44, 36].map((h, i) => (
                          <span
                            key={i}
                            className="flex-1 rounded-t-sm"
                            style={{
                              height: h + '%',
                              background: i === 5 ? 'var(--hl-lavender)' : 'var(--hl-lavender-border)',
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] leading-snug" style={{ color: 'var(--hl-text-secondary)' }}>
                        Energy high — heavy lifts &amp; higher carbs recommended.
                      </p>
                    </div>
                  </Reveal>
                </div>

                {/* Small mobility chip */}
                <div
                  className="hl-float absolute right-[12%] -top-5 hidden sm:block"
                  style={{ animationDelay: '-3s', transform: 'translate3d(calc(var(--hl-mx, 0) * 22px), calc(var(--hl-my, 0) * -18px), 0)' }}
                >
                  <Reveal delay={420}>
                    <div
                      className="flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full"
                      style={{ background: 'var(--hl-surface)', border: '1px solid var(--hl-border)', boxShadow: 'var(--hl-shadow-md)' }}
                    >
                      <span className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                        <Photo src={IMG.heroYoga} alt="" className="w-full h-full object-cover" />
                      </span>
                      <span className="text-[11px] font-black" style={{ color: 'var(--hl-text-primary)' }}>
                        Recovery 92<span style={{ color: 'var(--hl-text-tertiary)' }}>/100</span>
                      </span>
                    </div>
                  </Reveal>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Stats */}
          <div ref={statsRef} className="pt-16 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Reveal key={stat.label} delay={i * 90} variant="scale">
                  <div
                    className="hl-card hl-tilt p-4 sm:p-5 h-full"
                    style={{ background: 'var(--hl-gradient-card)' }}
                  >
                    <span
                      className="inline-flex w-8 h-8 rounded-xl items-center justify-center mb-2.5"
                      style={{ background: 'var(--hl-green-light)', color: 'var(--hl-green)' }}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <p className="text-xl sm:text-3xl font-black tabular-nums" style={{ color: 'var(--hl-text-primary)' }}>
                      <CountUp value={stat.value} run={statsInView && !reduced} />
                    </p>
                    <p className="text-[11px] sm:text-xs font-medium mt-0.5" style={{ color: 'var(--hl-text-tertiary)' }}>
                      {stat.label}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <div className="flex justify-center pt-12" aria-hidden="true">
            <ChevronDown className="hl-scroll-hint w-5 h-5" style={{ color: 'var(--hl-text-tertiary)' }} />
          </div>
        </div>
      </section>

      {/* ======================= CAPABILITY MARQUEE ======================= */}
      <section
        className="hl-marquee-wrap relative overflow-hidden py-5 mt-2"
        style={{
          ...bleed,
          background: 'var(--hl-surface)',
          borderTop: '1px solid var(--hl-border)',
          borderBottom: '1px solid var(--hl-border)',
        }}
        aria-label="Platform capabilities"
      >
        <div
          className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, var(--hl-surface), transparent)' }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(270deg, var(--hl-surface), transparent)' }}
          aria-hidden="true"
        />
        <div className="hl-marquee gap-3">
          {[0, 1].map(copy => (
            <div className="flex gap-3 pr-3" key={copy} aria-hidden={copy === 1}>
              {marqueeItems.map((item) => {
                const Icon = item.icon;
                return (
                  <span
                    key={copy + item.label}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap"
                    style={{
                      background: 'var(--hl-surface-alt)',
                      border: '1px solid var(--hl-border)',
                      color: 'var(--hl-text-secondary)',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: 'var(--hl-green)' }} aria-hidden="true" />
                    {item.label}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* ========================= FEATURE BENTO ========================= */}
      <section className="max-w-7xl mx-auto px-0 sm:px-0 pt-20 sm:pt-24 space-y-10">
        <Reveal className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="hl-badge hl-badge-teal normal-case tracking-normal text-[11px]">The platform</span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ color: 'var(--hl-text-primary)' }}>
            One workspace for <span className="hl-gradient-text">every input</span> that moves the needle
          </h2>
          <p className="text-sm" style={{ color: 'var(--hl-text-secondary)' }}>
            Training, nutrition, hydration and hormonal rhythm are modelled together — because in a real
            body they were never separate systems.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Wide training card */}
          <Reveal variant="left" className="lg:col-span-2">
            <article
              className="hl-shot hl-kb hl-zoom hl-tilt rounded-3xl h-[22rem] sm:h-[26rem]"
              style={{ border: '1px solid var(--hl-border)', boxShadow: 'var(--hl-shadow-md)' }}
            >
              <Photo src={IMG.featureTraining} alt="Athlete mid strength session" />
              <div className="absolute inset-0 z-[1] flex flex-col justify-end p-6 sm:p-8">
                <span
                  className="self-start hl-badge normal-case tracking-normal text-[11px] mb-3"
                  style={{ background: 'rgba(255,255,255,.92)', color: 'var(--hl-green)', border: 'none' }}
                >
                  Adaptive training
                </span>
                <h3 className="text-white text-2xl sm:text-3xl font-black leading-tight max-w-md">
                  Programming that reads your week, not a template
                </h3>
                <p className="text-white/80 text-sm mt-2.5 max-w-lg leading-relaxed">
                  Volume, intensity and rest auto-adjust from logged sessions, sleep and your current
                  cycle phase — every PR is tracked against the phase it happened in.
                </p>
                <div className="flex flex-wrap gap-2 mt-5">
                  {['Progressive overload', 'Form-check video', 'Phase-aware load'].map(tag => (
                    <span
                      key={tag}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white"
                      style={{ background: 'rgba(255,255,255,.16)', backdropFilter: 'blur(6px)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          </Reveal>

          {/* Nutrition card */}
          <Reveal variant="right" delay={120}>
            <article
              className="hl-shot hl-kb hl-zoom hl-tilt rounded-3xl h-[22rem] sm:h-[26rem]"
              style={{ border: '1px solid var(--hl-border)', boxShadow: 'var(--hl-shadow-md)' }}
            >
              <Photo src={IMG.featureNutrition} alt="Balanced whole-food plate" />
              <div className="absolute inset-0 z-[1] flex flex-col justify-end p-6">
                <span
                  className="self-start hl-badge normal-case tracking-normal text-[11px] mb-3"
                  style={{ background: 'rgba(255,255,255,.92)', color: 'var(--hl-peach-hover)', border: 'none' }}
                >
                  Nutrition
                </span>
                <h3 className="text-white text-xl sm:text-2xl font-black leading-tight">
                  Meal plans built around local food
                </h3>
                <p className="text-white/80 text-sm mt-2 leading-relaxed">
                  Macro targets met with rice, dal, fish and seasonal produce — not imported substitutes.
                </p>
              </div>
            </article>
          </Reveal>

          {/* Recovery card */}
          <Reveal variant="left" delay={80}>
            <article
              className="hl-shot hl-kb hl-zoom hl-tilt rounded-3xl h-[20rem]"
              style={{ border: '1px solid var(--hl-border)', boxShadow: 'var(--hl-shadow-md)' }}
            >
              <Photo src={IMG.featureRecovery} alt="Calm recovery and breathing practice" />
              <div className="absolute inset-0 z-[1] flex flex-col justify-end p-6">
                <span
                  className="self-start hl-badge normal-case tracking-normal text-[11px] mb-3"
                  style={{ background: 'rgba(255,255,255,.92)', color: 'var(--hl-lavender)', border: 'none' }}
                >
                  Recovery
                </span>
                <h3 className="text-white text-xl font-black leading-tight">Rest scored, not guessed</h3>
                <p className="text-white/80 text-sm mt-2 leading-relaxed">
                  Sleep, hydration and symptom logs roll into a daily readiness score.
                </p>
              </div>
            </article>
          </Reveal>

          {/* Stat / proof tile */}
          <Reveal delay={160} className="lg:col-span-2">
            <article
              className="hl-tilt rounded-3xl h-full min-h-[20rem] p-7 sm:p-9 flex flex-col justify-between"
              style={{ background: 'var(--hl-gradient-hero)', boxShadow: 'var(--hl-shadow-lg)' }}
            >
              <div className="space-y-3">
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full text-white"
                  style={{ background: 'rgba(255,255,255,.18)' }}
                >
                  <Bot className="w-3.5 h-3.5" aria-hidden="true" />
                  HealthyLife AI
                </span>
                <h3 className="text-white text-2xl sm:text-3xl font-black leading-tight max-w-lg">
                  Ask in plain language. Get a plan you can actually run today.
                </h3>
                <p className="text-white/80 text-sm max-w-md leading-relaxed">
                  Symptom checks, macro math, substitutions and full session design — grounded in your
                  own logged history rather than generic advice.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-8">
                {[
                  { k: '< 2s', v: 'Median plan generation' },
                  { k: '24/7', v: 'Always-on advisor' },
                  { k: '100%', v: 'Grounded in your logs' },
                ].map(item => (
                  <div
                    key={item.k}
                    className="rounded-2xl p-3.5"
                    style={{ background: 'rgba(255,255,255,.14)' }}
                  >
                    <p className="text-white text-lg sm:text-xl font-black">{item.k}</p>
                    <p className="text-white/75 text-[11px] leading-snug mt-0.5">{item.v}</p>
                  </div>
                ))}
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      {/* ====================== ROLES ====================== */}
      <section className="max-w-7xl mx-auto pt-20 sm:pt-24 space-y-10">
        <Reveal className="text-center space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ color: 'var(--hl-text-primary)' }}>
            Tailored experiences for every role
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--hl-text-secondary)' }}>
            HealthyLife provides purpose-built interfaces for Members and Coaches.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Member Card */}
          <Reveal variant="scale">
            <div className="hl-card hl-tilt overflow-hidden p-0 flex flex-col h-full">
              <div className="hl-shot hl-zoom h-40">
                <Photo src={IMG.roleMember} alt="Member tracking a workout" />
                <span
                  className="absolute left-4 bottom-4 z-[1] w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--hl-surface)', color: 'var(--hl-green)', boxShadow: 'var(--hl-shadow-md)' }}
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                </span>
              </div>
              <div className="p-6 space-y-4 flex flex-col justify-between flex-1">
                <div className="space-y-3">
                  <span className="hl-badge hl-badge-green normal-case tracking-normal">Role 1: Member Experience</span>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--hl-text-primary)' }}>Personal Health &amp; Vitality</h3>
                  <ul className="space-y-2 text-xs" style={{ color: 'var(--hl-text-secondary)' }}>
                    {[
                      'Daily Macro & Hydration Tracker',
                      'CycleSync™ Biological Guidance',
                      'AI Recipe & Workout Assistant',
                      'Community Challenges & Feed',
                    ].map(f => (
                      <li key={f} className="hl-plan-row flex items-center gap-2 rounded-lg">
                        <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--hl-green)' }} aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => onSelectTab('signup')}
                  className="hl-cta-lift w-full py-3 rounded-2xl font-bold text-xs"
                  style={{ background: 'var(--hl-green-light)', color: 'var(--hl-green)', transition: 'background .3s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-green-border)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-green-light)'; }}
                >
                  Sign Up as Member
                </button>
              </div>
            </div>
          </Reveal>

          {/* Coach Card */}
          <Reveal variant="scale" delay={110}>
            <div className="hl-card hl-tilt overflow-hidden p-0 flex flex-col h-full">
              <div className="hl-shot hl-zoom h-40">
                <Photo src={IMG.roleCoach} alt="Coach guiding a client" />
                <span
                  className="absolute left-4 bottom-4 z-[1] w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--hl-surface)', color: 'var(--hl-teal)', boxShadow: 'var(--hl-shadow-md)' }}
                >
                  <Briefcase className="w-5 h-5" aria-hidden="true" />
                </span>
              </div>
              <div className="p-6 space-y-4 flex flex-col justify-between flex-1">
                <div className="space-y-3">
                  <span className="hl-badge hl-badge-teal normal-case tracking-normal">Role 2: Coach Portal</span>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--hl-text-primary)' }}>Pro Client Management</h3>
                  <ul className="space-y-2 text-xs" style={{ color: 'var(--hl-text-secondary)' }}>
                    {[
                      'Client Roster & Compliance Stats',
                      'Live Video Consultations & Form Check',
                      'AI Client Plan Builder',
                      'Automated Progress Notifications',
                    ].map(f => (
                      <li key={f} className="hl-plan-row flex items-center gap-2 rounded-lg">
                        <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--hl-teal)' }} aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => onSelectTab('signin')}
                  className="hl-cta-lift w-full py-3 rounded-2xl font-bold text-xs"
                  style={{ background: 'var(--hl-teal-light)', color: 'var(--hl-teal)', transition: 'background .3s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-teal-border)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-teal-light)'; }}
                >
                  Sign In as Coach
                </button>
              </div>
            </div>
          </Reveal>

          {/* Health AI Card */}
          <Reveal variant="scale" delay={220}>
            <div className="hl-card hl-tilt overflow-hidden p-0 flex flex-col h-full">
              <div className="hl-shot hl-zoom h-40">
                <Photo src={IMG.roleAi} alt="Data-driven training environment" />
                <span
                  className="absolute left-4 bottom-4 z-[1] w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--hl-surface)', color: 'var(--hl-lavender)', boxShadow: 'var(--hl-shadow-md)' }}
                >
                  <Zap className="w-5 h-5" aria-hidden="true" />
                </span>
              </div>
              <div className="p-6 space-y-4 flex flex-col justify-between flex-1">
                <div className="space-y-3">
                  <span
                    className="hl-badge normal-case tracking-normal"
                    style={{ background: 'var(--hl-lavender-light)', color: 'var(--hl-lavender)', border: '1px solid var(--hl-lavender-border)' }}
                  >
                    Feature: AI Advisor
                  </span>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--hl-text-primary)' }}>Clinical AI Intelligence</h3>
                  <ul className="space-y-2 text-xs" style={{ color: 'var(--hl-text-secondary)' }}>
                    {[
                      '24/7 Nutrition & Macro Calculations',
                      'Evidence-Based Bio-Hormonal Guidance',
                      'Instant Meal & Workout Generation',
                      'Natural Language Symptom Checks',
                    ].map(f => (
                      <li key={f} className="hl-plan-row flex items-center gap-2 rounded-lg">
                        <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--hl-lavender)' }} aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => onSelectTab('ai-assistant')}
                  className="hl-cta-lift w-full py-3 rounded-2xl font-bold text-xs"
                  style={{ background: 'var(--hl-lavender-light)', color: 'var(--hl-lavender)', transition: 'background .3s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-lavender-border)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--hl-lavender-light)'; }}
                >
                  Try AI Health Advisor
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ====================== HOW IT WORKS ====================== */}
      <section className="max-w-7xl mx-auto pt-20 sm:pt-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Parallax image column */}
          <Reveal variant="left">
            <div
              className="relative rounded-[2rem] overflow-hidden h-[26rem] sm:h-[34rem]"
              style={{ border: '1px solid var(--hl-border)', boxShadow: 'var(--hl-shadow-xl)' }}
            >
              <div ref={stepsImageRef} className="absolute inset-0 -top-[12%] -bottom-[12%]">
                <Photo src={IMG.stepsTall} alt="Training session in progress" className="w-full h-full object-cover" />
              </div>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(200deg, rgba(61,122,90,.45) 0%, rgba(44,36,32,.15) 45%, rgba(44,36,32,.72) 100%)' }}
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <button
                  onClick={() => onSelectTab('ai-assistant')}
                  className="hl-cta-lift flex items-center gap-2.5 px-5 py-3 rounded-full text-xs font-black"
                  style={{ background: 'var(--hl-surface)', color: 'var(--hl-text-primary)', boxShadow: 'var(--hl-shadow-lg)' }}
                >
                  <PlayCircle className="w-4 h-4" style={{ color: 'var(--hl-green)' }} aria-hidden="true" />
                  <span>See the AI advisor in action</span>
                  <ArrowRight className="hl-arrow w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </Reveal>

          {/* Steps */}
          <div className="space-y-2">
            <Reveal variant="right" className="space-y-3 mb-8">
              <span className="hl-badge hl-badge-peach normal-case tracking-normal text-[11px]">How it works</span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ color: 'var(--hl-text-primary)' }}>
                From signup to your first synced week
              </h2>
              <p className="text-sm" style={{ color: 'var(--hl-text-secondary)' }}>
                No spreadsheets, no guesswork — three steps and the plan maintains itself.
              </p>
            </Reveal>

            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal variant="right" delay={i * 130} key={step.n}>
                  <div className="relative flex gap-5 pb-8 last:pb-0">
                    {/* connector */}
                    {i < steps.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="hl-step-line absolute left-[1.4rem] top-12 bottom-0 w-px"
                        style={{ background: 'var(--hl-green-border)' }}
                      />
                    )}
                    <span
                      className="relative shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs"
                      style={{
                        background: 'var(--hl-green-light)',
                        color: 'var(--hl-green)',
                        border: '1px solid var(--hl-green-border)',
                      }}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <div className="pt-1 space-y-1.5">
                      <p className="text-[11px] font-black tracking-[0.2em]" style={{ color: 'var(--hl-text-tertiary)' }}>
                        STEP {step.n}
                      </p>
                      <h3 className="text-lg font-bold" style={{ color: 'var(--hl-text-primary)' }}>{step.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--hl-text-secondary)' }}>{step.body}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====================== TESTIMONIALS ====================== */}
      <section className="max-w-7xl mx-auto pt-20 sm:pt-28 space-y-10">
        <Reveal className="text-center space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ color: 'var(--hl-text-primary)' }}>
            Built with the people using it
          </h2>
          <p className="text-sm max-w-xl mx-auto" style={{ color: 'var(--hl-text-secondary)' }}>
            Members and coaches across Bangladesh shape every release.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 120} variant="scale">
              <figure
                className="hl-card hl-tilt p-6 h-full flex flex-col justify-between"
                style={{ background: 'var(--hl-gradient-card)' }}
              >
                <div className="space-y-4">
                  <Quote className="w-7 h-7" style={{ color: 'var(--hl-green-border)' }} aria-hidden="true" />
                  <blockquote className="text-sm leading-relaxed" style={{ color: 'var(--hl-text-secondary)' }}>
                    {t.quote}
                  </blockquote>
                </div>
                <figcaption className="flex items-center gap-3 pt-6">
                  <span className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                    <Photo src={t.avatar} alt="" className="w-full h-full object-cover" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate" style={{ color: 'var(--hl-text-primary)' }}>{t.name}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--hl-text-tertiary)' }}>{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ====================== PRICING ====================== */}
      <section className="max-w-6xl mx-auto pt-20 sm:pt-28">
        <Reveal className="text-center space-y-3 mb-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ color: 'var(--hl-text-primary)' }}>
            HealthyLife transparent pricing
          </h2>
          <p className="text-sm" style={{ color: 'var(--hl-text-secondary)' }}>
            Select the perfect plan for individual wellness or coaching businesses.
          </p>

          <div
            role="group"
            aria-label="Billing cycle"
            className="relative inline-flex items-center gap-2 p-1.5 rounded-full mt-3"
            style={{ background: 'var(--hl-surface-alt)', border: '1px solid var(--hl-border)' }}
          >
            <span
              aria-hidden="true"
              className="absolute top-1.5 bottom-1.5 rounded-full"
              style={{
                left: billingCycle === 'monthly' ? '0.375rem' : 'calc(50% + 0.125rem)',
                width: 'calc(50% - 0.5rem)',
                background: 'var(--hl-green)',
                boxShadow: '0 4px 14px rgba(61,122,90,.3)',
                transition: 'left .42s cubic-bezier(.22,1,.36,1)',
              }}
            />
            <button
              onClick={() => setBillingCycle('monthly')}
              aria-pressed={billingCycle === 'monthly'}
              className="relative z-[1] px-5 py-1.5 rounded-full text-xs font-bold"
              style={{
                color: billingCycle === 'monthly' ? 'var(--hl-text-inverse)' : 'var(--hl-text-secondary)',
                transition: 'color .3s ease',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              aria-pressed={billingCycle === 'yearly'}
              className="relative z-[1] px-5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
              style={{
                color: billingCycle === 'yearly' ? 'var(--hl-text-inverse)' : 'var(--hl-text-secondary)',
                transition: 'color .3s ease',
              }}
            >
              <span>Yearly</span>
            </button>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

          {/* Free */}
          <Reveal variant="scale">
            <div className="hl-card hl-tilt p-8 space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--hl-text-primary)' }}>Free Tier</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--hl-text-tertiary)' }}>Basic macro &amp; workout logging.</p>
                  <div className="mt-4">
                    <span className="text-4xl font-black" style={{ color: 'var(--hl-text-primary)' }}>৳0</span>
                    <span className="text-xs" style={{ color: 'var(--hl-text-tertiary)' }}> / forever</span>
                  </div>
                </div>
                <ul className="space-y-3 text-xs" style={{ color: 'var(--hl-text-secondary)' }}>
                  {['Daily Calorie & Macro Logging', 'Standard Workout Routines', 'Community Access'].map(f => (
                    <li key={f} className="hl-plan-row flex items-center gap-2 rounded-lg">
                      <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--hl-green)' }} aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => onSelectTab('signup')}
                className="hl-btn-ghost hl-cta-lift w-full py-3 text-xs"
                style={{ background: 'var(--hl-surface-alt)' }}
              >
                Start Free
              </button>
            </div>
          </Reveal>

          {/* Vitality Plus */}
          <Reveal variant="scale" delay={110}>
            <div
              className="hl-tilt p-8 rounded-3xl space-y-6 relative flex flex-col justify-between h-full md:-mt-4 md:mb-4"
              style={{ background: 'var(--hl-surface)', border: '2px solid var(--hl-green)', boxShadow: 'var(--hl-shadow-xl)' }}
            >
              <div
                className="absolute -top-3.5 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                style={{ background: 'var(--hl-green)', color: 'var(--hl-text-inverse)', boxShadow: '0 6px 16px rgba(61,122,90,.35)' }}
              >
                Most Popular
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--hl-green)' }}>Vitality Plus</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--hl-text-tertiary)' }}>Full CycleSync™ &amp; AI Assistant.</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span
                      key={billingCycle}
                      className="text-4xl font-black animate-fade-slide-up"
                      style={{ color: 'var(--hl-text-primary)' }}
                    >
                      {billingCycle === 'yearly' ? '৳200' : '৳250'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--hl-text-tertiary)' }}> / month</span>
                  </div>
                </div>
                <ul className="space-y-3 text-xs" style={{ color: 'var(--hl-text-secondary)' }}>
                  {[
                    'CycleSync™ Biological Intelligence',
                    'Advanced Llama-3.3-70b AI Advisor',
                    'Custom Macro & Meal Generator',
                    'Unlimited PR Logs',
                  ].map(f => (
                    <li key={f} className="hl-plan-row flex items-center gap-2 rounded-lg">
                      <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--hl-green)' }} aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => onSelectTab('signup')}
                className="hl-btn-primary hl-cta-lift hl-sheen w-full py-3 text-xs"
              >
                Start 14-Day Free Trial
              </button>
            </div>
          </Reveal>

          {/* Pro Coach */}
          <Reveal variant="scale" delay={220}>
            <div className="hl-card hl-tilt p-8 space-y-6 flex flex-col justify-between h-full">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--hl-text-primary)' }}>Pro Coach Studio</h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--hl-text-tertiary)' }}>For trainers &amp; nutrition coaches.</p>
                  <div className="mt-4">
                    <span
                      key={billingCycle}
                      className="text-4xl font-black animate-fade-slide-up"
                      style={{ color: 'var(--hl-text-primary)' }}
                    >
                      {billingCycle === 'yearly' ? '৳500' : '৳600'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--hl-text-tertiary)' }}> / month</span>
                  </div>
                </div>
                <ul className="space-y-3 text-xs" style={{ color: 'var(--hl-text-secondary)' }}>
                  {['Client Roster & Compliance Tools', 'AI Client Routine Generator', 'Live Consultation Queue'].map(f => (
                    <li key={f} className="hl-plan-row flex items-center gap-2 rounded-lg">
                      <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--hl-green)' }} aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => onSelectTab('signin')}
                className="hl-btn-ghost hl-cta-lift w-full py-3 text-xs"
                style={{ background: 'var(--hl-surface-alt)' }}
              >
                Sign In as Coach
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ====================== CLOSING CTA ====================== */}
      <section
        className="relative overflow-hidden mt-20 sm:mt-28"
        style={{ ...bleed }}
      >
        <div ref={ctaBandRef} className="absolute inset-0 -top-[14%] -bottom-[14%]">
          <Photo src={IMG.ctaBand} alt="" className="w-full h-full object-cover" />
        </div>
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(120deg, rgba(61,122,90,.93) 0%, rgba(74,155,142,.86) 52%, rgba(44,36,32,.86) 100%)' }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center space-y-7">
          <Reveal>
            <span
              className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full text-white"
              style={{ background: 'rgba(255,255,255,.18)' }}
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Start free — no card required
            </span>
          </Reveal>

          <Reveal delay={90}>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.06]">
              Your body keeps a rhythm.
              <br />
              Train with it, not against it.
            </h2>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Join 14,000+ members syncing training, nutrition and recovery to their own biology —
              with a certified coach a message away.
            </p>
          </Reveal>

          <Reveal delay={230}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <button
                onClick={() => onSelectTab('signup')}
                className="hl-cta-lift hl-sheen w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-black"
                style={{ background: 'var(--hl-surface)', color: 'var(--hl-green)', boxShadow: 'var(--hl-shadow-xl)' }}
              >
                <span>Create your free account</span>
                <ArrowRight className="hl-arrow w-4 h-4 stroke-[2.5]" aria-hidden="true" />
              </button>
              <button
                onClick={() => onSelectTab('ai-assistant')}
                className="hl-cta-lift w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold text-white"
                style={{ background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.3)' }}
              >
                <Bot className="w-4 h-4" aria-hidden="true" />
                <span>Try the AI advisor first</span>
              </button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

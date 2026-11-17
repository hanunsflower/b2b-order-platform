import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  ShoppingBag,
  ReceiptText,
  Boxes,
  Palette,
  ShieldCheck,
  FileText,
  History,
  Truck,
  Star,
} from "lucide-react";
import styles from "./Landing.module.css";

// Import your 3 images here
import hero1 from "../assets/hero-1.avif";
import hero2 from "../assets/hero-2.avif";
import hero3 from "../assets/hero-3.avif";

const steps = [
  {
    icon: ClipboardCheck,
    title: "Apply for an account",
    text: "Create an account. Our team reviews and approves every business buyer.",
  },
  {
    icon: ShoppingBag,
    title: "Browse and order",
    text: "Pick shades and sizes, fill your cart, and choose pickup or delivery.",
  },
  {
    icon: ReceiptText,
    title: "Pay and receive",
    text: "Send a bank or Telebirr reference. Once verified, your invoice is issued.",
  },
];

const features = [
  {
    icon: Boxes,
    title: "Live stock",
    text: "See what is available before you order. Stock is held for you at checkout.",
  },
  {
    icon: Palette,
    title: "Shades and sizes",
    text: "Every variant has its own SKU, price and stock, so you order exactly what you need.",
  },
  {
    icon: ShieldCheck,
    title: "Approved buyers only",
    text: "Wholesale pricing is visible only to verified businesses.",
  },
  {
    icon: FileText,
    title: "Clear invoices",
    text: "Prices are locked when you order, so your invoice never changes.",
  },
  {
    icon: History,
    title: "Full audit trail",
    text: "Every approval, payment and status change is recorded.",
  },
  {
    icon: Truck,
    title: "Pickup or delivery",
    text: "Collect from our warehouse or have it delivered to your shop.",
  },
];

export default function Landing() {
  return (
    <div className={styles.wrap}>
      <header className={styles.bar}>
        <span className={styles.brand}>Glow Wholesale</span>
        <nav className={styles.actions}>
          <a href="#how" className={styles.anchor}>
            How it works
          </a>
          <a href="#features" className={styles.anchor}>
            Features
          </a>
          <Link to="/login" className={styles.signin}>
            Sign in
          </Link>
          <Link to="/register" className={styles.create}>
            Create account
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.tag}>B2B cosmetics supply</p>
          <h1 className={styles.title}>
            Wholesale cosmetics, ordered the <span>easy way</span>
          </h1>
          <p className={styles.lead}>
            Live stock. Locked-in prices. Fast delivery. The easiest way for
            salons and pharmacies to stock up on premium beauty products.
          </p>
          <div className={styles.cta}>
            <Link to="/register" className={styles.create}>
              Create account
            </Link>
            <Link to="/login" className={styles.ghost}>
              Sign in
            </Link>
          </div>

          <div className={styles.socialProof}>
            <div className={styles.stars}>
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
            </div>
            {/* UPDATED: Honest copy instead of "50+ salons" */}
            <p>Built for salons, pharmacies, and beauty shops</p>
          </div>
        </div>

        {/* New Dynamic Collage */}
        <div className={styles.heroCollage}>
          <div className={`${styles.collageImg} ${styles.imgMain}`}>
            <img src={hero1} alt="Cosmetics palette" />
          </div>
          <div className={`${styles.collageImg} ${styles.imgTall}`}>
            <img src={hero2} alt="Makeup brushes" />
          </div>
          <div className={`${styles.collageImg} ${styles.imgSmall}`}>
            <img src={hero3} alt="Lipstick" />
          </div>

          {/* Floating Badge */}
          <div className={styles.heroBadge}>
            <Boxes size={18} />
            {/* UPDATED: Removed "500+" */}
            <span>Live stock tracking</span>
          </div>
        </div>
      </section>

      <section id="how" className={styles.section}>
        <h2>How it works</h2>
        <div className={styles.steps}>
          {steps.map((s, i) => (
            <div key={s.title} className={styles.step}>
              <span className={styles.num}>{i + 1}</span>
              <div className={styles.icon}>
                <s.icon size={26} />
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className={`${styles.section} ${styles.alt}`}>
        <h2>Built for busy businesses</h2>
        <div className={styles.features}>
          {features.map((f) => (
            <div key={f.title} className={styles.feature}>
              <div className={styles.icon}>
                <f.icon size={26} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* UPDATED: Honest stats instead of fake numbers */}
      <section className={styles.stats}>
        <div>
          <strong>100%</strong>
          <span>Wholesale pricing</span>
        </div>
        <div>
          <strong>B2B</strong>
          <span>Verified buyers only</span>
        </div>
        <div>
          <strong>24/7</strong>
          <span>Stock visibility</span>
        </div>
      </section>

      <section className={styles.final}>
        <h2>Ready to place your first order?</h2>
        <p>Registration is free. We approve new businesses quickly.</p>
        <Link to="/register" className={styles.finalBtn}>
          Create account
        </Link>
      </section>

      <footer className={styles.footer}>
        © 2026 Glow Wholesale · Demo project for the Arrowstack internship
      </footer>
    </div>
  );
}

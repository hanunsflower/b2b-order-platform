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
  Sparkles,
  Droplets,
  Brush,
} from "lucide-react";
import styles from "./Landing.module.css";

const steps = [
  {
    icon: ClipboardCheck,
    title: "Register your business",
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
            Salons, pharmacies and beauty shops can browse our full catalog,
            check live stock, place bulk orders and track them to the door, all
            in one place.
          </p>
          <div className={styles.cta}>
            <Link to="/register" className={styles.create}>
              Create account
            </Link>
            <Link to="/login" className={styles.ghost}>
              Sign in
            </Link>
          </div>
        </div>

        <div className={styles.heroArt} aria-hidden="true">
          <div className={styles.bubble}>
            <Sparkles size={64} />
          </div>
          <div className={`${styles.bubble} ${styles.b2}`}>
            <Droplets size={50} />
          </div>
          <div className={`${styles.bubble} ${styles.b3}`}>
            <Brush size={32} />
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

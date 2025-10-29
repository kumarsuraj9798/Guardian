import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import './LandingPage.css';

// --- Animation Variants (Shared) ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

// --- Main Landing Page ---
export default function LandingPage({ onSignInClick }) {
  return (
    <div className="landing-page-wrapper">
      <HeroSection onSignInClick={onSignInClick} />
      <FeaturesSection />
      <HowItWorksSection />
      <DashboardPreviewSection />
      <AnalyticsSection />
      <TestimonialsSection />
      <CtaSection onSignInClick={onSignInClick} />
    </div>
  );
}

// --- Reusable Section Wrapper ---
const Section = ({ children, className = '', id }) => (
  <motion.section
    id={id}
    className={`section ${className}`}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.2 }}
    variants={containerVariants}
  >
    <div className="container">{children}</div>
  </motion.section>
);

// --- Page Sections ---

const HeroSection = ({ onSignInClick }) => {
  return (
    <section className="hero-section">
      <div className="container">
        <motion.div
          className="hero-content-box"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img 
             
            style={{ width: '100px', border: '2px solid red' }} 
          />
          <h1>GuardianNet: The Future of Emergency Response</h1>
          <p className="hero-subtitle">
            An AI-powered platform designed to dramatically reduce response times and save lives through intelligent coordination and real-time data.
          </p>
          <div className="hero-cta">
            <button onClick={onSignInClick} className="btn btn-get-started">Get Started</button>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-secondary">
              Learn More
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const features = [
    { icon: '🤖', title: 'AI-Powered Dispatch', description: 'Our AI analyzes incident data in milliseconds to identify, prioritize, and automatically dispatch the nearest and most appropriate units.' },
    { icon: '🗺️', title: 'Real-Time Tracking', description: 'Live GPS tracking of all active units on an interactive map provides unparalleled situational awareness for command center operators.' },
    { icon: '📊', title: 'Predictive Analytics', description: 'Forecast potential incident hotspots based on historical data and public events to pre-allocate resources where they\'ll be needed most.' },
    { icon: '🌐', title: 'Unified Communication', description: 'A seamless, multi-agency communication platform that coordinates police, fire, and medical teams on a single, secure channel.' },
  ];

  return (
    <Section id="features" className="features-section">
      <h2 className="section-title">A Smarter, Faster, More Connected Response</h2>
      <div className="features-grid">
        {features.map((feature, i) => (
          <motion.div key={i} className="feature-card" variants={itemVariants}>
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

const HowItWorksSection = () => {
  const steps = [
    { title: "Report & Analyze", text: "AI instantly analyzes incident data from multiple sources, determining severity and location with pinpoint accuracy." },
    { title: "Dispatch & Coordinate", text: "The optimal units are dispatched automatically. All agencies are connected on a unified, secure communication channel." },
    { title: "Monitor & Resolve", text: "Track progress in real-time on the live dashboard, manage resources dynamically, and auto-generate incident reports." }
  ];

  return (
    <Section className="how-it-works-section">
      <h2 className="section-title">Three Steps to Saving Lives</h2>
      <div className="workflow-steps">
        {steps.map((step, i) => (
          <motion.div key={i} className="step-card" variants={itemVariants}>
            <div className="step-number">{i + 1}</div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};

const DashboardPreviewSection = () => (
  <Section className="dashboard-preview-section">
    <h2 className="section-title">The <span className="gradient-text">Command Center</span></h2>
    <motion.p className="section-subtitle" variants={itemVariants}>
      Get a bird's-eye view of every active incident. Our intuitive web application provides real-time unit locations, status updates, and communication channels in a single, powerful interface.
    </motion.p>
    <motion.div className="dashboard-image-container" variants={itemVariants}>
      <img 
        src={`${process.env.PUBLIC_URL}/hero-bg.jpg`} 
        alt="GuardianNet Dashboard" 
      />
    </motion.div>
  </Section>
);

const AnimatedStat = ({ endValue, label, suffix = '' }) => {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      animate(0, endValue, {
        duration: 2,
        onUpdate: v => setCount(Math.floor(v)),
        ease: "easeOut"
      });
    }
  }, [isInView, endValue]);

  return (
    <div ref={ref} className="stat-card">
      <span className="stat-number">{count}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
};

const AnalyticsSection = () => (
  <Section className="analytics-section">
    <h2 className="section-title">Data-Driven Performance</h2>
    <p className="section-subtitle">Don't just respond—improve. GuardianNet provides deep insights into your team's performance, helping you identify bottlenecks and optimize resource allocation.</p>
    <motion.div className="analytics-grid" variants={itemVariants}>
      <AnimatedStat endValue={42} suffix="%" label="Reduction in Response Time" />
      <AnimatedStat endValue={1247} label="Incidents Handled This Month" />
      <AnimatedStat endValue={98} suffix="%" label="Incident Success Rate" />
    </motion.div>
  </Section>
);

const TestimonialsSection = () => (
  <Section className="testimonials-section">
    <h2 className="section-title">Trusted by First Responders</h2>
    <div className="testimonials-grid">
      <motion.div className="testimonial-card" variants={itemVariants}>
        <blockquote>"GuardianNet has transformed our dispatch. We're faster, more coordinated, and our team feels safer on the streets."</blockquote>
        <cite>– Captain Eva Rostova, 15th Precinct</cite>
      </motion.div>
      <motion.div className="testimonial-card" variants={itemVariants}>
        <blockquote>"The situational awareness this platform provides is unparalleled. It's a game-changer for large-scale incidents."</blockquote>
        <cite>– Chief Michael Chen, Metro Fire Dept.</cite>
      </motion.div>
    </div>
  </Section>
);

const CtaSection = ({ onSignInClick }) => (
  <section className="cta-section">
    <div className="container">
      <motion.h2 variants={itemVariants}>
        Ready to Revolutionize Your Emergency Response?
      </motion.h2>
      <motion.p className="section-subtitle" variants={itemVariants}>
        Experience the future of emergency management. Schedule a demo today to see how GuardianNet can empower your team and protect your community.
      </motion.p>
      <motion.button
        onClick={onSignInClick}
        className="btn btn-get-started"
        variants={itemVariants}
      >
        Request a Demo
      </motion.button>
    </div>
  </section>
);
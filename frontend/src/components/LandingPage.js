import React, { useState, useEffect, useRef } from 'react';
import { 
  motion, 
  useInView, 
  animate, 
  useMotionValue, 
  useTransform, 
  useSpring, 
  AnimatePresence 
} from 'framer-motion';
import './LandingPage.css';
import { ThreeDButton } from './ThreeDButton';

// --- Animation Variants (Shared) ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

// --- Main Landing Page ---
export default function LandingPage({ onSignInClick }) {
  return (
    <div className="landing-page-wrapper">
      {/* FIXED: Removed redundant <Section> wrappers. Each component now handles its own section tag. */}
      <HeroSection onSignInClick={onSignInClick} />
      <AboutSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DashboardPreviewSection />
      <AnalyticsSection />
      <TestimonialsSection />
      <SupportSection />
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

// --- Enhanced Sections with More Descriptive Content ---

const HeroSection = ({ onSignInClick }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 100, damping: 20 });
  const springY = useSpring(y, { stiffness: 100, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = e => {
    if (!ref.current) return;
    x.set(e.clientX / window.innerWidth - 0.5);
    y.set(e.clientY / window.innerHeight - 0.5);
  };

  return (
    // Note: The Hero Section is unique and does not use the <Section> wrapper for a full-bleed effect
    <section className="hero-section" onMouseMove={handleMouseMove}>
      <div className="hero-aurora-bg" />
      <div className="container">
        <div className="hero-grid">
          <motion.div className="hero-content" initial="hidden" animate="visible" variants={containerVariants}>
            <motion.h1 variants={itemVariants}>
              <span className="animate-gradient">GuardianNet</span>: The Future of 
              <span className="animate-gradient">Emergency Response</span> <span className="emoji">🚨</span>
            </motion.h1>
            <motion.p className="hero-subtitle pulse" variants={itemVariants}>
              <span className="emoji">⚡</span> An <span className="shine">AI-powered</span> platform designed to 
              <span className="animate-gradient"> dramatically reduce response times</span> and 
              <span className="shine"> save lives</span> through intelligent coordination and real-time data. 
              <span className="emoji">💡</span>
            </motion.p>
            <motion.div variants={itemVariants} className="hero-cta">
              <motion.button 
                onClick={onSignInClick} 
                className="btn btn-primary animate-gradient" 
                whileHover={{ 
                  scale: 1.05, 
                  boxShadow: '0 0 40px rgba(255, 0, 110, 0.5)',
                  rotate: [0, -2, 2, -2, 0]
                }} 
                whileTap={{ scale: 0.95 }}
              >
                🚀 Get Started Now <span className="emoji">✨</span>
              </motion.button>
              <motion.div className="hero-highlight">
                <span className="pulse">🔥</span> Trusted by <span className="animate-gradient">10,000+</span> first responders 
                <span className="emoji">👨‍🚒👮‍♀️👨‍⚕️</span>
              </motion.div>
            </motion.div>
          </motion.div>
          <div className="hero-visual-container">
            <motion.div ref={ref} className="hero-visual" style={{ transformStyle: "preserve-3d", rotateX, rotateY }}>
              <motion.div className="parallax-layer" style={{ transform: "translateZ(80px)" }}>
                   <img src="/police.png" alt="Police Officer" className="hero-image"/>
              </motion.div>
              <motion.div className="parallax-layer" style={{ transform: "translateZ(30px) scale(0.9)" }}>
                   <img src="/hero-bg.jpg" alt="Emergency Response" className="hero-bg-image"/>
              </motion.div>
              <div className="hero-visual-glow" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const AboutSection = () => (
    <Section id="about" className="about-section">
        <div className="about-grid">
            <motion.div className="about-content" variants={itemVariants}>
                <h2 className="section-title left-align">About <span className="gradient-text">GuardianNet</span></h2>
                <h3>Connecting Every Second to a Life Saved</h3>
                <p>In critical moments, every second counts. Traditional emergency systems often struggle with fragmented communication and manual dispatch, leading to delays that can mean the difference between life and death. GuardianNet was built to solve this fundamental problem.</p>
                <p>Our platform acts as a central nervous system for emergency services, leveraging AI to automate and optimize every step of the response process—from the initial alert to the final incident resolution. We bridge the gap between agencies and the public, creating a seamless, transparent, and incredibly fast response network.</p>
            </motion.div>
            <motion.div className="about-visual" variants={itemVariants}>
                <div className="glass-card">
                    <div className="card-glow" />
                       <img src="/firebrigade.png" alt="Data and connectivity" />
                </div>
            </motion.div>
        </div>
    </Section>
);

const FeaturesSection = () => {
    const features = [
        { icon: '🤖', title: 'AI-Powered Dispatch', description: 'Our AI analyzes incident data in milliseconds to identify its nature, severity, and location, then automatically dispatches the nearest and most appropriate units.' },
        { icon: '🗺️', title: 'Real-Time Tracking', description: 'Live GPS tracking of all active units on an interactive map provides unparalleled situational awareness for command center operators.' },
        { icon: '📊', title: 'Predictive Analytics', description: 'Forecast potential incident hotspots based on historical data, weather, and public events to pre-allocate resources where they\'ll be needed most.' },
        { icon: '🌐', title: 'Unified Communication', description: 'A seamless, multi-agency communication platform that coordinates police, fire, and medical teams on a single, secure channel.' },
        { icon: '📱', title: 'Citizen Reporting App', description: 'Empower the public to report incidents with precise location data, photos, and videos instantly, providing crucial on-the-ground intelligence.' },
    ];
    const [activeFeature, setActiveFeature] = useState(0);

    return (
        <Section className="features-section">
            <motion.h2 className="section-title" variants={itemVariants}>A Smarter, Faster, More Connected Response</motion.h2>
            <div className="features-content-grid">
                <motion.div className="features-list" variants={containerVariants}>
                    {features.map((feature, i) => (
                        <motion.div key={i} className={`feature-list-item ${activeFeature === i ? 'active' : ''}`} onMouseEnter={() => setActiveFeature(i)} variants={itemVariants}>
                            <div className="feature-list-icon">{feature.icon}</div>
                            <div className="feature-list-text">
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
                <div className="features-visual">
                    <AnimatePresence mode="wait">
                        <motion.div key={activeFeature} className="visual-content-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
                            <div className="visual-icon-large">{features[activeFeature].icon}</div>
                            <h3>{features[activeFeature].title}</h3>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </Section>
    );
};

// ENHANCED: This section now uses the impressive 3D card design
const HowItWorksSection = () => {
  const steps = [
    { icon: '📡', title: "Report & Analyze", text: "AI instantly analyzes incident data from multiple sources, determining severity and location with pinpoint accuracy.", color: "#8338ec" },
    { icon: '🚀', title: "Dispatch & Coordinate", text: "The optimal units are dispatched automatically. All agencies are connected on a unified, secure communication channel.", color: "#00f5d4" },
    { icon: '🛰️', title: "Monitor & Resolve", text: "Track progress in real-time on the live dashboard, manage resources dynamically, and auto-generate incident reports.", color: "#ff006e" }
  ];

  return (
    <Section className="how-it-works-section">
      <h2 className="section-title">Three Steps to <span className="gradient-text">Saving Lives</span></h2>
      <motion.p className="section-subtitle" variants={itemVariants}>
        Our entire platform is designed around a simple yet powerful workflow. We turn complex, chaotic situations into a clear, actionable process.
      </motion.p>
      <div className="workflow-steps">
        {steps.map((step, i) => (
          <motion.div key={i} className="step-card-3d-container" variants={itemVariants}>
            <motion.div className="step-card-3d" whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
              <div className="step-card-glow" style={{'--glow-color': step.color}} />
              <div className="step-card-content">
                <motion.div className="step-visual-3d" style={{ transform: 'translateZ(50px)' }}>{step.icon}</motion.div>
                <motion.h3 style={{ transform: 'translateZ(40px)' }}>{step.title}</motion.h3>
                <motion.p style={{ transform: 'translateZ(30px)' }}>{step.text}</motion.p>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};


const scrollToSection = (id) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const DashboardPreviewSection = () => (
    <Section id="about" className="dashboard-preview-section">
        <h2 className="section-title"><span className="gradient-text">About Us</span></h2>
        <motion.p className="section-subtitle" variants={itemVariants}>Get a bird's-eye view of every active incident. Our intuitive web application provides real-time unit locations, status updates, and communication channels in a single, powerful interface.</motion.p>
        <motion.div className="dashboard-image-container" variants={itemVariants} whileHover={{ scale: 1.03 }}>
            <div className="card-glow" />
            <img src="/hero-bg.jpg" alt="GuardianNet Dashboard" />
            <motion.div className="scan-line" initial={{ y: '-100%' }} animate={{ y: '100%' }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
        </motion.div>
    </Section>
);

const AnimatedStat = ({ endValue, label, icon = '📊' }) => {
    const ref = useRef(null);
    const [count, setCount] = useState(0);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    
    useEffect(() => {
        if (isInView) {
            animate(0, endValue, { 
                duration: 2.5, 
                onUpdate: v => setCount(Math.floor(v)),
                ease: [0.16, 1, 0.3, 1] // Smooth ease-out
            });
        }
    }, [isInView, endValue]);
    
    return (
        <motion.div 
            ref={ref} 
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5 }}
        >
            <div className="stat-icon">{icon}</div>
            <div className="stat-number">
                <span className="count">{count.toLocaleString()}</span>
                {label.includes('%') && <span className="percent">%</span>}
            </div>
            <div className="stat-label">{label}</div>
        </motion.div>
    );
};

const AnalyticsSection = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const responseTimes = [4, 3, 5, 2, 6, 4, 7];
  
  return (
    <Section className="analytics-section">
      <div className="section-header">
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Data-Driven <span className="gradient-text">Performance</span>
        </motion.h2>
        <motion.p 
          className="section-subtitle" 
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Don't just respond—improve. GuardianNet provides deep insights into your team's performance, helping you identify bottlenecks, optimize resource allocation, and ultimately, improve community outcomes.
        </motion.p>
      </div>
      
      <div className="analytics-grid">
        <motion.div 
          className="analytics-stats" 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <AnimatedStat 
            endValue={1247} 
            label="Incidents Handled This Month" 
            icon="📊"
          />
          <AnimatedStat 
            endValue={42} 
            label="Reduction in Response Time (%)" 
            icon="⚡"
          />
          <AnimatedStat 
            endValue={98} 
            label="Incident Success Rate (%)" 
            icon="✅"
          />
        </motion.div>
        
        <motion.div 
          className="chart-container" 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3>Response Time (Last 7 Days)</h3>
          <div className="bar-chart">
            {responseTimes.map((value, i) => (
              <div key={i} className="chart-column">
                <motion.div 
                  className="bar" 
                  initial={{ height: 0 }}
                  whileInView={{ height: `${value * 12}%`}}
                  viewport={{ once: true }}
                  transition={{ 
                    duration: 0.8, 
                    delay: i * 0.1,
                    type: 'spring',
                    damping: 10,
                    stiffness: 50
                  }}
                  data-value={`${value}m`}
                />
                <span className="chart-label">{days[i]}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Section>
  );
};

const TestimonialsSection = () => {
    const [dragConstraints, setDragConstraints] = useState(0);
    const sliderRef = useRef(null);
    useEffect(() => {
        const slider = sliderRef.current;
        if (slider) {
            setDragConstraints(slider.scrollWidth - slider.clientWidth);
        }
    }, []);

    return (
        <Section className="testimonials-section">
            <h2 className="section-title">Trusted by <span className="gradient-text">First Responders</span></h2>
            <motion.div ref={sliderRef} className="testimonials-slider">
                <motion.div className="testimonials-grid" drag="x" dragConstraints={{ right: 0, left: -dragConstraints }}>
                {[
                    { name: 'Captain Eva Rostova', agency: '15th Precinct', quote: "GuardianNet has transformed our dispatch. We're faster, more coordinated, and our team feels safer on the streets." },
                    { name: 'Chief Michael Chen', agency: 'Metro Fire Dept.', quote: "The situational awareness this platform provides is unparalleled. It's a game-changer for large-scale incidents." },
                    { name: 'Dr. Alisha Khan', agency: 'City General Hospital', quote: "Receiving real-time data from the field before a patient arrives is critical. This makes it possible." },
                ].map((testimonial, i) => (
                    <motion.div key={i} className="testimonial-card" variants={itemVariants}>
                        <div className="quote-icon">“</div>
                        <p className="testimonial-quote">{testimonial.quote}</p>
                        <div className="testimonial-author">
                            <strong>{testimonial.name}</strong>, {testimonial.agency}
                        </div>
                    </motion.div>
                ))}
                </motion.div>
            </motion.div>
        </Section>
    );
};

const SupportSection = () => (
    <Section className="support-section">
        <h2 className="section-title">We're Here For You, <span className="gradient-text">24/7</span></h2>
        <div className="support-grid">
            {[
                { title: "Dedicated Onboarding", description: "Our specialists will guide your team through the entire setup, integration, and training process to ensure a seamless transition." },
                { title: "Round-the-Clock Support", description: "Mission-critical support is always available. Our technical team is on standby 24/7/365 to assist with any issue, day or night." },
                { title: "Continuous Updates", description: "We are constantly improving GuardianNet with new features, performance boosts, and security enhancements, delivered seamlessly." }
            ].map((item, i) => (
                <motion.div key={i} className="support-card" variants={itemVariants}>
                    <div className="card-glow"/>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                </motion.div>
            ))}
        </div>
    </Section>
);

// ENHANCED: This section now features an interactive 3D button and enhanced layout
const CtaSection = ({ onSignInClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <section className="cta-section" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      minHeight: '80vh' 
    }}>
      <div className="hero-aurora-bg"/>
      <div className="container" style={{ textAlign: 'center' }}>
        <motion.div 
          className="cta-content"
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, amount: 0.2 }}
          variants={containerVariants}
        >
          <motion.h2 variants={itemVariants}>
            Ready to Revolutionize Your Emergency Response?
          </motion.h2>
          
          <motion.p className="cta-description" variants={itemVariants}>
            Experience the future of emergency management with GuardianNet's cutting-edge platform.
            Schedule a demo today and see how we can empower your team and protect your community.
          </motion.p>
          
          <motion.div 
            className="cta-buttons"
            variants={itemVariants}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
          >
            {/* Report Emergency Button */}
            <motion.button 
              className="btn-cta primary"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: '0 8px 30px rgba(255, 59, 48, 0.6)',
                y: -2
              }}
              whileTap={{ 
                scale: 0.98,
                boxShadow: '0 2px 10px rgba(255, 59, 48, 0.4)'
              }}
              onClick={onSignInClick}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20
              }}
            >
              <span className="btn-text">Report Emergency</span>
              <span className="btn-icon">🚨</span>
            </motion.button>
            
            {/* Contact Sales Button */}
            <motion.button 
              className="btn-cta secondary"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
                y: -2,
                backgroundColor: 'rgba(255, 255, 255, 0.15)'
              }}
              whileTap={{ 
                scale: 0.98,
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20
              }}
              onClick={onSignInClick}
            >
              <span className="btn-text">Contact Support</span>
              <span className="btn-icon">💬</span>
            </motion.button>
          </motion.div>
          
          {/* Floating elements for decoration */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="cta-floating"
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

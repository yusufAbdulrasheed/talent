import { useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  EyeOff,
  FileUser,
  GraduationCap,
  Handshake,
  ListChecks,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Star,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import TextareaField from '../../../components/ui/TextareaField/TextareaField.jsx';
import { AVATAR_FACES, PHOTOS, photoUrl } from '../../../constants/photos.js';
import styles from './HomePage.module.scss';

const HERO_STATS = [
  { value: '2,400+', label: 'Verified talents' },
  { value: '180+', label: 'Hiring partners' },
  { value: '95%', label: 'Placement rate' },
];

const JOURNEYS = [
  {
    icon: GraduationCap,
    title: 'For talents',
    blurb: 'Build your skills, get verified and join a pool of top talent.',
    steps: [
      { icon: UserPlus, label: 'Create your account' },
      { icon: FileUser, label: 'Build your profile' },
      { icon: GraduationCap, label: 'Complete your training' },
      { icon: ShieldCheck, label: 'Get verified' },
      { icon: Users, label: 'Join the talent pool' },
    ],
  },
  {
    icon: Building2,
    title: 'For employers',
    blurb: 'Find the right people, faster and smarter.',
    steps: [
      { icon: Building2, label: 'Create your company profile' },
      { icon: Search, label: 'Discover talent' },
      { icon: ListChecks, label: 'Shortlist professionals' },
      { icon: CalendarCheck, label: 'Request a placement' },
      { icon: Handshake, label: 'Hire' },
    ],
  },
];

const FEATURES = [
  {
    icon: GraduationCap,
    title: 'Trained',
    body: 'Every candidate completes industry-relevant training and assessment before joining the pool.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified',
    body: 'Identity, education and documents are reviewed by our team for your peace of mind.',
  },
  {
    icon: EyeOff,
    title: 'Anonymous until placement',
    body: 'Recruiters search by skill, location, and certification. Identities stay protected until a request is made.',
  },
];

const EMPLOYER_POINTS = [
  'Access a pool of pre-qualified talent',
  'Save time with skill and location matching',
  'Hire with confidence',
];

const SAMPLE_MATCHES = [
  { reference: 'TAL-2026-00142', role: 'Accounts & Finance', score: '96%' },
  { reference: 'TAL-2026-00087', role: 'Software Engineering', score: '93%' },
  { reference: 'TAL-2026-00213', role: 'HR & People', score: '91%' },
  { reference: 'TAL-2026-00059', role: 'Data Analysis', score: '88%' },
];

const MATCH_CRITERIA = ['Skills match', 'Location match', 'Certified', 'Job-ready'];

const GALLERY = [
  { id: PHOTOS.womanCoding, alt: 'A trainee writing code at her laptop' },
  { id: PHOTOS.studyGroupLaptops, alt: 'Three trainees studying together on laptops' },
  { id: PHOTOS.manBeret, alt: 'A smiling young professional' },
  { id: PHOTOS.techPairServerRoom, alt: 'Two engineers with laptops in a server room' },
  { id: PHOTOS.womanBraidsConfident, alt: 'A confident graduate of the programme' },
];

const PATHS = [
  {
    icon: GraduationCap,
    title: 'For talents',
    body: 'Register, complete your profile and documents, and get added to a verified pool that employers search.',
    action: { to: '/register', label: 'Register as talent' },
    photo: PHOTOS.womanSmilingWhite,
  },
  {
    icon: Search,
    title: 'For recruiters',
    body: 'Search approved, anonymous candidate profiles by skill, location, and certification, then submit a placement request.',
    action: { to: '/register', label: 'Register as recruiter' },
    photo: PHOTOS.handshake,
  },
  {
    icon: Users,
    title: 'For trainers',
    body: 'See the programmes and batches assigned to you, your candidate counts, and announcements from the administrator.',
    action: { to: '/login', label: 'Trainer sign in' },
    photo: PHOTOS.laptopMeeting,
  },
];

const TESTIMONIALS = [
  {
    quote:
      'We filled three senior roles in under a month. Every candidate was pre-vetted and genuinely job-ready.',
    name: 'Amara Obi',
    role: 'Head of Talent, Meridian Group',
    avatar: photoUrl(PHOTOS.womanOfficeGlasses, 96, 96),
  },
  {
    quote:
      'The training was practical and intense. Two weeks after finishing, I had an offer through the platform.',
    name: 'Daniel Mensah',
    role: 'Backend Engineer',
    avatar: photoUrl(PHOTOS.manGlasses, 96, 96),
  },
  {
    quote:
      'Being able to shortlist anonymously kept our process fair, and the profiles were consistently strong.',
    name: 'Ngozi Eze',
    role: 'Recruitment Lead, NorthBridge',
    avatar: photoUrl(PHOTOS.womanAfricanPrint, 96, 96),
  },
];

const FAQS = [
  {
    q: 'How are candidates verified?',
    a: 'Talents complete a structured training programme, are assessed by their trainer, and are reviewed by an administrator before being published to the pool.',
  },
  {
    q: 'When do recruiters see a candidate’s identity?',
    a: 'Profiles are anonymous while recruiters search and shortlist. Full details are shared only after a placement request is approved.',
  },
  {
    q: 'What does training cost?',
    a: 'Training is free once you are accepted into the programme — there is no enrolment fee.',
  },
  {
    q: 'Can employers request a specific skill set?',
    a: 'Yes. Recruiters filter by skill, location, and certification, then submit a placement request describing the role in detail.',
  },
  {
    q: 'Who runs the training programmes?',
    a: 'Dedicated trainers are assigned to programmes and batches by the administrator and manage candidate progress throughout.',
  },
];

const EMPTY_FORM = { firstName: '', lastName: '', email: '', message: '' };

function HomePage() {
  const [openFaq, setOpenFaq] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    setForm(EMPTY_FORM);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Connecting talent with opportunity</p>
            <h1 className={styles.headline}>
              Better talent.
              <span>Better hiring.</span>
            </h1>
            <p className={styles.lead}>
              Prepare, verify and connect with professionals who are ready for their next
              opportunity &mdash; with candidate identity protected until placement.
            </p>
            <div className={styles.heroActions}>
              <Button to="/register" size="lg">
                Join the talent pool
                <ArrowRight size={18} aria-hidden="true" />
              </Button>
              <Button to="/register" size="lg" variant="secondary" className={styles.heroGhost}>
                Find talent
                <Search size={18} aria-hidden="true" />
              </Button>
            </div>
            <dl className={styles.heroStats}>
              {HERO_STATS.map((stat) => (
                <div key={stat.label}>
                  <dt>{stat.value}</dt>
                  <dd>{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className={styles.heroMedia}>
            <span className={styles.heroGlow} aria-hidden="true" />
            <img
              className={styles.heroPhoto}
              src={photoUrl(PHOTOS.womanYellowBlazer, 900, 1000)}
              alt="A smiling professional holding a tablet"
              loading="eager"
            />
            <img
              className={styles.heroPhotoAccent}
              src={photoUrl(PHOTOS.manBlueSuit, 360, 440)}
              alt=""
              loading="eager"
            />
            <p className={styles.heroScript} aria-hidden="true">
              Skilled.
              <br />
              Verified.
              <br />
              Ready.
            </p>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeIcon}>
                <ShieldCheck size={18} aria-hidden="true" />
              </span>
              <div>
                <strong>Identity protected</strong>
                <span>Anonymous until you request placement</span>
              </div>
            </div>
            <div className={styles.heroPeople}>
              <div className={styles.heroAvatars}>
                {AVATAR_FACES.map((id) => (
                  <img key={id} src={photoUrl(id, 80, 80)} alt="" loading="lazy" />
                ))}
              </div>
              <span>Joined by 2,400+ candidates</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.how} aria-labelledby="how-heading">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionEyebrow}>How it works</p>
            <h2 id="how-heading" className={styles.sectionTitle}>
              A simple process. A world of opportunity.
            </h2>
            <p className={styles.sectionLead}>
              Whether you&rsquo;re a talent or an employer, getting started is easy.
            </p>
          </div>

          <div className={styles.journeys}>
            {JOURNEYS.map((journey) => (
              <div key={journey.title} className={styles.journey}>
                <div className={styles.journeyIntro}>
                  <span className={styles.journeyIcon}>
                    <journey.icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{journey.title}</h3>
                    <p>{journey.blurb}</p>
                  </div>
                </div>
                <ol className={styles.journeySteps}>
                  {journey.steps.map((step) => (
                    <li key={step.label}>
                      <span className={styles.journeyStepIcon}>
                        <step.icon size={20} aria-hidden="true" />
                      </span>
                      <span>{step.label}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.features} aria-labelledby="features-heading">
        <div className={styles.featuresInner}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionEyebrow}>Quality you can trust</p>
            <h2 id="features-heading" className={styles.sectionTitle}>
              Talent that comes prepared.
            </h2>
            <p className={styles.sectionLead}>
              Our pool is made up of professionals who have completed training, verified their
              identity and are ready to contribute from day one.
            </p>
            <div className={styles.featurePhotos} aria-hidden="true">
              <img src={photoUrl(PHOTOS.manTraditionalCap, 400, 480)} alt="" loading="lazy" />
              <img src={photoUrl(PHOTOS.womanLaughing, 400, 480)} alt="" loading="lazy" />
              <img src={photoUrl(PHOTOS.manBlackSweater, 400, 480)} alt="" loading="lazy" />
            </div>
          </div>
          <ul className={styles.featureGrid}>
            {FEATURES.map((feature) => (
              <li key={feature.title} className={styles.featureCard}>
                <span className={styles.featureIcon}>
                  <feature.icon size={22} aria-hidden="true" />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.employers} aria-labelledby="employers-heading">
        <div className={styles.employersInner}>
          <div className={styles.employersCopy}>
            <p className={styles.sectionEyebrow}>For employers</p>
            <h2 id="employers-heading" className={styles.sectionTitle}>
              Hiring shouldn&rsquo;t feel like searching through thousands of CVs.
            </h2>
            <p className={styles.sectionLead}>
              Find pre-vetted, trained and verified talent &mdash; faster, easier and more
              accurately.
            </p>
            <ul className={styles.checklist}>
              {EMPLOYER_POINTS.map((point) => (
                <li key={point}>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
            <Button to="/services" size="lg">
              Learn more about hiring
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </div>

          <div className={styles.matchDemo} aria-hidden="true">
            <img className={styles.matchPhoto} src={photoUrl(PHOTOS.manVideoCall, 800, 900)} alt="" loading="lazy" />
            <div className={styles.matchCard}>
              <p className={styles.matchHeading}>Verified professionals</p>
              <div className={styles.matchSearch}>
                <Search size={14} />
                Search by skill, location…
              </div>
              <ul className={styles.matchList}>
                {SAMPLE_MATCHES.map((match) => (
                  <li key={match.reference}>
                    <span className={styles.matchAvatar}>
                      <UserRound size={16} />
                    </span>
                    <span className={styles.matchWho}>
                      <strong>{match.reference}</strong>
                      <span>{match.role}</span>
                    </span>
                    <span className={styles.matchScore}>{match.score}</span>
                  </li>
                ))}
              </ul>
            </div>
            <ul className={styles.matchCriteria}>
              {MATCH_CRITERIA.map((criterion) => (
                <li key={criterion}>
                  <BadgeCheck size={16} />
                  {criterion}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.gallery} aria-labelledby="gallery-heading">
        <div className={styles.galleryInner}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionEyebrow}>Gain in-demand skills</p>
            <h2 id="gallery-heading" className={styles.sectionTitle}>
              The training you need to go further.
            </h2>
            <p className={styles.sectionLead}>
              Hands-on programmes, real projects, and dedicated trainers &mdash; so the people
              in the pool can contribute the moment they are placed.
            </p>
          </div>
          <div className={styles.galleryStrip}>
            {GALLERY.map((image) => (
              <img key={image.id} src={photoUrl(image.id, 480, 640)} alt={image.alt} loading="lazy" />
            ))}
          </div>
          <div className={styles.galleryActions}>
            <Button to="/training-programs">
              Explore training programs
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
            <Button to="/gallery" variant="ghost">
              View full gallery
              <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      <section className={styles.paths} aria-labelledby="paths-heading">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionEyebrow}>Choose your path</p>
            <h2 id="paths-heading" className={styles.sectionTitle}>
              One platform, three ways in
            </h2>
          </div>
          <ul className={styles.pathList}>
            {PATHS.map((path) => (
              <li key={path.title} className={styles.pathCard}>
                <img className={styles.pathPhoto} src={photoUrl(path.photo, 640, 400)} alt="" loading="lazy" />
                <span className={styles.pathIcon}>
                  <path.icon size={22} aria-hidden="true" />
                </span>
                <h3>{path.title}</h3>
                <p>{path.body}</p>
                <Button to={path.action.to} size="sm" variant="secondary">
                  {path.action.label}
                  <ArrowRight size={14} aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.testimonials} aria-labelledby="testimonials-heading">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionEyebrow}>Testimonials</p>
            <h2 id="testimonials-heading" className={styles.sectionTitle}>
              Trusted by candidates and employers alike
            </h2>
          </div>
          <ul className={styles.testimonialGrid}>
            {TESTIMONIALS.map((item) => (
              <li key={item.name} className={styles.testimonialCard}>
                <div className={styles.stars} aria-label="Rated 5 out of 5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={16} fill="currentColor" aria-hidden="true" />
                  ))}
                </div>
                <blockquote>&ldquo;{item.quote}&rdquo;</blockquote>
                <figcaption className={styles.person}>
                  <img src={item.avatar} alt="" loading="lazy" />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                  </div>
                </figcaption>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.connect} aria-labelledby="faq-heading">
        <div className={styles.connectInner}>
          <div className={styles.faq}>
            <p className={styles.sectionEyebrow}>FAQ</p>
            <h2 id="faq-heading" className={styles.sectionTitle}>
              Answers before you ask
            </h2>
            <ul className={styles.faqList}>
              {FAQS.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <li key={item.q} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>
                    <button
                      type="button"
                      className={styles.faqQuestion}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${index}`}
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    >
                      <span>{item.q}</span>
                      {isOpen ? (
                        <Minus size={18} aria-hidden="true" />
                      ) : (
                        <Plus size={18} aria-hidden="true" />
                      )}
                    </button>
                    <p id={`faq-panel-${index}`} className={styles.faqAnswer} hidden={!isOpen}>
                      {item.a}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.contactCard}>
            <h2>Get in touch</h2>
            <p>Tell us what you are hiring for or training toward, and the team will follow up.</p>
            {submitted ? (
              <div className={styles.formSuccess} role="status">
                <CheckCircle2 size={20} aria-hidden="true" />
                <p>Thanks &mdash; we&rsquo;ll be in touch within one business day.</p>
              </div>
            ) : (
              <form className={styles.contactForm} onSubmit={handleSubmit}>
                <div className={styles.formRow}>
                  <TextField
                    label="First name"
                    name="firstName"
                    value={form.firstName}
                    onChange={updateField}
                    autoComplete="given-name"
                    required
                  />
                  <TextField
                    label="Last name"
                    name="lastName"
                    value={form.lastName}
                    onChange={updateField}
                    autoComplete="family-name"
                    required
                  />
                </div>
                <TextField
                  label="Work email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  autoComplete="email"
                  required
                />
                <TextareaField
                  label="How can we help?"
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={updateField}
                  required
                />
                <Button type="submit" size="lg" fullWidth>
                  Send message
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className={styles.closing}>
        <div className={styles.closingInner}>
          <div className={styles.closingCard}>
            <div className={styles.closingCopy}>
              <h2>Your next opportunity could start here.</h2>
              <p>For talents, it&rsquo;s your future. For employers, it&rsquo;s the right people.</p>
            </div>
            <div className={styles.closingActions}>
              <Button to="/register" size="lg" variant="secondary" className={styles.closingPrimary}>
                Join the talent pool
              </Button>
              <Button to="/register" size="lg" variant="secondary" className={styles.closingGhost}>
                Find your next hire
              </Button>
            </div>
            <p className={styles.closingScript} aria-hidden="true">
              Real people. Real skills.
              <br />
              Real opportunities.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;

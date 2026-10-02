import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Clock, Mail, MapPin } from 'lucide-react';
import PublicHero from '../../../components/public/PublicHero/PublicHero.jsx';
import { PHOTOS } from '../../../constants/photos.js';
import PhotoPanel from '../../../components/public/PhotoPanel/PhotoPanel.jsx';
import PublicSection from '../../../components/public/PublicSection/PublicSection.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import TextareaField from '../../../components/ui/TextareaField/TextareaField.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import { sendContactMessage } from '../../../api/endpoints/content.js';
import { getErrorMessage } from '../../../api/http.js';
import styles from './ContactPage.module.scss';

const EMPTY = { name: '', email: '', subject: '', message: '' };

const DETAILS = [
  {
    icon: Mail,
    label: 'Email',
    value: 'sultanmagnateconsultinglimited@gmail.com',
    hint: 'We reply within one business day.',
  },
  {
    icon: MapPin,
    label: 'Office',
    value: 'No. 1 Alberka Building, Hassan Kastina Road, Zone 8, Lokoja, Kogi State',
    hint: 'Visits by appointment.',
  },
  { icon: Clock, label: 'Hours', value: 'Mon–Fri, 9am–5pm WAT', hint: 'Messages are monitored daily.' },
];

function ContactPage() {
  const [form, setForm] = useState(EMPTY);
  const mutation = useMutation({
    mutationFn: sendContactMessage,
    onSuccess: () => setForm(EMPTY),
  });

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const fieldError = (field) =>
    mutation.error?.response?.data?.details?.find((detail) => detail.field === field)?.message;

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
      ...(form.subject.trim() ? { subject: form.subject.trim() } : {}),
    };
    mutation.mutate(payload);
  };

  return (
    <>
      <PublicHero
        photos={{ main: PHOTOS.windowConversation, accent: PHOTOS.manBlueSuit }}
        script="We'd love to hear from you."
        eyebrow="Contact"
        title="Talk to the team"
        lead="Hiring, training, partnerships, or press — send a message and we'll get back to you."
      />

      <PublicSection>
        <div className={styles.layout}>
          <div className={styles.formCard}>
            <h2>Send a message</h2>
            <p className={styles.formIntro}>
              Tell us what you're hiring for or training toward.
            </p>

            {mutation.isSuccess ? (
              <div className={styles.success} role="status">
                <CheckCircle2 size={20} aria-hidden="true" />
                <p>
                  {mutation.data?.message ??
                    "Thanks for reaching out — we'll reply within one business day."}
                </p>
              </div>
            ) : (
              <form className={styles.form} noValidate onSubmit={handleSubmit}>
                {mutation.isError ? (
                  <Alert variant="error">{getErrorMessage(mutation.error)}</Alert>
                ) : null}

                <div className={styles.row}>
                  <TextField
                    label="Your name"
                    name="name"
                    value={form.name}
                    onChange={update}
                    autoComplete="name"
                    error={fieldError('name')}
                    required
                  />
                  <TextField
                    label="Email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={update}
                    autoComplete="email"
                    error={fieldError('email')}
                    required
                  />
                </div>
                <TextField
                  label="Subject"
                  name="subject"
                  value={form.subject}
                  onChange={update}
                  hint="Optional"
                  error={fieldError('subject')}
                />
                <TextareaField
                  label="Message"
                  name="message"
                  rows={5}
                  value={form.message}
                  onChange={update}
                  error={fieldError('message')}
                  required
                />
                <Button type="submit" size="lg" fullWidth isLoading={mutation.isPending}>
                  Send message
                </Button>
              </form>
            )}
          </div>

          <aside className={styles.details}>
            <PhotoPanel photo={PHOTOS.womanSmilingWhite} ratio="4 / 3" caption="We reply within one business day" />
            {DETAILS.map((detail) => (
              <div key={detail.label} className={styles.detail}>
                <span className={styles.detailIcon} aria-hidden="true">
                  <detail.icon size={18} />
                </span>
                <div>
                  <p className={styles.detailLabel}>{detail.label}</p>
                  <p className={styles.detailValue}>{detail.value}</p>
                  <p className={styles.detailHint}>{detail.hint}</p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </PublicSection>
    </>
  );
}

export default ContactPage;

import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import AuthPanel from '../AuthPanel/AuthPanel.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import Spinner from '../../../components/ui/Spinner/Spinner.jsx';
import { getErrorMessage } from '../../../api/http.js';
import { resendVerification, verifyEmail } from '../../../api/endpoints/auth.js';
import { useAuth } from '../../../auth/useAuth.js';
import { getRoleHomePath } from '../../../auth/roles.js';
import styles from './VerifyEmailPage.module.scss';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const hasVerified = useRef(false);

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => {
      if (isAuthenticated) {
        refreshUser().catch(() => {});
      }
    },
  });

  const resendMutation = useMutation({ mutationFn: resendVerification });

  const { mutate: runVerification } = verifyMutation;
  useEffect(() => {
    if (!token || hasVerified.current) {
      return;
    }

    hasVerified.current = true;
    runVerification(token);
  }, [token, runVerification]);

  if (token) {
    return (
      <AuthPanel title="Verifying your email address">
        {verifyMutation.isPending ? (
          <div className={styles.pending}>
            <Spinner label="Verifying" />
            <p>One moment while we confirm your address.</p>
          </div>
        ) : null}

        {verifyMutation.isSuccess ? (
          <>
            <Alert variant="success">Your email address is verified.</Alert>
            <Button to={isAuthenticated ? getRoleHomePath(user.role) : '/login'} fullWidth>
              {isAuthenticated ? 'Go to my dashboard' : 'Sign in'}
            </Button>
          </>
        ) : null}

        {verifyMutation.isError ? (
          <>
            <Alert variant="error">
              {getErrorMessage(verifyMutation.error, 'This verification link is invalid or has expired.')}
            </Alert>
            <p className={styles.hint}>Request a new link below.</p>
            <ResendForm
              email={email}
              setEmail={setEmail}
              mutation={resendMutation}
              defaultEmail={user?.email}
            />
          </>
        ) : null}
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      title="Verify your email address"
      subtitle="Enter your email address and we will send you a fresh verification link."
      footer={<Link to="/login">Back to sign in</Link>}
    >
      <ResendForm email={email} setEmail={setEmail} mutation={resendMutation} defaultEmail={user?.email} />
    </AuthPanel>
  );
}

function ResendForm({ email, setEmail, mutation, defaultEmail }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    mutation.mutate(email || defaultEmail);
  };

  if (mutation.isSuccess) {
    return (
      <Alert variant="success">
        If your account still needs verification, a new link is on its way. It expires in one hour.
      </Alert>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {mutation.isError ? <Alert variant="error">{getErrorMessage(mutation.error)}</Alert> : null}

      <TextField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        placeholder={defaultEmail}
        onChange={(event) => setEmail(event.target.value)}
      />

      <Button type="submit" fullWidth isLoading={mutation.isPending}>
        Send verification link
      </Button>
    </form>
  );
}

export default VerifyEmailPage;

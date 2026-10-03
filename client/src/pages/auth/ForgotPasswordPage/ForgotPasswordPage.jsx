import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import AuthPanel from '../AuthPanel/AuthPanel.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import { getErrorMessage } from '../../../api/http.js';
import { requestPasswordReset } from '../../../api/endpoints/auth.js';
import styles from './ForgotPasswordPage.module.scss';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const resetMutation = useMutation({ mutationFn: requestPasswordReset });

  const handleSubmit = (event) => {
    event.preventDefault();
    resetMutation.mutate(email);
  };

  if (resetMutation.isSuccess) {
    return (
      <AuthPanel
        title="Check your inbox"
        footer={<Link to="/login">Back to sign in</Link>}
      >
        <Alert variant="success">
          If an account exists for {email}, we have sent password reset instructions. The link expires in one hour.
        </Alert>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      title="Reset your password"
      subtitle="Enter your email address and we will send you a reset link."
      footer={<Link to="/login">Back to sign in</Link>}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {resetMutation.isError ? (
          <Alert variant="error">{getErrorMessage(resetMutation.error)}</Alert>
        ) : null}

        <TextField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Button type="submit" fullWidth isLoading={resetMutation.isPending}>
          Send reset link
        </Button>
      </form>
    </AuthPanel>
  );
}

export default ForgotPasswordPage;

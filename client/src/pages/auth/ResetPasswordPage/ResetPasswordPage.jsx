import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import AuthPanel from '../AuthPanel/AuthPanel.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import { getErrorMessage } from '../../../api/http.js';
import { resetPassword } from '../../../api/endpoints/auth.js';
import styles from './ResetPasswordPage.module.scss';

const MIN_PASSWORD_LENGTH = 8;

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [validationError, setValidationError] = useState(null);

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => navigate('/login', { replace: true, state: { passwordReset: true } }),
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setValidationError(`Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setValidationError('The two passwords do not match.');
      return;
    }

    setValidationError(null);
    resetMutation.mutate({ token, password: form.password });
  };

  if (!token) {
    return (
      <AuthPanel title="This link is incomplete" footer={<Link to="/forgot-password">Request a new link</Link>}>
        <Alert variant="error">
          The reset link is missing its token. Request a new one and open the most recent email.
        </Alert>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      title="Choose a new password"
      subtitle="You will be signed out everywhere once your password changes."
      footer={<Link to="/login">Back to sign in</Link>}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {validationError ? <Alert variant="error">{validationError}</Alert> : null}
        {resetMutation.isError ? (
          <Alert variant="error">{getErrorMessage(resetMutation.error)}</Alert>
        ) : null}

        <TextField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          value={form.password}
          onChange={handleChange}
        />

        <TextField
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={handleChange}
        />

        <Button type="submit" fullWidth isLoading={resetMutation.isPending}>
          Update password
        </Button>
      </form>
    </AuthPanel>
  );
}

export default ResetPasswordPage;

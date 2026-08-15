import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import AuthPanel from '../AuthPanel/AuthPanel.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import { getErrorMessage } from '../../../api/http.js';
import { useAuth } from '../../../auth/useAuth.js';
import { getRoleHomePath } from '../../../auth/roles.js';
import styles from './LoginPage.module.scss';

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });

  const loginMutation = useMutation({
    mutationFn: signIn,
    onSuccess: (user) => {
      // Prefer the page the guard bounced them off, falling back to the portal.
      const intended = location.state?.from?.pathname;
      navigate(intended ?? getRoleHomePath(user.role), { replace: true });
    },
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    loginMutation.mutate(form);
  };

  return (
    <AuthPanel
      title="Sign in"
      subtitle="Access your talent, recruiter, trainer, or administrator portal."
      footer={
        <>
          Don&apos;t have an account? <Link to="/register">Register</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {location.state?.passwordReset ? (
          <Alert variant="success">Your password has been updated. Sign in with your new password.</Alert>
        ) : null}

        {loginMutation.isError ? (
          <Alert variant="error">{getErrorMessage(loginMutation.error, 'Unable to sign in.')}</Alert>
        ) : null}

        <TextField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={handleChange}
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={form.password}
          onChange={handleChange}
        />

        <Link className={styles.forgot} to="/forgot-password">
          Forgot your password?
        </Link>

        <Button type="submit" fullWidth isLoading={loginMutation.isPending}>
          Sign in
        </Button>
      </form>
    </AuthPanel>
  );
}

export default LoginPage;

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import AuthPanel from '../AuthPanel/AuthPanel.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import TextField from '../../../components/ui/TextField/TextField.jsx';
import { getErrorMessage } from '../../../api/http.js';
import { useAuth } from '../../../auth/useAuth.js';
import { USER_ROLES, getRoleHomePath } from '../../../auth/roles.js';
import styles from './RegisterPage.module.scss';

// Trainer and administrator accounts are created by an administrator, never
// through public registration — the API rejects them too.
const REGISTRABLE_ROLES = [
  { value: USER_ROLES.TALENT, label: 'Talent', hint: 'Train with us and join the talent pool.' },
  { value: USER_ROLES.RECRUITER, label: 'Recruiter', hint: 'Hire from our pool of approved candidates.' },
];

function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedRole = searchParams.get('role');
  const initialRole = REGISTRABLE_ROLES.some((role) => role.value === requestedRole)
    ? requestedRole
    : USER_ROLES.TALENT;

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: initialRole,
  });

  const registerMutation = useMutation({
    mutationFn: signUp,
    onSuccess: (user) => navigate(getRoleHomePath(user.role), { replace: true }),
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    registerMutation.mutate(form);
  };

  return (
    <AuthPanel
      title="Create your account"
      subtitle="Register as a talent or as a recruiting company."
      footer={
        <>
          Already registered? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {registerMutation.isError ? (
          <Alert variant="error">{getErrorMessage(registerMutation.error, 'Unable to create your account.')}</Alert>
        ) : null}

        <fieldset className={styles.roles}>
          <legend className={styles.legend}>I am registering as</legend>
          {REGISTRABLE_ROLES.map((role) => (
            <label key={role.value} className={styles.role}>
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={form.role === role.value}
                onChange={handleChange}
              />
              <span>
                <span className={styles.roleLabel}>{role.label}</span>
                <span className={styles.roleHint}>{role.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className={styles.row}>
          <TextField
            label="First name"
            name="firstName"
            autoComplete="given-name"
            required
            value={form.firstName}
            onChange={handleChange}
          />
          <TextField
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            required
            value={form.lastName}
            onChange={handleChange}
          />
        </div>

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
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
          value={form.password}
          onChange={handleChange}
        />

        <Button type="submit" fullWidth isLoading={registerMutation.isPending}>
          Create account
        </Button>
      </form>
    </AuthPanel>
  );
}

export default RegisterPage;

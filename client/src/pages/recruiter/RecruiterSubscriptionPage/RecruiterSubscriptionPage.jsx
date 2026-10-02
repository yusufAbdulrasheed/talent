import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, CreditCard } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader/PageHeader.jsx';
import Card from '../../../components/ui/Card/Card.jsx';
import Button from '../../../components/ui/Button/Button.jsx';
import StatusBadge from '../../../components/ui/StatusBadge/StatusBadge.jsx';
import Alert from '../../../components/feedback/Alert/Alert.jsx';
import QueryBoundary from '../../../components/feedback/QueryBoundary/QueryBoundary.jsx';
import { getMySubscription, initializeSubscriptionCheckout } from '../../../api/endpoints/recruiter.js';
import { queryKeys } from '../../../api/queryKeys.js';
import { getErrorMessage } from '../../../api/http.js';
import { formatCurrency, formatDate } from '../../../utils/format.js';
import styles from './RecruiterSubscriptionPage.module.scss';

const TIER_RANK = { junior: 0, intermediate: 1, senior: 2 };

const TIERS = [
  {
    value: 'junior',
    label: 'Junior',
    description: 'Free, forever. Browse and request entry-level and junior talent.',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Unlocks mid-level talent, on top of everything in Junior.',
  },
  {
    value: 'senior',
    label: 'Senior',
    description: 'Unlocks senior-level talent, on top of everything in Intermediate.',
  },
];

function TierCard({ tier, subscription, onSubscribe, isPending }) {
  const isCurrent = subscription.tier === tier.value;
  const isPaid = tier.value !== 'junior';
  const price = isPaid ? subscription.pricing[tier.value] : 0;
  // A lower tier than what's already active is rejected server-side; same
  // tier is a renewal (allowed) and a higher tier is a normal purchase.
  const disabled = TIER_RANK[tier.value] < TIER_RANK[subscription.tier] || !price;

  return (
    <Card
      className={`${styles.tierCard} ${isCurrent ? styles.tierCardCurrent : ''}`}
      title={tier.label}
      actions={isCurrent ? <StatusBadge tone="success">Current</StatusBadge> : null}
      description={tier.description}
    >
      <p className={styles.price}>
        {isPaid ? (price ? `${formatCurrency(price)} / month` : 'Not available') : 'Free'}
      </p>

      {isCurrent && isPaid && subscription.tierExpiresAt ? (
        <p className={styles.expiry}>Renews or expires {formatDate(subscription.tierExpiresAt)}</p>
      ) : null}

      {isPaid ? (
        <Button
          onClick={() => onSubscribe(tier.value)}
          isLoading={isPending}
          disabled={disabled}
        >
          {isCurrent ? <Check size={16} aria-hidden="true" /> : null}
          {isCurrent ? 'Renew' : 'Subscribe'}
        </Button>
      ) : (
        <StatusBadge tone={isCurrent ? 'success' : 'neutral'}>{isCurrent ? 'Active' : 'Always included'}</StatusBadge>
      )}
    </Card>
  );
}

function RecruiterSubscriptionPage() {
  const subscriptionQuery = useQuery({ queryKey: queryKeys.recruiter.subscription, queryFn: getMySubscription });

  const checkoutMutation = useMutation({
    mutationFn: initializeSubscriptionCheckout,
    // Paystack hosts the checkout, so this is a full page handoff. The
    // webhook is what actually activates the tier; the return URL only
    // reports the outcome.
    onSuccess: ({ authorizationUrl }) => {
      window.location.href = authorizationUrl;
    },
  });

  return (
    <>
      <PageHeader
        title="Subscription"
        description="Junior-level talent is always free to browse and request. Unlock more experienced talent with a monthly subscription."
      />

      {checkoutMutation.isError ? (
        <Alert variant="error">{getErrorMessage(checkoutMutation.error, 'Unable to start checkout.')}</Alert>
      ) : null}

      <QueryBoundary query={subscriptionQuery} loadingLabel="Loading your subscription">
        {(subscription) => (
          <div className={styles.tiers}>
            {TIERS.map((tier) => (
              <TierCard
                key={tier.value}
                tier={tier}
                subscription={subscription}
                onSubscribe={(value) => checkoutMutation.mutate({ tier: value })}
                isPending={checkoutMutation.isPending && checkoutMutation.variables?.tier === tier.value}
              />
            ))}
          </div>
        )}
      </QueryBoundary>

      <Card
        title={
          <span className={styles.cardTitle}>
            <CreditCard size={18} aria-hidden="true" />
            How billing works
          </span>
        }
      >
        <p className={styles.body}>
          Subscriptions are billed once per 30 days through Paystack — there is no stored card and
          no automatic recurring charge. When your tier expires, your account reverts to the free
          Junior tier until you subscribe again.
        </p>
      </Card>
    </>
  );
}

export default RecruiterSubscriptionPage;

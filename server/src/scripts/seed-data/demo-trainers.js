/**
 * Demo trainer accounts for `npm run seed:demo`.
 *
 * One trainer, created the same way the admin's "Add trainer" form does
 * (a plain User with role `trainer`) — except the seeder sets the shared demo
 * password directly instead of sending a real invite email, so the account is
 * usable immediately. The trainer portal in this build is read-only (no
 * programme or batch is seeded here), so an empty "No assignments yet" state
 * is the correct thing to see on first login, not a sign something is missing.
 *
 * `slug` doubles as the demo email domain (`<slug>.demo.test`), matching the
 * talent and recruiter seed files. Fictional person, reserved `.test` TLD.
 */
export const DEMO_TRAINERS = Object.freeze([
  {
    firstName: 'Emmanuel',
    lastName: 'Okonkwo',
    slug: 'trainers',
  },
]);

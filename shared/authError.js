// Firebase Auth errors come with messages like "Firebase: Error (auth/email-already-in-use)." which mean
// nothing to a user. This maps the error code to a sentence people can act on.
const MESSAGES = {
  'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
  'auth/invalid-email': 'That email address is not valid.',
  'auth/weak-password': 'The password is too weak. Use at least 6 characters.',
  'auth/missing-password': 'Please enter your password.',
  'auth/missing-email': 'Please enter your email.',
  'auth/user-not-found': 'No account was found with this email.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/invalid-login-credentials': 'Wrong email or password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
  'auth/requires-recent-login': 'For security, please log out and log in again, then retry.',
  'auth/credential-already-in-use': 'This email is already used by another account.',
  'auth/operation-not-allowed': 'This action is not available right now.',
  'auth/expired-action-code': 'This link has expired. Please request a new one.',
  'auth/invalid-action-code': 'This link is no longer valid. Please request a new one.',
  'auth/user-token-expired': 'Your session has expired. Please log in again.',
};

export const friendlyAuthError = (error) =>
  (error && MESSAGES[error.code]) || 'Something went wrong. Please try again.';

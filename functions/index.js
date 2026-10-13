const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();
// Old conversations (and invites) were written by earlier versions of the app and may lack fields such as
// title / body / authorID. Writing `undefined` to Firestore throws, which made joining them fail with an
// internal error; undefined properties are simply skipped now.
db.settings({ ignoreUndefinedProperties: true });
const { FieldValue, Timestamp } = admin.firestore;

// Keep this in the same region as the Firestore database (Firebase console > Firestore > Data: "Location").
// The app must call the functions in this same region: getFunctions(getApp(), '<this region>').
// Changing it later means redeploying and deleting the functions left in the old region.
const REGION = 'europe-west1';
setGlobalOptions({ region: REGION, maxInstances: 10 });

const MIN_PASSWORD = 6;   // same limits as the form in components/newconv/ConversationForm.js
const MAX_PASSWORD = 16;
const MAX_ATTEMPTS = 5;               // wrong passwords before a temporary lock
const LOCK_MINUTES = 15;

// ---- password hashing (scrypt + random salt; stored only in ConversationSecrets, which clients can't read)

const scrypt = (password, salt) => new Promise((resolve, reject) => {
  crypto.scrypt(password, salt, 64, (err, key) => err ? reject(err) : resolve(key));
});

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt);
  return { algo: 'scrypt', salt: salt.toString('base64'), hash: key.toString('base64') };
};

const verifyPassword = async (password, record) => {
  const key = await scrypt(password, Buffer.from(record.salt, 'base64'));
  const expected = Buffer.from(record.hash, 'base64');
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
};

// ---- helpers

// Every deliberate refusal is logged (never the password), so "why was I refused" can be read in the logs:
// npx firebase-tools functions:log --only joinConversation
const reject = (code, message, details) => {
  logger.warn('refused', { code, message, details });
  return new HttpsError(code, message, details);
};

const requireAuth = (request) => {
  if (!request.auth) throw reject('unauthenticated', 'You must be signed in.');
  return request.auth.uid;
};

const requireString = (value, name) => {
  if (typeof value !== 'string' || value.length === 0)
    throw reject('invalid-argument', `${name} is required.`);
  return value;
};

// Conversation ids are Firestore auto ids; refuse anything that could be a path.
const requireConversationId = (value) => {
  const id = requireString(value, 'conversationId');
  if (id.includes('/') || id.length > 100)
    throw reject('invalid-argument', 'Invalid conversationId.');
  return id;
};

const requirePasswordFormat = (password) => {
  requireString(password, 'password');
  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD)
    throw reject('invalid-argument', `Password must be ${MIN_PASSWORD}-${MAX_PASSWORD} characters.`);
  return password;
};

// Get the stored secret. Conversations created before this change only have a plaintext `password`
// field on the conversation document: hash it now (lazy migration) so they keep working.
const getSecret = async (conversationId, conversation) => {
  const ref = db.doc(`ConversationSecrets/${conversationId}`);
  const snap = await ref.get();
  if (snap.exists) return snap.data();

  if (typeof conversation.password === 'string' && conversation.password.length > 0) {
    const record = { ...(await hashPassword(conversation.password)), migrated: true, updatedAt: FieldValue.serverTimestamp() };
    await ref.set(record);
    return record;
  }
  return null;
};

// Allows MAX_ATTEMPTS wrong passwords per (conversation, user), then locks that pair for LOCK_MINUTES.
const checkPassword = async (conversationId, uid, password, secret) => {
  const attemptRef = db.doc(`JoinAttempts/${conversationId}_${uid}`);

  const attempt = (await attemptRef.get()).data() || {};
  if (attempt.lockedUntil && attempt.lockedUntil.toMillis() > Date.now())
    throw reject('resource-exhausted', 'Too many wrong attempts. Try again in a few minutes.');

  if (await verifyPassword(password, secret)) {
    if (attempt.count || attempt.lockedUntil) await attemptRef.delete();
    return;
  }

  const count = (attempt.count || 0) + 1;
  if (count >= MAX_ATTEMPTS) {
    await attemptRef.set({
      count: 0,
      lockedUntil: Timestamp.fromMillis(Date.now() + LOCK_MINUTES * 60 * 1000),
    });
  } else {
    await attemptRef.set({ count });
  }
  throw reject('permission-denied', 'Incorrect Password!');
};

// Being invited is a way in without the password (that is how the app worked: the invites screen joins
// directly). Only the conversation AUTHOR can invite people (the app has no other invite feature, and the
// Firestore rules only let the author create invite documents), so an invite only counts when it names
// the author as its sender. A made-up invite from anybody else does not open a protected conversation.
const hasValidInvite = async (conversationId, uid, conversation) => {
  const snaps = await Promise.all([
    db.doc(`Users/${uid}/Friends Invites/${conversationId}`).get(),
    db.doc(`Users/${uid}/Other Invites/${conversationId}`).get(),
  ]);

  return snaps.some(snap => snap.exists && snap.get('authorID') === conversation.authorID);
};

// ---- callable functions

// Author sets (or changes) the password of their conversation. The app calls this right after creating a
// conversation with hasPassword: true (and without sending the password in the document).
exports.setConversationPassword = onCall(async (request) => {
  const uid = requireAuth(request);
  const conversationId = requireConversationId(request.data && request.data.conversationId);
  const password = requirePasswordFormat(request.data && request.data.password);

  const conversation = await db.doc(`Conversations/${conversationId}`).get();
  if (!conversation.exists) throw reject('not-found', 'Conversation not found.');
  if (conversation.get('authorID') !== uid)
    throw reject('permission-denied', 'Only the author can set the password.');
  if (conversation.get('hasPassword') !== true)
    throw reject('failed-precondition', 'This conversation is not password protected.');

  const record = { ...(await hashPassword(password)), updatedAt: FieldValue.serverTimestamp() };
  await db.doc(`ConversationSecrets/${conversationId}`).set(record);

  return { ok: true };
});

// Join a conversation by id (+ password when it has one). Does what Home.js used to do on the client:
// participant doc, "joined" comment, removing the invites, "My Conversations" entry.
exports.joinConversation = onCall(async (request) => {
  const uid = requireAuth(request);
  const conversationId = requireConversationId(request.data && request.data.conversationId);
  const password = request.data && request.data.password;

  const conversationRef = db.doc(`Conversations/${conversationId}`);
  const conversationSnap = await conversationRef.get();
  if (!conversationSnap.exists) throw reject('not-found', 'No conversations found!', { reason: 'conversation-not-found' });
  const conversation = conversationSnap.data();

  const participantRef = db.doc(`Conversations/${conversationId}/Participants/${uid}`);
  const participant = await participantRef.get();
  const alreadyIn = participant.exists && participant.get('removed') === false;

  if (!alreadyIn) {
    const invited = conversation.hasPassword ? await hasValidInvite(conversationId, uid, conversation) : false;
    logger.info('join attempt', { conversationId, uid, hasPassword: !!conversation.hasPassword, invited });

    if (conversation.hasPassword && !invited) {
      if (typeof password !== 'string' || password.length === 0)
        throw reject('failed-precondition', 'This conversation needs a password.', { reason: 'password-required' });

      const secret = await getSecret(conversationId, conversation);
      if (!secret)
        throw reject('failed-precondition', 'This conversation has no password configured yet.');

      await checkPassword(conversationId, uid, password, secret);
    }

    const userRecord = await admin.auth().getUser(uid);
    const batch = db.batch();

    batch.set(participantRef, {
      ID: uid,
      Name: userRecord.displayName || '',
      Admin: false,
      removed: false,
      lastEnter: Timestamp.now(),
      lastExit: Timestamp.now(),
    });

    batch.delete(db.doc(`Users/${uid}/Friends Invites/${conversationId}`));
    batch.delete(db.doc(`Users/${uid}/Other Invites/${conversationId}`));

    batch.set(db.collection(`Conversations/${conversationId}/Comments`).doc(), {
      comment: 'joined',
      author: userRecord.displayName || '',
      authorID: uid,
      timeStamp: FieldValue.serverTimestamp(),
      system: true,
      Name2: userRecord.displayName || '',
      uri2: userRecord.photoURL || null,
      removed2: false,
    });

    await batch.commit();
  }

  const myConversationRef = db.doc(`Users/${uid}/My Conversations/${conversationId}`);
  if (!(await myConversationRef.get()).exists) {
    await myConversationRef.set({
      authorID: conversation.authorID || '',
      title: conversation.title || '',
      body: conversation.body || '',
      dateCreated: Timestamp.now(),
      lastAccessed: Timestamp.now(),
      unread: 0,
    });
  }

  return { ok: true, id: conversationId };
});

const admin = require('firebase-admin');
const crypto = require('crypto');

const PROJECT_ID = 'convos-app-1';
const apply = process.argv.includes('--apply');
const scrub = process.argv.includes('--scrub');

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const { FieldValue } = admin.firestore;

const scrypt = (password, salt) => new Promise((resolve, reject) => {
  crypto.scrypt(password, salt, 64, (err, key) => err ? reject(err) : resolve(key));
});

async function main() {
  console.log(`${apply ? 'APPLY' : 'DRY RUN'}${scrub ? ' + SCRUB' : ''} on project ${PROJECT_ID}`);

  const snap = await db.collection('Conversations').where('hasPassword', '==', true).get();
  console.log(`password protected conversations: ${snap.size}`);

  let hashed = 0, alreadyHashed = 0, scrubbed = 0, missing = 0;

  for (const conv of snap.docs) {
    const plain = conv.get('password');
    const secretRef = db.doc(`ConversationSecrets/${conv.id}`);
    const secret = await secretRef.get();

    if (!secret.exists) {
      if (typeof plain !== 'string' || plain.length === 0) {
        missing++;
        console.log(`  ${conv.id}: no plaintext password and no secret (skipped)`);
        continue;
      }
      if (apply) {
        const salt = crypto.randomBytes(16);
        const key = await scrypt(plain, salt);
        await secretRef.set({
          algo: 'scrypt', salt: salt.toString('base64'), hash: key.toString('base64'),
          migrated: true, updatedAt: FieldValue.serverTimestamp(),
        });
      }
      hashed++;
    } else {
      alreadyHashed++;
    }

    if (scrub && typeof plain === 'string') {
      if (apply) await conv.ref.update({ password: FieldValue.delete() });
      scrubbed++;
    }
  }

  console.log(`hashed: ${hashed}, already hashed: ${alreadyHashed}, plaintext removed: ${scrubbed}, skipped: ${missing}`);
  if (!apply) console.log('Dry run only. Re-run with --apply to write.');
}

main().catch(err => { console.error(err); process.exit(1); });

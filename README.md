# CONVOS

A social app for conversations between groups, built with React Native, Expo and Firebase. Users start a
conversation (optionally protected by a password), invite friends or anyone with a conversation ID, and chat in it
with push notifications for new messages.

It started in 2022 as a learning project, was released in 2023, and was brought back in 2026: upgraded from
Expo SDK 45 to 57 (React Native 0.68 to 0.86, React 17 to 19), its screens refactored into hooks, services and
components, and its backend security rewritten.

<!-- Add screenshots here, e.g. a row of 3-4 images: login, conversations list, a conversation, friends. -->

## Features

- Email sign-up with email verification, password reset, profile photo and name editing
- Create conversations, optionally protected by a password; join by conversation ID or by invitation
- Comments in real time, unread counter, system messages when people join or leave, mute per conversation
- Friends: send, approve, ignore and cancel requests, remove and block users, search by user ID
- Share and scan user / conversation IDs with QR codes
- Push notifications (Expo Notifications) with per-user notification settings
- Light and dark themes (Redux Toolkit), image caching, offline-tolerant cold start
- AdMob banner ads

## Tech stack

| Area | What is used |
|---|---|
| App | React Native 0.86 (New Architecture), Expo SDK 57, React 19 |
| Navigation | React Navigation 7 (stack, bottom tabs, drawer) |
| State | Redux Toolkit (theme), React hooks for screen logic |
| Forms | Formik + Yup |
| Backend | Firebase Authentication, Cloud Firestore, Cloud Storage, Cloud Functions (Node 22) |
| Push | Expo Notifications |
| Ads | react-native-google-mobile-ads |
| Tooling | ESLint 9 (flat config), EAS Build |

## Project structure

```
App.js, Navigation.js     app entry, Firebase init, navigators
screens/                  screens: they only wire things together
components/               pieces of the Friends, Details, NewConv and Settings screens
hooks/                    Firestore listeners and screen logic (useFriendsData, useConversationComments, ...)
services/                 Firestore writes and external calls, no React (friends, conversations, notifications)
shared/                   helpers and small components (image cache, safe profile reads, confirm dialog, toast)
features/                 Redux slices
functions/                Cloud Functions (conversation passwords, joining) and a migration script
firestore.rules           Firestore security rules
```

## Security notes

- **Conversation passwords are never stored or sent in plain text.** They are hashed with scrypt and a random salt
  by a Cloud Function and checked there. Members can't read them back. Wrong attempts are counted and
  temporarily locked.
- **Joining goes through the `joinConversation` Cloud Function.** Clients can't add themselves to a conversation,
  and a valid invitation, which only the conversation author can create, replaces the password.
- **Firestore rules are per collection and strict:** users can be read one at a time but not listed;
  conversations, participants and comments are only readable by the people in them; cross-user writes are limited
  to friend requests and unread counters.
- The Firebase web API key in `App.js` is a public identifier, not a secret. Access is controlled by the rules
  and by the API restrictions set on the key in Google Cloud.

## Running it yourself

You need your own Firebase project, because the config is not shared.

Requirements: Node 22.13 or newer, yarn 1.x, JDK 17+, Android SDK / emulator.

1. Choose your own app package name (for example `com.yourname.convos`) and set it as `android.package` and
   `ios.bundleIdentifier` in `app.json`. Then create a Firebase project with Authentication (email/password),
   Firestore and Storage, and register an Android app in it with that same package name.
2. Download its `google-services.json` to the project root (see `google-services.example.json` for the shape) and put
   your web config into the `firebaseConfig` object in `App.js`.
3. Deploy the backend from the project root:
   ```
   cd functions && npm install && cd ..
   npx firebase-tools deploy --only firestore:rules,functions
   ```
   Functions run in `europe-west1`. If your Firestore is elsewhere, change `REGION` in `functions/index.js` and the
   region in `services/conversations.js`.
4. Install and run. The app uses native modules, so it **can't run in Expo Go**; it needs a development build:
   ```
   yarn install
   npx expo run:android     # first time, builds and installs the dev client
   npx expo start --dev-client
   ```
5. For ads, replace the AdMob IDs in `app.json` and the screens. In development the app uses Google's test ads.

Useful scripts: `yarn lint`, `npx expo export --platform android --output-dir <tmp>` (bundle check).

## Status

Android is the target platform; iOS was never configured for ads or tested. Open items: end-to-end checks of push
notifications on a device, and splitting the remaining large screens (Home, EditProfile, Invites, Settings).

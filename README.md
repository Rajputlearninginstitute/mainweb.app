# Edutech Technology — Main Website Starter

This is a responsive main-portal starter for GitHub Pages. It includes:
- `index.html` — main homepage with study resources, result portal, notices and portal links.
- `styles.css` — responsive styling and animations.
- `app.js` — navigation, class/search filters, portal links and public notice loading.
- `admin.html` + `admin.js` — Firebase email/password sign-in and notice management.
- `firebase.js` — all Firebase client initialization, Authentication and Firestore functions in one JS file.
- `config.js` — URLs for the separate support, official-information and results portals.
- `firestore.rules` — security rules for public notices and approved admin accounts.

## 1. Configure portal URLs
Edit `config.js` and replace the empty strings with your real, verified HTTPS URLs. If a portal is not ready, leave its value empty.

## 2. Configure Firebase
1. Create a Firebase project at https://console.firebase.google.com/
2. Add a Web App and copy its configuration into `firebase.js`.
3. Enable **Authentication → Email/Password**.
4. Create a **Cloud Firestore** database.
5. Create an admin user under Authentication → Users.
6. Copy that user's UID. In Firestore, create a collection named `admins` and a document whose document ID is exactly that UID. A field such as `role: "admin"` may be added, but the rules check the document's existence.
7. Publish the contents of `firestore.rules` in Firestore → Rules.

Important: do not make the `admins` collection writable by the public. The provided rules deny client writes to it, so create the allowlist document manually in the Firebase Console.

## 3. Run / publish
Because these files use JavaScript modules, use a static web host such as GitHub Pages or a local development server. Open `index.html` directly from a file manager may not work consistently.

For GitHub Pages, upload the website files at the repository root and enable Pages in repository Settings. `index.html` must be at the root.

## 4. Security and production notes
- Firebase web configuration is intended to be present in client code. Firestore Rules—not hiding the config—protect your data.
- Do not add service-account JSON, private API secrets or admin passwords to this repository.
- This starter only manages public notices. It does **not** store or display student marks.
- Never store student marks in a public collection or expose a public Google Sheet. For results, use a separate authenticated backend/API that verifies the student's identity and returns only that student's record.
- Before production, test admin sign-in, unauthorized writes, deletion, mobile layout, all portal URLs and notice rendering.
- Replace sample resource cards and text with verified content.

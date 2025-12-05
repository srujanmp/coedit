# CoEdit

CoEdit is a lightweight collaborative code and text editor built with Node.js, Express, MongoDB and Socket.IO. It provides real-time collaboration, access controls, and simple user management (Google OAuth). This README explains the main features and the typical workflow for using the application.

**Features**
- **Real-time collaboration:** Multiple users can join the same file and see live updates via Socket.IO (`/app.js`, `public/js/editor.js`).
- **Access control:** Files support `public` view mode or restricted access via owner and explicit editors list (`model/File.js`).
- **Roles & permissions:** File owner can edit, add editors and change visibility; invited editors can edit; public files are viewable by anyone.
- **Google OAuth:** Authentication and user sessions are handled with Passport and Google OAuth (`routes/auth.js`, `utils/passport.js`).
- **Per-file user list:** Each file room shows currently connected users and updates in real-time.
- **Server-side session sharing with sockets:** Socket.IO is attached to the Express session so socket actions can be validated against the logged-in user (`app.js`).
- **Admin & editor routes:** Routes for admin features, file editing, and AI-assisted actions (`routes/admin.js`, `routes/edit.js`, `routes/gemini.js`).

**Quick setup (development)**
1. Copy `.env` from the repository root and update values (the project already includes a `.env` in the repo). Required values:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
   - `SESSION_SECRET`
   - `MONGO_URI`

2. Install dependencies and run:

```bash
npm install
npm start
```

By default the app listens on `http://localhost:3000`.

**Main files & where to look**
- `app.js`: App entrypoint. Sets up Express, sessions, Passport, Socket.IO and core socket handlers (`join-file`, `edit-body`, etc.).
- `model/File.js` and `model/User.js`: Mongoose models for files and users.
- `routes/auth.js`: OAuth and login routes.
- `routes/edit.js`: Routes to create/update files and to render the editor UI.
- `routes/admin.js`: Admin-only features.
- `routes/gemini.js` & `utils/gemini.js`: Integration for AI/assistant features.
- `public/js/editor.js`: Client side editor logic and Socket.IO client code.
- `views/` EJS templates: UI pages (login, home, editor, add-editors, view-file, etc.).

**User workflow / How to use CoEdit**

1. Sign in
- Visit `http://localhost:3000` and sign in with Google. Authentication is handled by Passport (`utils/passport.js`).

2. Create a file
- After logging in, use the app UI to create a new file (`new-file.ejs`). The creator becomes the file owner.

3. Set visibility and invite editors
- Files can be `public` or private. For private files, owners can add editors using the UI (`add-editors.ejs`) by entering editor email addresses.

4. Join a file for real-time editing
- Open a file (owner or editor, or anyone if public). The client emits a `join-file` socket event with the `fileId` and user info.
- Server checks access (file viewMode, editors list, or owner) before allowing join. If not allowed, the server sends `access-denied`.

5. Edit and collaborate
- When an authorized client makes changes, the client emits `edit-body` with the updated body text.
- The server validates permission (owner or listed editor) and broadcasts `body-updated` to everyone in the file room.
- Connected user lists are updated via `users-update` messages.

6. Leaving / disconnect
- When a user disconnects, they are removed from the per-file user list and other members are notified.

**Socket events (server <-> client)**
- `join-file` (client -> server): Join the file room. Payload: `{ fileId, userName, userEmail }`.
- `access-denied` (server -> client): Sent if join is rejected.
- `users-update` (server -> all in room): Sends array of currently connected user names for that file.
- `edit-body` (client -> server): Request to update file body; server checks permissions.
- `body-updated` (server -> all in room): Broadcasts the new body to all room members.
- `total-users` (server -> all): Broadcasts count of all connected socket clients.

**Permissions summary**
- Owner (creator): Full control — edit, add editors, change visibility.
- Editor: Can edit files if added to the file's `editors` list.
- Public: If file's `viewMode` is `public`, anyone can join and view; edits still require owner/editor permission.

**Deployment notes & environment**
- Ensure `MONGO_URI` is set to your production MongoDB, and `SESSION_SECRET` is a secure random value.
- For production, run behind a process manager (PM2, systemd) or in containers; ensure HTTPS for OAuth redirect URIs.

**Extending the app**
- Add richer editor features in `public/js/editor.js` and EJS views.
- Add persistence for live edits (auto-save) by handling `edit-body` on the server and writing to MongoDB (currently the broadcast updates clients; implement save hooks where desired).

**Troubleshooting**
- If Socket.IO connections fail, confirm the server is running and that the client is connecting to the same origin.
- If OAuth fails, check the Google console redirect URL matches `GOOGLE_REDIRECT_URI`.

If you want, I can also:
- Add instructions for running with Docker.
- Add an automated health-check endpoint and more robust logging.

---
Created for rapid collaboration and prototyping.

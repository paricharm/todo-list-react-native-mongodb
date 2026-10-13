# To-Do List Application

A task-management Android application built with React Native CLI, TypeScript, Node.js, Express, and MongoDB.

## Features

- User registration and login with email and password
- JWT-based authentication
- Password hashing on the backend
- Create tasks with a title, description, scheduled date and time, deadline, and priority
- View task details and status
- Edit tasks
- Mark tasks as completed or pending
- Delete tasks
- Sort tasks by deadline or priority
- Persist tasks in MongoDB
- Isolate each user's tasks from other users

## Technology Stack

**Mobile:** React Native CLI, TypeScript, React Context, React Navigation, Axios, AsyncStorage.

**Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, bcryptjs.

## Project Structure

```text
TodoApp/
├── backend/
│   ├── src/
│   ├── .env.example
│   └── package.json
├── mobile/
│   ├── android/
│   ├── src/
│   ├── App.tsx
│   └── package.json
├── screenshots/
├── submission/
└── README.md
```

## Requirements

- Node.js and npm
- MongoDB
- Android SDK and Android development tools for building the mobile app
- A physical Android device or emulator for testing

## Backend Setup

### 1. Configure environment variables

In the `backend` directory, create a `.env` file based on `.env.example`.

Example configuration:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/todo_app
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

Use your own private, randomly generated JWT secret. Never commit the real `.env` file to GitHub.

### 2. Install dependencies

```powershell
cd backend
npm install
```

### 3. Start the backend

```powershell
npm run dev
```

The backend uses port 5000 by default. MongoDB must be available and configured correctly.

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in a user |

### Tasks

Task endpoints require a valid JWT access token in the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List the authenticated user's tasks |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Retrieve task details |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

## Mobile Setup

### 1. Install dependencies

```powershell
cd mobile
npm install
```

### 2. Configure the API URL

In `mobile/src/services/api.ts`, configure the backend URL.

For a local Wi-Fi demonstration, an example URL is:

```typescript
baseURL: "http://192.168.1.5:5000/api",
```

Replace the IP address with the current LAN IP address of the computer running the backend.

The phone and computer must be able to communicate over the network, and the backend must be running.

### 3. Start Metro

In a terminal opened in the `mobile` folder:

```powershell
npx react-native start
```

### 4. Launch the development app

Open another terminal in the `mobile` folder:

```powershell
npx react-native run-android
```

A connected Android device with USB debugging enabled and the required Android SDK components is needed.

## Release APK

The release APK is generated at:

`mobile/android/app/build/outputs/apk/release/app-release.apk`

The generated APK supports these common Android CPU architectures:

- `armeabi-v7a`
- `arm64-v8a`
- `x86`
- `x86_64`

The release app bundles its JavaScript code and does not require Metro. However, authentication and task operations still require the backend and MongoDB.

## Testing

The application was tested on a physical Samsung Android device for:

- Registration and login
- Creating and viewing tasks
- Editing tasks
- Completing tasks
- Deleting tasks
- Sorting by deadline and priority
- Persistence after reopening the app
- Account isolation

## Deployment

The current mobile configuration uses a local-network API address for demonstration. For use outside the local network, deploy the backend to a reachable server, configure HTTPS, and update the mobile API URL before rebuilding the release APK.

## Security

- Do not upload the real `backend/.env` file.
- Keep `.env.example` limited to placeholder values.
- Never commit passwords, private tokens, or database credentials.
- The release APK is excluded from the Git source repository; it can be distributed separately if required.

# Setup Guide

## Windows Setup Notes

If you encounter errors installing `better-sqlite3` on Windows, you have two options:

### Option 1: Install Visual Studio Build Tools (Recommended)

1. Download and install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
2. During installation, select "Desktop development with C++" workload
3. Run `npm install` again in the backend directory

### Option 2: Use Pre-built Binaries

The package should automatically download pre-built binaries if available for your Node.js version. If it fails, you can try:

```bash
npm install --build-from-source=false
```

## Quick Start

1. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

3. **Start Backend:**
   ```bash
   cd ../backend
   npm run dev
   ```

4. **Start Frontend (in new terminal):**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the application:**
   - Open browser to `http://localhost:5173`
   - Login with:
     - Username: `admin`
     - Password: `admin123`

## Running Tests

```bash
cd backend
npm test
```

## Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
```

The built files will be in the `dist` directory.


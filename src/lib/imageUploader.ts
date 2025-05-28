// Full OAuth 2.0 flow for Google Drive upload
// Make sure to set Authorized JavaScript Origins and Redirect URIs in your Google Cloud Console

const CLIENT_ID = '831328018373-8oe2s3g0e3dk4rruu37ladf76sfgtrci.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBdvuGPrkBFLdDpPBafAp0dekIX4UgG_tY';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Load gapi script and initialize client
export async function initGoogleOAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      gapi.load('client:auth2', async () => {
        try {
          await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            scope: SCOPES
          });
          resolve();
        } catch (e) {
          console.error("Error initializing Google API client", e);
          reject(e);
        }
      });
    };
    script.onerror = (err) => {
        console.error("Error loading GAPI script", err);
        reject(err);
    };
    document.body.appendChild(script);
  });
}

// Sign in and get access token
export async function signInWithGoogle(): Promise<string> {
  // Ensure gapi is loaded and initialized
  if (!gapi?.client?.init) {
    await initGoogleOAuth();
  } else if (!gapi.auth2.getAuthInstance()) { // Check if auth instance exists
    // This case might happen if init was called but auth instance wasn't ready
    // or an error occurred. Attempt re-init or handle error.
    // For simplicity, we'll re-init if no auth instance, but in a real app,
    // you might want more sophisticated state management.
    await initGoogleOAuth();
  }


  const GoogleAuth = gapi.auth2.getAuthInstance();
  if (!GoogleAuth) {
    throw new Error("Google Auth instance is not available. Initialization might have failed.");
  }

  // Check if user is already signed in
  if (GoogleAuth.isSignedIn.get()) {
    const currentUser = GoogleAuth.currentUser.get();
    const authResponse = currentUser.getAuthResponse(true); // true to force refresh if expired
    if (authResponse && authResponse.access_token) {
      return authResponse.access_token;
    }
  }
  
  // If not signed in, or token is missing/expired, sign in
  const user = await GoogleAuth.signIn();
  const token = user.getAuthResponse().access_token;
  return token;
}

// Upload file using token
export async function uploadImagePlaceholder(file: File): Promise<string> {
  const accessToken = await signInWithGoogle();

  const metadata = {
    name: file.name,
    mimeType: file.type
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${API_KEY}`, {
    method: 'POST',
    headers: new Headers({
      Authorization: `Bearer ${accessToken}`
    }),
    body: form
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Upload failed:", response.status, errorBody);
    throw new Error(`Upload failed: ${response.statusText} - ${errorBody}`);
  }

  const uploadedFile = await response.json();

  // Make file public
  const permissionsResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${uploadedFile.id}/permissions?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' })
  });

  if (!permissionsResponse.ok) {
    const errorBody = await permissionsResponse.text();
    console.error("Setting permissions failed:", permissionsResponse.status, errorBody);
    throw new Error(`Setting permissions failed: ${permissionsResponse.statusText} - ${errorBody}`);
  }

  // It's often better to use a direct download link or webContentLink for embedding if available.
  // The 'uc?id=' link can sometimes run into issues with large files or quotas.
  // For robust display, you might need `files.get` with `fields=webContentLink,webViewLink`.
  // For simplicity here, we'll use the provided 'uc?id=' format.
  return `https://drive.google.com/uc?id=${uploadedFile.id}`;
}

// It's good practice to declare gapi if it's used globally like this,
// or ensure your tsconfig.json includes "gapi" and "gapi.auth2" in types.
// For this context, a simple declare should suffice to avoid TypeScript errors
// if the GAPI types are not globally available in your project setup.
declare global {
  interface Window { //_STUDIO_COMMENT_ফারহান ইফতেখার_: Fix gapi types by adding this to global Window
    gapi: any;
  }
  const gapi: any; //_STUDIO_COMMENT_ফারহান ইফতেখার_: Fix gapi types by adding this to global const
}

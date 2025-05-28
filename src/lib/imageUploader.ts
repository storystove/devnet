// Full OAuth 2.0 flow for Google Drive upload
// Make sure to set Authorized JavaScript Origins and Redirect URIs in your Google Cloud Console

const CLIENT_ID = '831328018373-8oe2s3g0e3dk4rruu37ladf76sfgtrci.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBdvuGPrkBFLdDpPBafAp0dekIX4UgG_tY'; // SECURITY WARNING: API keys with broad permissions should ideally not be hardcoded client-side.
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapiInitializationPromise: Promise<void> | null = null;

// Helper function to load the base gapi.js script
function loadGapiBaseScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        // Check if gapi is already available (script might have been loaded elsewhere or by a previous call)
        if (typeof window.gapi !== 'undefined' && typeof window.gapi.load === 'function') {
            resolve();
            return;
        }

        // Check if the script tag already exists in the document
        if (document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
            // Script tag exists, but gapi might not be ready.
            // This is a tricky state; we'll rely on repeated calls to initGoogleOAuth to eventually succeed
            // or an interval check for window.gapi. For now, we'll try to proceed if gapi becomes available.
            // A more robust solution might involve a global callback system for script loads.
             let attempts = 0;
             const interval = setInterval(() => {
                if (typeof window.gapi !== 'undefined' && typeof window.gapi.load === 'function') {
                    clearInterval(interval);
                    resolve();
                } else if (attempts > 20) { // Timeout after ~2 seconds
                    clearInterval(interval);
                    reject(new Error("GAPI script tag found but window.gapi did not initialize."));
                }
                attempts++;
            }, 100);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (typeof window.gapi !== 'undefined' && typeof window.gapi.load === 'function') {
                resolve();
            } else {
                reject(new Error("GAPI script loaded but window.gapi.load is not a function."));
            }
        };
        script.onerror = (err) => {
            console.error("Error loading GAPI script from CDN", err);
            gapiInitializationPromise = null; // Allow retry by clearing the promise
            reject(err);
        };
        document.body.appendChild(script);
    });
}


// Load gapi script and initialize client
export function initGoogleOAuth(): Promise<void> {
  if (gapiInitializationPromise) {
    return gapiInitializationPromise;
  }

  gapiInitializationPromise = new Promise(async (resolve, reject) => {
    try {
      await loadGapiBaseScript(); // Step 1: Ensure gapi.js is loaded

      // Check if gapi.client is already initialized (e.g. from a previous successful init)
      // gapi.client.getToken will exist after successful client init with auth scopes
      if (window.gapi?.client?.getToken && window.gapi?.auth2?.getAuthInstance && window.gapi.auth2.getAuthInstance().isSignedIn.get()) {
        resolve();
        return;
      }
      
      // Step 2: Load 'client' and 'auth2' modules using gapi.load
      window.gapi.load('client:auth2', async () => {
        try {
          // Step 3: Initialize the API client and auth2 instance
          await window.gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            scope: SCOPES
          });
          // Ensure auth instance is also ready
           if (!window.gapi.auth2.getAuthInstance()) {
             // This can happen if client.init completes but auth2 setup has an issue or is deferred.
             // Usually, gapi.client.init with auth scopes handles gapi.auth2.init implicitly.
             // If getAuthInstance is null, something went wrong.
             console.warn("gapi.client.init succeeded but gapi.auth2.getAuthInstance() is null. Auth might not be fully ready.");
           }
          resolve();
        } catch (initError) {
          console.error("Error initializing Google API client (gapi.client.init or auth2)", initError);
          gapiInitializationPromise = null; // Allow retry on failure
          reject(initError);
        }
      });
    } catch (scriptLoadError) {
        console.error("Failed to load or initialize base gapi.js script.", scriptLoadError);
        gapiInitializationPromise = null; // Allow retry on failure
        reject(scriptLoadError);
    }
  });
  return gapiInitializationPromise;
}

// Sign in and get access token
export async function signInWithGoogle(): Promise<string> {
  await initGoogleOAuth(); // Ensures gapi is loaded and client & auth2 initialized

  const GoogleAuth = window.gapi.auth2.getAuthInstance();
  if (!GoogleAuth) {
    // This error means that even after initGoogleOAuth, gapi.auth2.getAuthInstance() is null.
    // This suggests a deeper issue with the GAPI auth2 library loading or initialization.
    throw new Error("Google Auth instance (gapi.auth2.getAuthInstance) is not available. Initialization might have failed or the 'auth2' module didn't load as expected.");
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
  const authResponse = user.getAuthResponse();
  const token = authResponse.access_token;

  if (!token) {
    console.error("Google Sign-In response:", authResponse);
    throw new Error("Google Sign-In was successful but no access token was returned.");
  }
  return token;
}

// Upload file using token
export async function uploadImagePlaceholder(file: File): Promise<string> {
  const accessToken = await signInWithGoogle();

  const metadata = {
    name: file.name,
    mimeType: file.type
    // To upload to a specific folder, add: parents: ['YOUR_FOLDER_ID']
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
    console.error("Google Drive Upload failed:", response.status, errorBody);
    throw new Error(`Upload to Google Drive failed: ${response.statusText} - ${errorBody}`);
  }

  const uploadedFile = await response.json();
  if (!uploadedFile || !uploadedFile.id) {
    console.error("Google Drive upload response did not contain a file ID:", uploadedFile);
    throw new Error("Google Drive upload response did not contain a file ID.");
  }

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
    console.error("Setting Google Drive permissions failed:", permissionsResponse.status, errorBody);
    // This is not necessarily a fatal error for the upload itself, but the image won't be public.
    console.warn(`Setting public permissions for Google Drive file ${uploadedFile.id} failed. The image may not be viewable by others.`);
  }

  // Using webContentLink is generally more reliable for direct embedding if available and public.
  // The 'uc?id=' link can sometimes have issues or require extra handling.
  // For a more robust solution, you might get the webContentLink after setting permissions:
  // const fileMetadata = await fetch(`https://www.googleapis.com/drive/v3/files/${uploadedFile.id}?fields=webContentLink,webViewLink&key=${API_KEY}`, {
  //   headers: new Headers({ Authorization: `Bearer ${accessToken}` })
  // }).then(res => res.json());
  // return fileMetadata.webContentLink || `https://drive.google.com/uc?id=${uploadedFile.id}`;
  
  return `https://drive.google.com/uc?id=${uploadedFile.id}`;
}

// It's good practice to declare gapi if it's used globally like this,
// or ensure your tsconfig.json includes "gapi" and "gapi.auth2" in types.
// For this context, a simple declare should suffice to avoid TypeScript errors
// if the GAPI types are not globally available in your project setup.
declare global {
  interface Window { 
    gapi: any; // Using 'any' for simplicity; ideally, you'd use @types/gapi and @types/gapi.auth2
  }
}

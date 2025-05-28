
// Full OAuth 2.0 flow for Google Drive upload
// Make sure to set Authorized JavaScript Origins and Redirect URIs in your Google Cloud Console

const CLIENT_ID = '831328018373-8oe2s3g0e3dk4rruu37ladf76sfgtrci.apps.googleusercontent.com';
// SECURITY WARNING: Exposing API keys directly in client-side code is a security risk.
// For production applications, consider using a backend proxy or Firebase Cloud Functions
// to handle API calls and keep sensitive keys secure.
const API_KEY = 'AIzaSyBdvuGPrkBFLdDpPBafAp0dekIX4UgG_tY'; // This is where your API key would be used.
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapiInitializationPromise: Promise<void> | null = null;

// Helper function to load the base gapi.js script
function loadGapiBaseScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window.gapi !== 'undefined' && typeof window.gapi.load === 'function') {
            resolve();
            return;
        }
        if (document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
             let attempts = 0;
             const interval = setInterval(() => {
                if (typeof window.gapi !== 'undefined' && typeof window.gapi.load === 'function') {
                    clearInterval(interval);
                    resolve();
                } else if (attempts > 20) { 
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
            gapiInitializationPromise = null; 
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
      await loadGapiBaseScript(); 

      if (window.gapi?.client?.getToken && window.gapi?.auth2?.getAuthInstance && window.gapi.auth2.getAuthInstance().isSignedIn.get()) {
        console.log("GAPI client and auth already initialized and user signed in.");
        resolve();
        return;
      }
      
      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            scope: SCOPES
          });
           if (!window.gapi.auth2.getAuthInstance()) {
             console.warn("gapi.client.init succeeded but gapi.auth2.getAuthInstance() is null. Auth might not be fully ready.");
           }
          console.log("Google API client and auth initialized successfully.");
          resolve();
        } catch (initError: any) {
          let errorMessage = "Unknown error during GAPI client initialization.";
          let errorDetails = null;
          let fullErrorObjectString = "";

          try {
            fullErrorObjectString = JSON.stringify(initError, Object.getOwnPropertyNames(initError));
          } catch (e) {
            fullErrorObjectString = "Error object could not be stringified.";
          }

          if (initError) {
            if (initError.message) {
              errorMessage = initError.message;
            }
            if (initError.details) {
              errorDetails = initError.details;
            } else if (initError.result && initError.result.error) {
              errorMessage = initError.result.error.message || errorMessage;
              errorDetails = initError.result.error.details || initError.result.error.errors || errorDetails;
            } else if (typeof initError === 'string') {
              errorMessage = initError;
            }
          }
          
          console.error(
            `Error initializing Google API client (gapi.client.init or auth2). Message: ${errorMessage}.`,
            errorDetails ? `Specific Details: ${JSON.stringify(errorDetails)}.` : '',
            `Full error object: ${fullErrorObjectString}. Original error:`, initError
          );
          gapiInitializationPromise = null; // Allow retry on failure
          reject(initError); 
        }
      });
    } catch (scriptLoadError) {
        console.error("Failed to load or initialize base gapi.js script.", scriptLoadError);
        gapiInitializationPromise = null; 
        reject(scriptLoadError);
    }
  });
  return gapiInitializationPromise;
}

// Sign in and get access token
export async function signInWithGoogle(): Promise<string> {
  await initGoogleOAuth(); 

  const GoogleAuth = window.gapi.auth2.getAuthInstance();
  if (!GoogleAuth) {
    throw new Error("Google Auth instance (gapi.auth2.getAuthInstance) is not available after GAPI initialization. This usually indicates a problem with the OAuth client setup (Client ID, Origins, or API Key).");
  }

  if (GoogleAuth.isSignedIn.get()) {
    const currentUser = GoogleAuth.currentUser.get();
    const authResponse = currentUser.getAuthResponse(true); 
    if (authResponse && authResponse.access_token) {
      console.log("Reusing existing Google Sign-In session.");
      return authResponse.access_token;
    }
  }
  
  console.log("Attempting Google Sign-In popup...");
  const user = await GoogleAuth.signIn();
  const authResponse = user.getAuthResponse();
  const token = authResponse.access_token;

  if (!token) {
    console.error("Google Sign-In successful but no access token returned. Response:", authResponse);
    throw new Error("Google Sign-In was successful but no access token was returned.");
  }
  console.log("Google Sign-In successful, token obtained.");
  return token;
}

// Upload file using token
export async function uploadImagePlaceholder(file: File): Promise<string> {
  console.log("Starting image upload process...");
  const accessToken = await signInWithGoogle();
  console.log("Access token obtained for upload.");

  const metadata = {
    name: file.name,
    mimeType: file.type
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  console.log(`Uploading ${file.name} to Google Drive...`);
  const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${API_KEY}`, {
    method: 'POST',
    headers: new Headers({
      Authorization: `Bearer ${accessToken}`
    }),
    body: form
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Google Drive Upload failed. Status:", response.status, "Body:", errorBody);
    throw new Error(`Upload to Google Drive failed: ${response.statusText} - ${errorBody}`);
  }

  const uploadedFile = await response.json();
  if (!uploadedFile || !uploadedFile.id) {
    console.error("Google Drive upload response did not contain a file ID:", uploadedFile);
    throw new Error("Google Drive upload response did not contain a file ID.");
  }
  console.log(`File ${uploadedFile.name} (ID: ${uploadedFile.id}) uploaded successfully.`);

  console.log(`Setting permissions for file ID: ${uploadedFile.id} to public reader...`);
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
    console.error("Setting Google Drive permissions failed. Status:", permissionsResponse.status, "Body:", errorBody);
    console.warn(`Setting public permissions for Google Drive file ${uploadedFile.id} failed. The image may not be viewable by others without direct sharing.`);
  } else {
    console.log(`Permissions for file ID: ${uploadedFile.id} set successfully.`);
  }
  
  const downloadUrl = `https://drive.google.com/uc?id=${uploadedFile.id}`;
  console.log(`Generated download URL: ${downloadUrl}`);
  return downloadUrl;
}

declare global {
  interface Window { 
    gapi: any; 
  }
}

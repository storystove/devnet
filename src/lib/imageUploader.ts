
// Full OAuth 2.0 flow for Google Drive upload
// Make sure to set Authorized JavaScript Origins and Redirect URIs in your Google Cloud Console

const CLIENT_ID = '44719805646-d0to64n5i0nrgjsda6uohlhk2gotiis9.apps.googleusercontent.com';
// SECURITY WARNING: Exposing API keys directly in client-side code is a security risk.
// For production applications, consider using a backend proxy or Firebase Cloud Functions
// to handle API calls and keep sensitive keys secure.
// This API key is used for some Google Drive API calls. Ensure it has the necessary permissions
// and restrictions (e.g., HTTP referrers, API service restrictions) in your Google Cloud Console.
const API_KEY = 'AIzaSyBtHbO7QNdZRlCVgQI41pr77bs4w18MCN8'; 
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
                } else if (attempts > 20) { // Increased attempts for slower networks/initialization
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
            reject(new Error(`Failed to load GAPI script from CDN: ${err instanceof Event ? 'Network error' : String(err)}`));
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

      // Check if GAPI client and auth2 are already initialized and user is signed in
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
           // Additional check to ensure auth instance is truly available
           if (!window.gapi.auth2.getAuthInstance()) {
             console.warn("gapi.client.init succeeded but gapi.auth2.getAuthInstance() is null. Auth might not be fully ready.");
             // Potentially add a small delay and retry or reject if still null after timeout
           }
          console.log("Google API client and auth initialized successfully.");
          resolve();
        } catch (initError: any) {
          let errorMessage = "Unknown error during GAPI client initialization.";
          let errorDetails = null;
          let fullErrorObjectString = "";

          // Attempt to stringify the error object for more details
          try {
            fullErrorObjectString = JSON.stringify(initError, Object.getOwnPropertyNames(initError));
          } catch (e) {
            // If stringification fails, use a placeholder
            fullErrorObjectString = "Error object could not be stringified.";
          }

          if (initError) {
            if (initError.message) {
              errorMessage = initError.message;
            } else if (typeof initError.details === 'string') { // GAPI specific error structure
                errorMessage = initError.details;
            } else if (initError.result && initError.result.error) { // Another GAPI error structure
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
          reject(new Error(`GAPI Init Failed: ${errorMessage}`)); 
        }
      });
    } catch (scriptLoadError) {
        const errorMessage = scriptLoadError instanceof Error ? scriptLoadError.message : String(scriptLoadError);
        console.error("Failed to load or initialize base gapi.js script.", errorMessage, scriptLoadError);
        gapiInitializationPromise = null; 
        reject(new Error(`GAPI Script Load Failed: ${errorMessage}`));
    }
  });
  return gapiInitializationPromise;
}

// Helper to extract a meaningful message from various error types
function getErrorMessage(error: any, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && error.details && typeof error.details === 'string') { // GAPI error format
    return error.details;
  }
  if (error && error.error && typeof error.error.message === 'string') { // Another GAPI error format
    return error.error.message;
  }
  if (error && error.result && error.result.error && typeof error.result.error.message === 'string') { // Yet another
    return error.result.error.message;
  }
  try {
    const stringified = JSON.stringify(error);
    if (stringified !== '{}') { // Avoid empty object stringification
      return stringified;
    }
  } catch (e) {
    // ignore stringification errors
  }
  return defaultMessage;
}


// Sign in and get access token
export async function signInWithGoogle(): Promise<string> {
  try {
    await initGoogleOAuth(); // Ensure GAPI is initialized

    const GoogleAuth = window.gapi.auth2.getAuthInstance();
    if (!GoogleAuth) {
      // This check is crucial after initGoogleOAuth completes
      throw new Error("Google Auth instance (gapi.auth2.getAuthInstance) is not available. Check GAPI init and OAuth Client ID setup in Google Cloud Console (Authorized JavaScript Origins, Redirect URIs).");
    }

    // Check if user is already signed in
    if (GoogleAuth.isSignedIn.get()) {
      const currentUser = GoogleAuth.currentUser.get();
      const authResponse = currentUser.getAuthResponse(true); // true to refresh token if expired
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
  } catch (error: any) {
    const message = getErrorMessage(error, "Google Sign-In failed. Check console and ensure pop-ups are not blocked.");
    console.error("Error during signInWithGoogle:", message, error);
    throw new Error(message);
  }
}

// Upload file using token
export async function uploadImagePlaceholder(file: File): Promise<string> {
  try {
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
      const detailMessage = getErrorMessage(JSON.parse(errorBody || "{}"), response.statusText);
      console.error("Google Drive Upload failed. Status:", response.status, "Body:", errorBody);
      throw new Error(`Upload to Google Drive failed: ${response.status} ${detailMessage}`);
    }

    const uploadedFile = await response.json();
    if (!uploadedFile || !uploadedFile.id) {
      console.error("Google Drive upload response did not contain a file ID:", uploadedFile);
      throw new Error("Google Drive upload response did not contain a file ID.");
    }
    console.log(`File ${uploadedFile.name} (ID: ${uploadedFile.id}) uploaded successfully.`);

    // Make file public
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
      const detailMessage = getErrorMessage(JSON.parse(errorBody || "{}"), permissionsResponse.statusText);
      console.error("Setting Google Drive permissions failed. Status:", permissionsResponse.status, "Body:", errorBody);
      // Not throwing an error here, but logging a strong warning. The file might be uploaded but not viewable.
      // Depending on requirements, you might want to throw new Error(`Setting public permissions failed: ${detailMessage}`);
      console.warn(`Setting public permissions for Google Drive file ${uploadedFile.id} failed. The image may not be viewable by others without direct sharing. Error: ${detailMessage}`);
    } else {
      console.log(`Permissions for file ID: ${uploadedFile.id} set successfully.`);
    }
    
    // Construct the direct download URL for Google Drive files
    const downloadUrl = `https://drive.google.com/uc?id=${uploadedFile.id}`;
    console.log(`Generated download URL: ${downloadUrl}`);
    return downloadUrl;

  } catch (error: any) {
    // Ensure a more specific error message is thrown from here
    const message = getErrorMessage(error, "Image upload process encountered an error.");
    console.error("Error during uploadImagePlaceholder catch block:", message, error);
    throw new Error(message);
  }
}

// TypeScript type declaration for the gapi object if not already present globally
// This helps with type checking in your TypeScript project.
declare global {
  interface Window { 
    gapi: any; // You can refine this 'any' with more specific GAPI types if available
  }
}


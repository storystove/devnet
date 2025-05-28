
// Full OAuth 2.0 flow for Google Drive upload using Google Identity Services (GIS)
// Make sure to set Authorized JavaScript Origins and Redirect URIs in your Google Cloud Console

const CLIENT_ID = '44719805646-d0to64n5i0nrgjsda6uohlhk2gotiis9.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBtHbO7QNdZRlCVgQI41pr77bs4w18MCN8'; // Used for API calls
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapiScriptLoadPromise: Promise<void> | null = null;
let gisScriptLoadPromise: Promise<void> | null = null;
let gapiClientInitializedPromise: Promise<void> | null = null;


// Helper function to load a script dynamically
function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(id);
    if (existingScript) {
      const interval = setInterval(() => {
        if ((id === 'gapi-script' && window.gapi && window.gapi.load) || (id === 'gis-script' && window.google && window.google.accounts)) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(interval);
        if (!((id === 'gapi-script' && window.gapi && window.gapi.load) || (id === 'gis-script' && window.google && window.google.accounts))) {
          console.warn(`Script ${id} tag exists but global object not ready after timeout.`);
        }
        resolve(); 
      }, 5000);
      return;
    }

    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log(`${id} script loaded successfully from ${src}`);
      resolve();
    };
    script.onerror = (err) => {
      console.error(`Error loading ${id} script from ${src}`, err);
      if (id === 'gapi-script') gapiScriptLoadPromise = null;
      if (id === 'gis-script') gisScriptLoadPromise = null;
      reject(new Error(`Failed to load script ${src}: ${err instanceof Event ? 'Network error' : String(err)}`));
    };
    document.body.appendChild(script);
  });
}

// Initialize GAPI client
async function ensureGapiClientInitialized(): Promise<void> {
  if (gapiClientInitializedPromise) {
    return gapiClientInitializedPromise;
  }
  gapiClientInitializedPromise = (async () => {
    if (!gapiScriptLoadPromise) {
      gapiScriptLoadPromise = loadScript('https://apis.google.com/js/api.js', 'gapi-script');
    }
    await gapiScriptLoadPromise;

    return new Promise<void>((resolve, reject) => {
      if (typeof window.gapi?.load === 'function') {
        window.gapi.load('client', async () => {
          try {
            // Check if gapi.client is already initialized in a generic way
            // For instance, check if a previous init call has completed if this function is re-entrant
            // However, with the singleton promise, this specific check might be less critical here.
            // The main thing is that gapi.client should exist after gapi.load('client',...)
            if (!window.gapi.client) {
                throw new Error("window.gapi.client is not available after loading 'client'.");
            }

            // Initialize GAPI client with API Key but without specific Drive discoveryDocs
            // as we are using fetch directly. This sets up the API key for general GAPI client use.
            await window.gapi.client.init({
              apiKey: API_KEY,
              // discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'], // Removed this line
            });
            console.log("GAPI client initialized successfully (for API key config).");
            resolve();
          } catch (initError: any) {
            const errorMessage = getErrorMessage(initError, "GAPI gapi.client.init failed");
            const errorDetails = initError?.result?.error || initError?.details || null;
            const fullErrorObjectString = typeof initError === 'object' && initError !== null ? JSON.stringify(initError) : String(initError);
            
            console.error(
              `Error initializing GAPI client library. Message: ${errorMessage}.`,
              errorDetails ? `Specific Details: ${JSON.stringify(errorDetails)}.` : '',
              `Full error object: ${fullErrorObjectString}. Original error:`, initError
            );
            gapiClientInitializedPromise = null; // Allow retry on failure
            reject(new Error(`GAPI Client Init Failed: ${errorMessage}`));
          }
        });
      } else {
        gapiClientInitializedPromise = null;
        reject(new Error("window.gapi.load is not a function. GAPI script might not have loaded correctly."));
      }
    });
  })();
  return gapiClientInitializedPromise;
}


// Get Access Token using Google Identity Services (GIS)
export async function getAccessToken(): Promise<string> {
  try {
    // Ensure GAPI client is available (though not strictly for auth token with GIS, good for consistency if gapi.client is used elsewhere)
    await ensureGapiClientInitialized(); 

    if (!gisScriptLoadPromise) {
      gisScriptLoadPromise = loadScript('https://accounts.google.com/gsi/client', 'gis-script');
    }
    await gisScriptLoadPromise;
    
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      throw new Error("Google Identity Services (GIS) library not fully loaded or available on window.google.accounts.oauth2.");
    }

    return new Promise<string>((resolve, reject) => {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        prompt: '', // Can be 'consent' to force consent screen, or '' for smoother UX if already consented
        callback: (tokenResponse: google.accounts.oauth2.TokenResponse | google.accounts.oauth2.GoogleOAuthError) => {
          if ((tokenResponse as google.accounts.oauth2.GoogleOAuthError).error) {
            const err = tokenResponse as google.accounts.oauth2.GoogleOAuthError;
            const errMsg = `GIS token error: ${err.error_description || err.error || 'Unknown error'}`;
            console.error(errMsg, err);
            reject(new Error(errMsg));
          } else {
            const token = (tokenResponse as google.accounts.oauth2.TokenResponse).access_token;
            if (!token) {
                 const noTokenMsg = "GIS token request successful but no access_token was returned.";
                 console.error(noTokenMsg, tokenResponse);
                 reject(new Error(noTokenMsg));
            } else {
                console.log("Access token obtained via GIS.");
                resolve(token);
            }
          }
        },
        error_callback: (error: google.accounts.oauth2.GoogleOAuthError) => {
            const errMsg = `GIS error_callback: ${error.error_description || error.error || 'Unknown error from error_callback'}`;
            console.error(errMsg, error);
            reject(new Error(errMsg));
        }
      });
      tokenClient.requestAccessToken({ prompt: '' }); 
    });

  } catch (error) {
    const message = getErrorMessage(error, "Failed to obtain access token using GIS.");
    console.error("Error in getAccessToken (GIS):", message, error);
    throw new Error(message);
  }
}


// Upload file using token
export async function uploadImagePlaceholder(file: File): Promise<string> {
  try {
    console.log("Starting image upload process with GIS...");
    await ensureGapiClientInitialized(); 

    const accessToken = await getAccessToken();
    console.log("Access token obtained for upload via GIS.");

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
      const errorBodyText = await response.text();
      let errorJson: any = {};
      try { errorJson = JSON.parse(errorBodyText); } catch (e) {/* ignore */}
      const detailMessage = getErrorMessage(errorJson?.error || errorJson, response.statusText);
      console.error("Google Drive Upload failed. Status:", response.status, "Body:", errorBodyText);
      throw new Error(`Upload to Google Drive failed: ${response.status} ${detailMessage}`);
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
      const errorBodyText = await permissionsResponse.text();
      let errorJson: any = {};
      try { errorJson = JSON.parse(errorBodyText); } catch (e) {/* ignore */}
      const detailMessage = getErrorMessage(errorJson?.error || errorJson, permissionsResponse.statusText);
      console.error("Setting Google Drive permissions failed. Status:", permissionsResponse.status, "Body:", errorBodyText);
      console.warn(`Setting public permissions for Google Drive file ${uploadedFile.id} failed. The image may not be viewable by others without direct sharing. Error: ${detailMessage}`);
    } else {
      console.log(`Permissions for file ID: ${uploadedFile.id} set successfully.`);
    }
    
    const downloadUrl = `https://drive.google.com/uc?id=${uploadedFile.id}`;
    console.log(`Generated download URL: ${downloadUrl}`);
    return downloadUrl;

  } catch (error: any) {
    const message = getErrorMessage(error, "Image upload process encountered an error (GIS flow).");
    console.error("Error during uploadImagePlaceholder catch block (GIS flow):", message, error);
    throw new Error(message);
  }
}

// Helper to extract a meaningful message from various error types
function getErrorMessage(error: any, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  // GAPI specific structures
  if (error && error.details && typeof error.details === 'string') { 
    return error.details;
  }
  if (error && error.result && error.result.error && typeof error.result.error.message === 'string') {
    return error.result.error.message;
  }
   // GIS specific error structure (from TokenResponse or GoogleOAuthError)
  if (error && typeof error.error_description === 'string') {
    return error.error_description;
  }
  if (error && typeof error.error === 'string') { // Fallback to just the error code if no description
    return error.error;
  }
  // General object check for a 'message' property
  if (error && typeof error.message === 'string') {
    return error.message;
  }
  try {
    const stringified = JSON.stringify(error);
    if (stringified && stringified !== '{}' && stringified !== '""' && stringified !== "null") { 
      return stringified;
    }
  } catch (e) { /* ignore stringification errors */ }
  return defaultMessage;
}


declare global {
  interface Window { 
    gapi: any; 
    google: { 
        accounts: {
            id: any; 
            oauth2: {
                initTokenClient: (config: google.accounts.oauth2.TokenClientConfig) => google.accounts.oauth2.TokenClient;
                hasGrantedAllScopes: (token: google.accounts.oauth2.TokenResponse, ...scopes: string[]) => boolean;
                hasGrantedAnyScope: (token: google.accounts.oauth2.TokenResponse, ...scopes: string[]) => boolean;
                revoke: (accessToken: string, done: () => void) => void;
            };
        };
    };
  }
}

declare namespace google.accounts.oauth2 {
  interface TokenClientConfig {
      client_id: string;
      scope: string;
      callback?: (response: TokenResponse | GoogleOAuthError) => void; 
      error_callback?: (error: GoogleOAuthError) => void; 
      prompt?: string; 
      hint?: string;
      ux_mode?: 'popup' | 'redirect';
      state?: string;
      nonce?: string;
      login_hint?: string;
      hd?: string; // Hosted Domain
      include_granted_scopes?: boolean;
      enable_granular_consent?: boolean;
      // ... other config options based on GIS documentation
  }

  interface TokenClient {
      requestAccessToken: (overrideConfig?: {prompt?: string; hint?: string; login_hint?: string; [key: string]: any}) => void;
  }
  
  interface TokenResponse {
      access_token: string;
      expires_in: number; 
      scope: string;
      token_type: string;
      hd?: string; 
      // ... other properties from GIS documentation
  }

  interface GoogleOAuthError {
      type?: string; 
      error?: string; 
      error_description?: string;
      error_uri?: string;
      // ... other error properties from GIS documentation
  }
}


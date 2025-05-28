
// Full OAuth 2.0 flow for Google Drive upload using Google Identity Services (GIS)
// Make sure to set Authorized JavaScript Origins and Redirect URIs in your Google Cloud Console

const CLIENT_ID = '44719805646-d0to64n5i0nrgjsda6uohlhk2gotiis9.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBtHbO7QNdZRlCVgQI41pr77bs4w18MCN8'; // Used for API calls, not for GIS client init directly
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapiScriptLoadPromise: Promise<void> | null = null;
let gisScriptLoadPromise: Promise<void> | null = null;
let gapiClientInitializedPromise: Promise<void> | null = null;


// Helper function to load a script dynamically
function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(id);
    if (existingScript) {
      // Simple check, assumes if script tag exists, it's loaded/loading
      // For production, might need more robust ready state checking
      // Wait for global object to be available as a proxy for script readiness
      const interval = setInterval(() => {
        if ((id === 'gapi-script' && window.gapi && window.gapi.load) || (id === 'gis-script' && window.google && window.google.accounts)) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      // Add a timeout to prevent infinite loop if script fails silently
      setTimeout(() => {
        clearInterval(interval);
        if (!((id === 'gapi-script' && window.gapi && window.gapi.load) || (id === 'gis-script' && window.google && window.google.accounts))) {
          console.warn(`Script ${id} tag exists but global object not ready after timeout.`);
        }
        resolve(); // Resolve anyway, subsequent checks will fail if not truly ready
      }, 5000); // 5 second timeout for script to make global available
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

// Initialize GAPI client (primarily for API key and discovery docs, if needed by gapi.client.request)
// Since we use fetch, this mainly just makes `gapi.client` available.
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
      if (typeof window.gapi.load === 'function') {
        window.gapi.load('client', async () => { // We only need 'client' part of GAPI now
          try {
            // Check if gapi.client is already initialized
            if (window.gapi.client && window.gapi.client.drive) { // Simple check
                 console.log("GAPI client seems to be already initialized.");
                 resolve();
                 return;
            }
            await window.gapi.client.init({
              apiKey: API_KEY,
              // discoveryDocs are useful if using gapi.client.drive.files.create, etc.
              // For raw fetch, their role is less direct but init may perform API key validation.
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            console.log("GAPI client initialized successfully (for API key config/discovery).");
            resolve();
          } catch (initError: any) {
            const errorMessage = getErrorMessage(initError, "GAPI gapi.client.init failed");
            console.error(
              `Error initializing GAPI client library. Message: ${errorMessage}.`,
              `Original error:`, initError
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
    // await ensureGapiClientInitialized(); // This line might be optional if no gapi.client.* calls are made and API_KEY is only for fetch

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
      tokenClient.requestAccessToken({ prompt: '' }); // prompt: '' can be overridden if needed e.g. {prompt: 'consent'}
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
    // The API_KEY is still used for the Google Drive API calls, not directly for OAuth token acquisition with GIS.
    // Ensure GAPI client is initialized if its init process does any API key validation globally for `gapi.client`
    await ensureGapiClientInitialized(); // This might be optional if API_KEY is only used for fetch and `gapi.client` isn't used.
                                        // However, some GAPI setups might require it for the key to be recognized for any GAPI related activity.

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
    // The API_KEY is part of the query string for Google Drive API calls.
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${API_KEY}`, {
      method: 'POST',
      headers: new Headers({
        Authorization: `Bearer ${accessToken}`
      }),
      body: form
    });

    if (!response.ok) {
      const errorBodyText = await response.text();
      let errorJson = {};
      try { errorJson = JSON.parse(errorBodyText); } catch (e) {/* ignore */}
      const detailMessage = getErrorMessage(errorJson, response.statusText);
      console.error("Google Drive Upload failed. Status:", response.status, "Body:", errorBodyText);
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
      const errorBodyText = await permissionsResponse.text();
      let errorJson = {};
      try { errorJson = JSON.parse(errorBodyText); } catch (e) {/* ignore */}
      const detailMessage = getErrorMessage(errorJson, permissionsResponse.statusText);
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
  try {
    const stringified = JSON.stringify(error);
    // Avoid empty object stringification or just empty quotes
    if (stringified && stringified !== '{}' && stringified !== '""' && stringified !== "null") { 
      return stringified;
    }
  } catch (e) { /* ignore stringification errors */ }
  return defaultMessage;
}


declare global {
  interface Window { 
    gapi: any; 
    google: { // For Google Identity Services (GIS)
        accounts: {
            id: any; // For Sign In with Google
            oauth2: {
                initTokenClient: (config: google.accounts.oauth2.TokenClientConfig) => google.accounts.oauth2.TokenClient;
                // Potentially other oauth2 methods
            };
        };
    };
  }
}

// More specific GIS types for better intellisense and type checking
declare namespace google.accounts.oauth2 {
  interface TokenClientConfig {
      client_id: string;
      scope: string;
      callback?: (response: TokenResponse | GoogleOAuthError) => void; // Called after requestAccessToken completes
      error_callback?: (error: GoogleOAuthError) => void; // For errors during the token client operations
      prompt?: string; // e.g. '', 'consent', 'select_account'
      hint?: string;
      ux_mode?: 'popup' | 'redirect';
      // ... other config options based on GIS documentation
  }

  interface TokenClient {
      requestAccessToken: (overrideConfig?: {prompt?: string; hint?: string; login_hint?: string; [key: string]: any}) => void;
  }
  
  interface TokenResponse {
      access_token: string;
      expires_in: number; // Duration in seconds
      scope: string;
      token_type: string;
      // Might contain id_token, authuser, prompt, hd, etc.
      hd?: string; // Hosted domain, if applicable
      // ... other properties from GIS documentation
  }

  interface GoogleOAuthError {
      type?: string; // For instance, 'popup_closed', 'popup_failed_to_open', 'token_request_failed'
      error?: string; // e.g. 'access_denied', 'invalid_request', 'unauthorized_client', 'invalid_scope'
      error_description?: string;
      error_uri?: string;
      // ... other error properties from GIS documentation
  }
}

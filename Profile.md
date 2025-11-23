# Frontend Changes - Profile File Upload Refactoring

This document summarizes recent changes implemented in the frontend (`Ecggd-front/`) primarily focused on improving the reliability and user experience of file uploads on the profile page, particularly for user profile pictures and other associated documents.

## Overview

The main goal of these changes was to address issues where user file uploads were slow, appeared stuck (`pending` status), or did not reflect correctly in the UI. The solution involved refactoring the file upload mechanism to be more robust, asynchronous, and to directly communicate with the backend, bypassing previous proxy-related complications.

## Key Changes Implemented

1.  **Asynchronous File Uploads & Immediate Feedback:**
    *   **Previous Behavior:** File uploads were bundled with the main profile form submission, causing delays and a poor user experience for large files.
    *   **New Behavior:** Files (e.g., `profile_picture`, `passport_photo`) are now uploaded **immediately** when a user selects them from the file input field. This process happens in the background.
    *   **User Experience:** The UI now provides visual feedback (e.g., "Uploading..." message, success/error indicators) for each file as it's being uploaded, improving responsiveness. The main "Save" button is now primarily for saving non-file related profile data.

2.  **Direct Backend Communication for File Uploads (Bypassing Next.js Proxy):**
    *   **Previous Issue:** File upload requests made through the Next.js development proxy (`/api/proxy/...`) were getting stuck in a `(pending)` state, often due to how `multipart/form-data` requests were handled by the proxy.
    *   **New Behavior:** The frontend now sends file upload requests (from `handleFileChange` in `pages/profile.tsx`) **directly** to the Django backend's API endpoint (e.g., `http://localhost:8000/api/users/me/upload/...`). This completely bypasses the Next.js proxy, eliminating the interference that caused requests to hang.
    *   **Configuration:** This direct communication assumes the Django backend is running and accessible at the specified address (e.g., `http://localhost:8000`). This URL is currently hardcoded in `pages/profile.tsx`. If your backend runs on a different port or host, you will need to update this URL in the `handleFileChange` function.

3.  **Cache-Busting for Image URLs:**
    *   **Previous Issue:** Browsers would often cache old versions of images, leading to the new uploaded image not being displayed immediately even after a successful upload (indicated by `304 Not Modified` responses).
    *   **New Behavior:** A cache-busting mechanism has been added. After a successful file upload, a unique timestamp is appended as a query parameter to the image's URL (e.g., `image.jpg?t=1678886400000`). This forces the browser to re-fetch the new image, ensuring the latest version is always displayed.

## Impact for Developers

*   When developing locally, ensure your Django backend is running and accessible at the address hardcoded in `Ecggd-front/pages/profile.tsx` (currently `http://localhost:8000`). If your backend runs on a different port or host, you will need to update this URL in `handleFileChange` function.
*   Debugging file upload issues should now primarily focus on the Django backend logs (`ProfileFileUploadView`) and the browser's Network tab for direct responses from the Django server, rather than proxy-related issues.
*   The `lib/api.ts` `profile.uploadProfileFile` function is no longer used for file uploads in `pages/profile.tsx` due to the direct `fetch` implementation. It remains in `lib/api.ts` but is effectively bypassed for this specific UI.

These changes significantly improve the robustness and user experience for file uploads in the application.

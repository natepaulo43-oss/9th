import { auth, db, storage } from '../config/firebase.js';

const formatResponse = (success, data = null, error = null) => ({ success, data, error });

/**
 * Creates a new Firebase Authentication user.
 * @param {string} email
 * @param {string} password
 * @param {string} [displayName]
 * @returns {Promise<{success: boolean, data: import('firebase-admin').auth.UserRecord | null, error: string | null}>}
 */
export async function createUser(email, password, displayName) {
  try {
    const userRecord = await auth.createUser({ email, password, displayName });
    return formatResponse(true, userRecord);
  } catch (error) {
    return formatResponse(false, null, error.message || 'Failed to create user');
  }
}

/**
 * Fetches a user by UID.
 * @param {string} uid
 * @returns {Promise<{success: boolean, data: import('firebase-admin').auth.UserRecord | null, error: string | null}>}
 */
export async function getUserById(uid) {
  try {
    const userRecord = await auth.getUser(uid);
    return formatResponse(true, userRecord);
  } catch (error) {
    return formatResponse(false, null, error.message || 'Failed to fetch user');
  }
}

/**
 * Updates a Firebase Authentication user.
 * @param {string} uid
 * @param {import('firebase-admin').auth.UpdateRequest} data
 * @returns {Promise<{success: boolean, data: import('firebase-admin').auth.UserRecord | null, error: string | null}>}
 */
export async function updateUser(uid, data) {
  try {
    const userRecord = await auth.updateUser(uid, data);
    return formatResponse(true, userRecord);
  } catch (error) {
    return formatResponse(false, null, error.message || 'Failed to update user');
  }
}

/**
 * Deletes a Firebase Authentication user.
 * @param {string} uid
 * @returns {Promise<{success: boolean, data: null, error: string | null}>}
 */
export async function deleteUser(uid) {
  try {
    await auth.deleteUser(uid);
    return formatResponse(true);
  } catch (error) {
    return formatResponse(false, null, error.message || 'Failed to delete user');
  }
}

/**
 * Creates a Firestore document with an auto-generated ID.
 * @param {string} collection
 * @param {Record<string, any>} data
 * @returns {Promise<{success: boolean, data: { id: string, path: string } | null, error: string | null}>}
 */
export async function createDocument(collection, data) {
  try {
    const docRef = await db.collection(collection).add(data);
    return formatResponse(true, { id: docRef.id, path: docRef.path });
  } catch (error) {
    return formatResponse(false, null, error.message || 'Failed to create document');
  }
}

/**
 * Retrieves a Firestore document by ID.
 * @param {string} collection
 * @param {string} docId
 * @returns {Promise<{success: boolean, data: Record<string, any> | null, error: string | null}>}
 */
export async function getDocument(collection, docId) {
  try {
    const docSnap = await db.collection(collection).doc(docId).get();
    if (!docSnap.exists) {
      return formatResponse(false, null, 'Document not found');
    }

    return formatResponse(true, { id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    return formatResponse(false, null, error.message || 'Failed to retrieve document');
  }
}

/**
 * Updates a Firestore document.
 * @param {string} collection
 * @param {string} docId
 * @param {Record<string, any>} data
 * @returns {Promise<{success: boolean, data: null, error: string | null}>}
 */
export async function updateDocument(collection, docId, data) {
  try {
    await db.collection(collection).doc(docId).update(data);
    return formatResponse(true);
  } catch (error) {
    return formatResponse(false, null, error.message || 'Failed to update document');
  }
}

/**
 * Deletes a Firestore document.
 * @param {string} collection
 * @param {string} docId
 * @returns {Promise<{success: boolean, data: null, error: string | null}>}
 */
export async function deleteDocument(collection, docId) {
  try {
    await db.collection(collection).doc(docId).delete();
    return formatResponse(true);
  } catch (error) {
    return formatResponse(false, null, error.message || 'Failed to delete document');
  }
}

/**
 * Queries Firestore documents with optional pagination.
 * @param {string} collection
 * @param {number} [limit=10]
 * @param {string} [startAfter]
 * @returns {Promise<{success: boolean, data: { items: any[], nextCursor: string | null } | null, error: string | null}>}
 */
export async function queryDocuments(collection, limit = 10, startAfter) {
  try {
    let query = db.collection(collection).orderBy('createdAt', 'desc').limit(limit);

    if (startAfter) {
      const cursorSnap = await db.collection(collection).doc(startAfter).get();
      if (cursorSnap.exists) {
        query = query.startAfter(cursorSnap);
      }
    }

    const snapshot = await query.get();
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const nextCursor = snapshot.docs.length === limit ? snapshot.docs[snapshot.docs.length - 1].id : null;

    return formatResponse(true, { items, nextCursor });
  } catch (error) {
    return formatResponse(false, null, error.message || 'Failed to query documents');
  }
}

/**
 * Uploads a file to Cloud Storage.
 * @param {string} filePath - Local path to the file.
 * @param {string} destination - Destination path in the bucket.
 * @returns {Promise<{success: boolean, data: { destination: string } | null, error: string | null}>}
 */
export async function uploadFile(filePath, destination) {
  try {
    const [file] = await storage.upload(filePath, { destination });
    return formatResponse(true, { destination: file.name });
  } catch (error) {
    return formatResponse(false, null, error.message || 'Failed to upload file');
  }
}

/**
 * Generates a signed URL for a stored file.
 * @param {string} fileName
 * @returns {Promise<{success: boolean, data: string | null, error: string | null}>}
 */
export async function getFileUrl(fileName) {
  try {
    const file = storage.file(fileName);
    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 });
    return formatResponse(true, url);
  } catch (error) {
    return formatResponse(false, null, error.message || 'Failed to generate file URL');
  }
}

/**
 * Deletes a file from Cloud Storage.
 * @param {string} fileName
 * @returns {Promise<{success: boolean, data: null, error: string | null}>}
 */
export async function deleteFile(fileName) {
  try {
    await storage.file(fileName).delete();
    return formatResponse(true);
  } catch (error) {
    return formatResponse(false, null, error.message || 'Failed to delete file');
  }
}

import {
  queryDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../services/firebaseService.js';

const ITEMS_COLLECTION = 'items';
const formatError = (error, fallback) => error || fallback;

/**
 * Retrieves a paginated list of items from Firestore.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getAllItems(req, res) {
  try {
    const limit = Number(req.query.limit) || 10;
    const startAfter = req.query.startAfter;

    const result = await queryDocuments(ITEMS_COLLECTION, limit, startAfter);

    if (!result.success) {
      return res.status(500).json({ error: formatError(result.error, 'Unable to fetch items') });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    console.error('getAllItems error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Retrieves a single item by its Firestore document ID.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getItemById(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    const result = await getDocument(ITEMS_COLLECTION, id);

    if (!result.success) {
      const status = result.error === 'Document not found' ? 404 : 500;
      return res.status(status).json({ error: formatError(result.error, 'Unable to fetch item') });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    console.error('getItemById error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Creates a new item document in Firestore.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function createItem(req, res) {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const itemData = req.body || {};

    if (!itemData || Object.keys(itemData).length === 0) {
      return res.status(400).json({ error: 'Item data is required' });
    }

    const payload = {
      ...itemData,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    };

    const result = await createDocument(ITEMS_COLLECTION, payload);

    if (!result.success) {
      return res.status(400).json({ error: formatError(result.error, 'Unable to create item') });
    }

    return res.status(201).json({ id: result.data.id, ...payload });
  } catch (error) {
    console.error('createItem error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

const fetchOwnedItem = async (id, uid) => {
  const itemResult = await getDocument(ITEMS_COLLECTION, id);

  if (!itemResult.success) {
    const status = itemResult.error === 'Document not found' ? 404 : 500;
    return { error: formatError(itemResult.error, 'Unable to fetch item'), status };
  }

  if (itemResult.data.createdBy !== uid) {
    return { error: 'Forbidden', status: 403 };
  }

  return { data: itemResult.data };
};

/**
 * Updates an existing item (only owner can update).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function updateItem(req, res) {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updateData = req.body || {};

    if (!id) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    const ownershipCheck = await fetchOwnedItem(id, req.user.uid);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({ error: ownershipCheck.error });
    }

    const payload = { ...updateData, updatedAt: new Date().toISOString() };

    const result = await updateDocument(ITEMS_COLLECTION, id, payload);

    if (!result.success) {
      return res.status(400).json({ error: formatError(result.error, 'Unable to update item') });
    }

    const refreshed = await getDocument(ITEMS_COLLECTION, id);
    return res.status(200).json(refreshed.success ? refreshed.data : { id, ...payload });
  } catch (error) {
    console.error('updateItem error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Deletes an item if the requester is the owner.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function deleteItem(req, res) {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    const ownershipCheck = await fetchOwnedItem(id, req.user.uid);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({ error: ownershipCheck.error });
    }

    const result = await deleteDocument(ITEMS_COLLECTION, id);

    if (!result.success) {
      return res.status(400).json({ error: formatError(result.error, 'Unable to delete item') });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('deleteItem error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

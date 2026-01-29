
// Firebase_CRUD.js
// Handles Firestore operations for Scholarships & Forum

const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

// --- SCHOLARSHIPS ---

export async function createScholarship(data) {
    if (!db) throw new Error("Firebase Firestore is not initialized.");
    try {
        const scholarshipsRef = db.collection("SCHOLARSHIPS");
        const payload = {
            created_by: data.created_by || "unknown",
            time_of_creation: firebase.firestore.FieldValue.serverTimestamp(),
            deadline: data.deadline,
            active: true,
            image_id: data.image_id,
            title: data.title,
            from: data.from || "",
            description: data.description,
            amount_of_participants: Number(data.amount_of_participants) || 0,
            current_participants: 0,
            tags: data.tags || [],
            requirements: data.requirements || [],
            search_keywords: generateSearchKeywords(data.title)
        };
        const docRef = await scholarshipsRef.add(payload);
        return docRef.id;
    } catch (error) {
        console.error("Error creating scholarship:", error);
        throw error;
    }
}

function generateSearchKeywords(title) {
    if (!title) return [];
    return title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
}

// --- FORUM ---

export async function createForumPost(data) {
    if (!db) throw new Error("Firebase Firestore is not initialized.");
    try {
        const forumRef = db.collection('FORUM');
        await forumRef.add({
            title: data.title,
            content: data.content,
            author: data.author,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            tags: data.tags || (data.tag ? [data.tag] : ["General"]),
            tag: data.tags && data.tags.length > 0 ? data.tags[0] : (data.tag || "General"), // Legacy support
            likes: 0,
            replyCount: 0
        });
        return true;
    } catch (e) {
        console.error("Error creating forum post:", e);
        throw e;
    }
}

export function subscribeToForumPosts(onNext, onError) {
    if (!db) {
        if (onError) onError(new Error("Firebase not initialized"));
        return () => { };
    }
    return db.collection('FORUM')
        .orderBy('createdAt', 'desc')
        .onSnapshot(onNext, onError);
}

// Fetch single post details
export async function getForumPost(postId) {
    if (!db) throw new Error("Firebase not initialized");
    try {
        const doc = await db.collection('FORUM').doc(postId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (e) {
        console.error("Error getting forum post:", e);
        throw e;
    }
}

// Fetch replies sub-collection
export function subscribeToForumReplies(postId, onNext, onError) {
    if (!db) {
        if (onError) onError(new Error("Firebase not initialized"));
        return () => { };
    }
    return db.collection('FORUM').doc(postId).collection('REPLIES')
        .orderBy('createdAt', 'asc') // Oldest first (like a chat/forum thread)
        .onSnapshot(onNext, onError);
}

// Create Reply and Increment Count
export async function createForumReply(postId, data) {
    if (!db) throw new Error("Firebase not initialized");

    const postRef = db.collection('FORUM').doc(postId);
    const repliesRef = postRef.collection('REPLIES');

    try {
        await db.runTransaction(async (transaction) => {
            // Check if post exists
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists) throw new Error("Post does not exist!");

            // Add Reply
            const newReplyRef = repliesRef.doc();
            transaction.set(newReplyRef, {
                content: data.content,
                author: data.author,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Increment Count
            const newCount = (postDoc.data().replyCount || 0) + 1;
            transaction.update(postRef, { replyCount: newCount });
        });
        return true;
    } catch (e) {
        console.error("Error creating reply:", e);
        throw e;
    }
}

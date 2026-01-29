/* forum.js - Complete Logic with Dynamic Tags */
import {
    createForumPost,
    subscribeToForumPosts,
    getForumPost,
    createForumReply,
    subscribeToForumReplies
} from '../FirebaseUtils/Firebase_CRUD.js';

// DOM Elements
const postsContainer = document.getElementById('forum-posts-container');
const detailContainer = document.getElementById('forum-post-detail-container');
const headerRow = document.querySelector('.forum-header-row');

const submitBtn = document.getElementById('submitBtn');
const titleInput = document.querySelector('.forum-input');
const contentInput = document.querySelector('.forum-textarea');

// Tag Elements
const tagInput = document.getElementById('tag-input');
const addTagBtn = document.getElementById('add-tag-btn');
const addedTagsContainer = document.getElementById('added-tags-container');

// Modal Elements
const modal = document.getElementById('createPostModal');
const openBtn = document.getElementById('openCreateModal');
const closeBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');

// State
let unsubscribeReplies = null;
let currentPostId = null;
let unsubscribePosts = null;
let postTags = []; // Dynamic Tags

// === 1. TAG LOGIC ===
function addTag() {
    if (!tagInput) return;
    const val = tagInput.value.trim();
    // Max 5 tags, unique, not empty
    if (val && !postTags.includes(val) && postTags.length < 5) {
        postTags.push(val);
        renderTagsInputUI();
        tagInput.value = '';
        tagInput.focus();
    } else if (postTags.length >= 5) {
        alert("Maximum 5 tags allowed.");
    }
}

function removeTag(index) {
    postTags.splice(index, 1);
    renderTagsInputUI();
}

function renderTagsInputUI() {
    if (!addedTagsContainer) return;
    addedTagsContainer.innerHTML = postTags.map((t, i) => `
        <span class="added-tag-pill">
            ${escapeHtml(t)}
            <span class="remove-tag-icon" onclick="window.removeTagIdx(${i})">&times;</span>
        </span>
    `).join('');
}

// Expose removal to global scope for onclick
window.removeTagIdx = removeTag;

// === 2. CREATE POST ===
async function handleCreatePost() {
    const userEmail = localStorage.getItem('nextcap_user_email');
    if (!userEmail) {
        alert('You must be logged in to post.');
        return;
    }

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    // Default tag if none
    const finalTags = postTags.length > 0 ? postTags : ['General'];

    if (!title || !content) {
        alert('Please fill in both title and content.');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    try {
        await createForumPost({
            title: title,
            content: content,
            author: userEmail,
            tags: finalTags
        });

        // Reset Form
        titleInput.value = '';
        contentInput.value = '';
        postTags = [];
        renderTagsInputUI();

        closeModal();
        alert('Post created successfully!');

    } catch (error) {
        console.error("Error creating post: ", error);
        alert("Failed to create post.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Post';
    }
}

// === 3. LOAD POSTS (List View) ===
function loadPosts() {
    if (postsContainer) postsContainer.style.display = 'block';
    if (detailContainer) detailContainer.style.display = 'none';
    if (headerRow) headerRow.style.display = 'flex';

    if (!postsContainer) return;
    if (unsubscribePosts) unsubscribePosts();

    unsubscribePosts = subscribeToForumPosts((snapshot) => {
        postsContainer.innerHTML = '';

        if (snapshot.empty) {
            postsContainer.innerHTML = '<div style="text-align:center; color:#718096; padding:40px;">No discussions yet. Be the first to start one!</div>';
            return;
        }

        snapshot.forEach(doc => {
            const post = doc.data();
            const postId = doc.id;
            const date = post.createdAt ? post.createdAt.toDate() : new Date();
            const timeAgo = getTimeAgo(date);

            const authorRaw = post.author || 'Anonymous';
            const initials = getInitials(authorRaw);
            const avatarColor = getAvatarColor(authorRaw);
            const authorName = authorRaw.split('@')[0];

            const escTitle = escapeHtml(post.title);

            const tagList = post.tags || (post.tag ? [post.tag] : ['General']);
            const tagsHTML = tagList.map(t => `<span class="topic-tag">${escapeHtml(t)}</span>`).join('');

            const postHTML = `
            <div class="forum-card" onclick="window.viewPost('${postId}')">
                <div class="topic-header">
                    <div class="topic-avatar" style="background-color: ${avatarColor}; color: white;">${initials}</div>
                    <div class="topic-content">
                        <div class="topic-title">${escTitle}</div>
                        <div class="topic-meta">
                            ${tagsHTML}
                            <span style="margin-left:5px;"><span style="font-weight:600; color:#4a5568;">${escapeHtml(authorName)}</span> • ${timeAgo}</span>
                        </div>
                    </div>
                    <div class="topic-stats">
                        <div style="font-weight:600; color:#4a5568;">${post.replyCount || 0}</div>
                        <div>replies</div>
                    </div>
                </div>
            </div>
            `;
            postsContainer.insertAdjacentHTML('beforeend', postHTML);
        });
    }, (error) => {
        console.error("Error loading posts:", error);
        postsContainer.innerHTML = '<div style="color:red; text-align:center;">Error loading posts.</div>';
    });
}

// === 4. VIEW POST (Detail View) ===
window.viewPost = async function (postId) {
    currentPostId = postId;

    if (postsContainer) postsContainer.style.display = 'none';
    if (headerRow) headerRow.style.display = 'none';
    if (detailContainer) detailContainer.style.display = 'block';

    detailContainer.innerHTML = '<div style="padding:40px; text-align:center; color:#718096">Loading discussion...</div>';
    window.scrollTo(0, 0);

    try {
        const post = await getForumPost(postId);
        if (!post) {
            detailContainer.innerHTML = '<div style="padding:20px">Post not found. <button onclick="window.backToForum()" style="cursor:pointer; text-decoration:underline;">Back</button></div>';
            return;
        }

        renderPostDetail(post);
        loadReplies(postId);

    } catch (e) {
        console.error(e);
        detailContainer.innerHTML = '<div style="padding:20px; color:red;">Error loading post. <button onclick="window.backToForum()">Back</button></div>';
    }
}

window.backToForum = function () {
    if (unsubscribeReplies) unsubscribeReplies();
    currentPostId = null;
    loadPosts();
}

function renderPostDetail(post) {
    const date = post.createdAt ? post.createdAt.toDate() : new Date();
    const timeAgo = getTimeAgo(date);

    const authorRaw = post.author || 'Anonymous';
    const initials = getInitials(authorRaw);
    const avatarColor = getAvatarColor(authorRaw);
    const authorName = authorRaw.split('@')[0];

    const tagList = post.tags || (post.tag ? [post.tag] : ['General']);
    const tagsHTML = tagList.map(t => `<span class="topic-tag">${escapeHtml(t)}</span>`).join('');

    const html = `
        <div style="margin-bottom: 20px;">
            <button onclick="window.backToForum()" style="background:none; border:none; color:#718096; cursor:pointer; font-weight:600; display:flex; align-items:center; gap:6px; font-size:14px;">
                <span style="font-size:18px;">←</span> Back to Forum
            </button>
        </div>
        
        <!-- Main Post Card -->
        <div class="forum-detail-card">
             <div class="topic-header" style="margin-bottom: 20px; align-items: center;">
                <div class="topic-avatar" style="width:48px; height:48px; font-size:18px; background-color: ${avatarColor}; color: white;">${initials}</div>
                <div class="topic-content">
                    <div style="font-weight: 700; color: #2d3748; font-size: 16px;">${escapeHtml(authorName)}</div>
                    <div style="font-size: 13px; color: #718096;">Posted ${timeAgo}</div>
                </div>
                <div class="topic-meta" style="flex-wrap: wrap;">
                    ${tagsHTML}
                </div>
             </div>
             
             <div class="topic-title" style="font-size: 22px; margin-bottom: 15px; line-height:1.3;">${escapeHtml(post.title)}</div>
             <div style="font-size: 15px; color: #4a5568; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(post.content)}</div>
        </div>

        <!-- Replies Section -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin: 30px 0 20px;">
            <h3 style="color:#2d3748; font-size:18px; font-weight:700;">Replies <span id="reply-count-badge" style="font-size:14px; font-weight:normal; color:#718096; margin-left:8px;">(0)</span></h3>
        </div>

        <div id="replies-list" style="margin-bottom: 40px;">
            <div style="color:#a0aec0; padding:10px;">Loading replies...</div>
        </div>

        <!-- Reply Input Area -->
        <div style="background: white; border-radius: 8px; padding: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h4 style="margin-bottom:15px; font-size:15px; color:#2d3748; font-weight:600;">Post a Reply</h4>
            <textarea id="reply-input" class="forum-textarea" placeholder="What are your thoughts?" style="min-height:100px; margin-bottom:15px;"></textarea>
            <div style="display:flex; justify-content:flex-end;">
                <button onclick="window.submitReply()" id="sendReplyBtn" class="btn-submit">Post Reply</button>
            </div>
        </div>
        
        <div style="height: 50px;"></div>
    `;
    detailContainer.innerHTML = html;
}

// ... Re-include loadReplies, submitReply, utils ...
function loadReplies(postId) {
    const listEl = document.getElementById('replies-list');
    const countBadge = document.getElementById('reply-count-badge');
    if (!listEl) return;

    if (unsubscribeReplies) unsubscribeReplies();

    unsubscribeReplies = subscribeToForumReplies(postId, (snapshot) => {
        listEl.innerHTML = '';
        if (countBadge) countBadge.textContent = `(${snapshot.size})`;

        if (snapshot.empty) {
            listEl.innerHTML = '<div style="color:#718096; font-style:italic; padding:20px 0;">No replies yet. Start the conversation!</div>';
            return;
        }

        snapshot.forEach(doc => {
            const r = doc.data();
            const rAuthor = r.author || 'Anonymous';
            const initials = getInitials(rAuthor);
            const avatarColor = getAvatarColor(rAuthor);
            const rName = rAuthor.split('@')[0];
            const rTime = r.createdAt ? getTimeAgo(r.createdAt.toDate()) : 'just now';

            const itemHTML = `
                <div class="reply-item">
                    <div class="topic-avatar" style="width: 36px; height: 36px; font-size: 13px; background-color: ${avatarColor}; color: white; margin-top:2px;">${initials}</div>
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                            <span style="font-size:14px; font-weight:700; color:#2d3748;">${escapeHtml(rName)}</span>
                            <span style="font-size:12px; color:#a0aec0;">${rTime}</span>
                        </div>
                        <div style="font-size:14px; color:#4a5568; line-height:1.6;">${escapeHtml(r.content)}</div>
                    </div>
                </div>
            `;
            listEl.insertAdjacentHTML('beforeend', itemHTML);
        });
    });
}

window.submitReply = async function () {
    const input = document.getElementById('reply-input');
    const btn = document.getElementById('sendReplyBtn');
    const text = input.value.trim();
    if (!localStorage.getItem('nextcap_user_email')) return alert('Please login to reply');
    if (!text) return alert('Reply cannot be empty');

    btn.disabled = true; btn.textContent = 'Posting...';
    try {
        await createForumReply(currentPostId, { content: text, author: localStorage.getItem('nextcap_user_email') });
        input.value = '';
    } catch (e) { console.error(e); alert('Failed to reply.'); }
    finally { btn.disabled = false; btn.textContent = 'Post Reply'; }
}

// Utils
function getInitials(n) { if (!n) return '?'; const p = n.split('@')[0]; const pl = p.split(/[^a-zA-Z0-9]/).filter(x => x); if (pl.length >= 2) return (pl[0][0] + pl[1][0]).toUpperCase(); return p.substring(0, 2).toUpperCase(); }
function getAvatarColor(s) { const c = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795', '#3182ce', '#805ad5', '#d53f8c']; let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h); return c[Math.abs(h) % c.length]; }
function getTimeAgo(d) { if (!d) return "just now"; const s = Math.floor((new Date() - d) / 1000); if (s < 60) return "just now"; let i = Math.floor(s / 31536000); if (i > 1) return i + "y"; i = Math.floor(s / 2592000); if (i > 1) return i + "m"; i = Math.floor(s / 86400); if (i > 1) return i + "d"; i = Math.floor(s / 3600); if (i > 1) return i + "h"; i = Math.floor(s / 60); if (i > 1) return i + "m"; return s + "s"; }
function escapeHtml(t) { return t ? t.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : ''; }

function openModal() { if (modal) modal.style.display = 'flex'; }
function closeModal() { if (modal) modal.style.display = 'none'; }

document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    const e = localStorage.getItem('nextcap_user_email');
    if (e && document.getElementById('welcome-message')) document.getElementById('welcome-message').textContent = 'Welcome, ' + e.split('@')[0];

    if (submitBtn) submitBtn.addEventListener('click', handleCreatePost);
    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (tagInput) {
        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(); }
        });
    }
    if (addTagBtn) addTagBtn.addEventListener('click', addTag);
    window.addEventListener('click', (ev) => { if (ev.target === modal) closeModal(); });
});

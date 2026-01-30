import {
    subscribeToForumPosts,
    getForumPost,
    subscribeToForumReplies,
    deleteForumPost,
    deleteForumReply
} from '../FirebaseUtils/Firebase_CRUD.js';

const postsContainer = document.getElementById('forum-posts-container');
const detailContainer = document.getElementById('forum-post-detail-container');
const headerRow = document.querySelector('.forum-header-row');

let unsubscribePosts = null;
let unsubscribeReplies = null;
let currentPostId = null;

function loadPosts() {
    if (postsContainer) postsContainer.style.display = 'block';
    if (detailContainer) detailContainer.style.display = 'none';
    if (headerRow) headerRow.style.display = 'flex';

    if (!postsContainer) return;
    if (unsubscribePosts) unsubscribePosts();

    unsubscribePosts = subscribeToForumPosts((snapshot) => {
        postsContainer.innerHTML = '';

        if (snapshot.empty) {
            postsContainer.innerHTML = '<div style="text-align:center; color:#718096; padding:40px;">No discussions yet.</div>';
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
            <div class="forum-card" onclick="window.viewPost('${postId}')" style="cursor: pointer;">
                <div class="topic-header">
                    <div class="topic-avatar" style="background-color: ${avatarColor}; color: white;">${initials}</div>
                    <div class="topic-content">
                        <div class="topic-title">${escTitle}</div>
                        <div class="topic-meta">
                            ${tagsHTML}
                            <span style="margin-left:5px;"><span style="font-weight:600; color:#4a5568;">${escapeHtml(authorName)}</span> • ${timeAgo}</span>
                        </div>
                    </div>
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:15px; border-top:1px solid #edf2f7; padding-top:10px;">
                    <button class="btn-delete" onclick="event.stopPropagation(); window.confirmDeletePost('${postId}')">
                        <span>&times;</span> Delete Post
                    </button>
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
                <span style="font-size:18px;">←</span> Back to List
            </button>
        </div>
        
        <div class="forum-detail-card">
             <div style="display:flex; justify-content:space-between; margin-bottom: 20px;">
                 <div class="topic-header" style="align-items: center;">
                    <div class="topic-avatar" style="width:48px; height:48px; font-size:18px; background-color: ${avatarColor}; color: white;">${initials}</div>
                    <div class="topic-content">
                        <div style="font-weight: 700; color: #2d3748; font-size: 16px;">${escapeHtml(authorName)}</div>
                        <div style="font-size: 13px; color: #718096;">Posted ${timeAgo}</div>
                    </div>
                 </div>
                 <button class="btn-delete" onclick="window.confirmDeletePost('${currentPostId}', true)">Delete Post</button>
             </div>
             
             <div class="topic-title" style="font-size: 22px; margin-bottom: 15px; line-height:1.3;">${escapeHtml(post.title)}</div>
             <div style="font-size: 15px; color: #4a5568; line-height: 1.7; white-space: pre-wrap;">${escapeHtml(post.content)}</div>
             <div class="topic-meta" style="flex-wrap: wrap; margin-top:20px;">
                    ${tagsHTML}
             </div>
        </div>

        <h3 style="margin: 30px 0 15px; color:#2d3748; font-size:18px; font-weight:700;">Replies</h3>
        <div id="replies-list" style="margin-bottom: 40px;">
            <div style="color:#a0aec0; padding:10px;">Loading replies...</div>
        </div>
    `;
    detailContainer.innerHTML = html;
}

function loadReplies(postId) {
    const listEl = document.getElementById('replies-list');
    if (!listEl) return;

    if (unsubscribeReplies) unsubscribeReplies();

    unsubscribeReplies = subscribeToForumReplies(postId, (snapshot) => {
        listEl.innerHTML = '';
        if (snapshot.empty) {
            listEl.innerHTML = '<div style="color:#718096; font-style:italic; padding:20px 0;">No replies yet.</div>';
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
                <div class="reply-item" style="border-bottom:1px solid #edf2f7; padding-bottom:15px; margin-bottom:15px;">
                    <div class="topic-avatar" style="width: 36px; height: 36px; font-size: 13px; background-color: ${avatarColor}; color: white; margin-top:2px;">${initials}</div>
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                            <span style="font-size:14px; font-weight:700; color:#2d3748;">${escapeHtml(rName)}</span>
                            <span style="font-size:12px; color:#a0aec0;">${rTime}</span>
                        </div>
                        <div style="font-size:14px; color:#4a5568; line-height:1.6;">${escapeHtml(r.content)}</div>
                    </div>
                    <div style="margin-left:10px;">
                         <button class="delete-reply-btn" title="Delete Reply" onclick="window.confirmDeleteReply('${postId}', '${doc.id}')">&times;</button>
                    </div>
                </div>
            `;
            listEl.insertAdjacentHTML('beforeend', itemHTML);
        });
    });
}

window.confirmDeletePost = async function (postId, fromDetail = false) {
    if (confirm("Are you sure you want to permanently delete this post? This action cannot be undone.")) {
        try {
            await deleteForumPost(postId);
            if (fromDetail) window.backToForum();
        } catch (e) {
            console.error(e);
            alert("Failed to delete post.");
        }
    }
}

window.confirmDeleteReply = async function (postId, replyId) {
    if (confirm("Delete this reply?")) {
        try {
            await deleteForumReply(postId, replyId);
        } catch (e) {
            console.error(e);
            alert("Failed to delete reply.");
        }
    }
}

function getInitials(n) { if (!n) return '?'; const p = n.split('@')[0]; const pl = p.split(/[^a-zA-Z0-9]/).filter(x => x); if (pl.length >= 2) return (pl[0][0] + pl[1][0]).toUpperCase(); return p.substring(0, 2).toUpperCase(); }
function getAvatarColor(s) { const c = ['#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#319795', '#3182ce', '#805ad5', '#d53f8c']; let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h); return c[Math.abs(h) % c.length]; }
function getTimeAgo(d) { if (!d) return "just now"; const s = Math.floor((new Date() - d) / 1000); if (s < 60) return "just now"; let i = Math.floor(s / 31536000); if (i > 1) return i + "y"; i = Math.floor(s / 2592000); if (i > 1) return i + "m"; i = Math.floor(s / 86400); if (i > 1) return i + "d"; i = Math.floor(s / 3600); if (i > 1) return i + "h"; i = Math.floor(s / 60); if (i > 1) return i + "m"; return s + "s"; }
function escapeHtml(t) { return t ? t.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : ''; }

document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
});

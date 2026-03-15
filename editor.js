#!/usr/bin/env node
/**
 * Blog Editor - Local web editor for Jekyll blog
 * Run: node editor.js
 * Open: http://localhost:4040
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const BLOG_ROOT = __dirname;
const POSTS_DIR = path.join(BLOG_ROOT, '_posts', 'blog');
const ASSETS_DIR = path.join(BLOG_ROOT, 'assets', 'img', 'blog');
const TAGS_DIR = path.join(BLOG_ROOT, '_featured_tags');
const PORT = 4040;

// ─── Helpers ────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// ─── API handlers ────────────────────────────────────────────────────────────

function listPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse()
    .map(f => {
      const content = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
      const titleMatch = content.match(/^title:\s*["']?(.+?)["']?\s*$/m);
      const title = titleMatch ? titleMatch[1] : f.replace(/\.md$/, '');
      return { filename: f, title };
    });
}

function readPost(filename) {
  const filepath = path.join(POSTS_DIR, filename);
  if (!fs.existsSync(filepath)) return null;
  return fs.readFileSync(filepath, 'utf8');
}

function savePost({ filename, content }) {
  if (!filename || !content) return false;
  // sanitize filename
  const safe = path.basename(filename).replace(/[^a-zA-Z0-9_\-.]/g, '');
  if (!safe.endsWith('.md')) return false;
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(POSTS_DIR, safe), content, 'utf8');
  return safe;
}

function listTags() {
  if (!fs.existsSync(TAGS_DIR)) return [];
  return fs.readdirSync(TAGS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''));
}

function createTag({ slug, title }) {
  if (!slug) return false;
  const safe = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
  if (!safe) return false;
  const tagTitle = title || safe.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const content = `---\nlayout: tag-list\ntype: tag\ntitle: ${tagTitle}\nslug: ${safe}\ncategory: blog\nsidebar: true\ndescription: >\n  Posts related ${tagTitle}\n---\n`;
  if (!fs.existsSync(TAGS_DIR)) fs.mkdirSync(TAGS_DIR, { recursive: true });
  fs.writeFileSync(path.join(TAGS_DIR, safe + '.md'), content, 'utf8');
  return safe;
}

function uploadImage({ date, filename, base64, mimeType }) {
  if (!date || !filename || !base64) return null;
  const dir = path.join(ASSETS_DIR, date);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const ext = filename.split('.').pop().toLowerCase();
  const safe = slugify(filename.replace(/\.[^.]+$/, '')) + '.' + ext;
  const buffer = Buffer.from(base64, 'base64');
  fs.writeFileSync(path.join(dir, safe), buffer);
  return `/assets/img/blog/${date}/${safe}`;
}

// ─── HTML UI ─────────────────────────────────────────────────────────────────

const HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Blog Editor</title>
<link rel="stylesheet" href="https://unpkg.com/easymde/dist/easymde.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Do+Hyeon&family=Fira+Code:wght@400;500&display=swap">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0f172a; --surface: #1e293b; --surface2: #263348;
    --border: #334155; --accent: #3b82f6; --accent2: #60a5fa;
    --text: #e2e8f0; --muted: #94a3b8; --danger: #ef4444;
    --success: #22c55e;
  }
  body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    background: var(--bg); color: var(--text); height: 100vh;
    display: flex; flex-direction: column; overflow: hidden; }

  /* Top bar */
  header { display: flex; align-items: center; gap: 12px; padding: 12px 20px;
    background: var(--surface); border-bottom: 1px solid var(--border);
    flex-shrink: 0; }
  header h1 { font-size: 16px; font-weight: 700; color: var(--accent2); flex: 1; }
  .badge { font-size: 11px; background: var(--surface2); color: var(--muted);
    padding: 2px 8px; border-radius: 20px; }

  /* Layout */
  .layout { display: flex; flex: 1; overflow: hidden; }

  /* Sidebar */
  .sidebar { width: 280px; flex-shrink: 0; background: var(--surface);
    border-right: 1px solid var(--border); display: flex;
    flex-direction: column; overflow: hidden; }
  .sidebar-header { padding: 14px 16px; border-bottom: 1px solid var(--border);
    display: flex; gap: 8px; align-items: center; }
  .sidebar-header span { font-size: 13px; font-weight: 600; flex: 1; }
  .post-list { flex: 1; overflow-y: auto; padding: 8px; }
  .post-item { padding: 10px 12px; border-radius: 8px; cursor: pointer;
    font-size: 13px; margin-bottom: 4px; transition: background 0.15s;
    border: 1px solid transparent; }
  .post-item:hover { background: var(--surface2); }
  .post-item.active { background: var(--surface2); border-color: var(--accent); }
  .post-item .post-date { font-size: 11px; color: var(--muted); margin-bottom: 3px; }
  .post-item .post-title { color: var(--text); line-height: 1.3;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden; }

  /* Main editor */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .editor-toolbar-custom { padding: 12px 20px; background: var(--surface);
    border-bottom: 1px solid var(--border); display: flex;
    gap: 10px; align-items: center; flex-shrink: 0; flex-wrap: wrap; }

  /* Frontmatter panel */
  .frontmatter { padding: 16px 20px; background: var(--surface);
    border-bottom: 1px solid var(--border); display: grid;
    grid-template-columns: 1fr 1fr 1fr auto; gap: 10px; align-items: end;
    flex-shrink: 0; }
  .fm-group { display: flex; flex-direction: column; gap: 5px; }
  .fm-group label { font-size: 11px; color: var(--muted); font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.5px; }
  .fm-group input { background: var(--bg); border: 1px solid var(--border);
    color: var(--text); padding: 7px 10px; border-radius: 6px; font-size: 13px;
    width: 100%; }
  .fm-group input:focus { outline: none; border-color: var(--accent); }

  /* Editor area */
  .editor-wrap { flex: 1; overflow: hidden; position: relative; }
  .CodeMirror { height: 100% !important; }
  .EasyMDEContainer { height: 100%; display: flex; flex-direction: column; }
  .EasyMDEContainer .CodeMirror { flex: 1; }
  .editor-toolbar { background: #1e293b !important; border-color: var(--border) !important; }
  .editor-toolbar button { color: var(--muted) !important; }
  .editor-toolbar button:hover, .editor-toolbar button.active { background: var(--surface2) !important; color: var(--text) !important; }
  .editor-toolbar i.separator { border-color: var(--border) !important; }
  .CodeMirror { background: var(--bg) !important; color: var(--text) !important;
    border-color: var(--border) !important; font-size: 14px; }
  .CodeMirror-cursor { border-color: var(--accent2) !important; }
  /* ── Preview: site-like light theme ─────────────────────────────────────── */
  .editor-preview, .editor-preview-side {
    background: #fff !important; color: #333 !important;
    font-family: 'Noto Sans', Helvetica, Arial, sans-serif !important;
    font-size: 16px !important; line-height: 1.75 !important;
    padding: 40px 48px !important;
  }
  .editor-preview h1, .editor-preview h2, .editor-preview h3,
  .editor-preview h4, .editor-preview h5, .editor-preview h6,
  .editor-preview-side h1, .editor-preview-side h2, .editor-preview-side h3,
  .editor-preview-side h4, .editor-preview-side h5, .editor-preview-side h6 {
    font-family: 'Do Hyeon', 'Roboto Slab', Helvetica, Arial, sans-serif !important;
    color: #333 !important; margin: 4rem 0 1rem !important; line-height: 1.3 !important;
    font-weight: 400 !important;
  }
  .editor-preview h1, .editor-preview-side h1 { font-size: 2rem !important; }
  .editor-preview h2, .editor-preview-side h2 { font-size: 1.5rem !important; }
  .editor-preview h3, .editor-preview-side h3 { font-size: 1.2em !important; }
  .editor-preview h4, .editor-preview-side h4 { font-size: 1.08rem !important; margin: 3rem 0 0.5rem !important; }
  .editor-preview h5, .editor-preview-side h5 { font-size: 1.04rem !important; margin: 3rem 0 0.5rem !important; }
  .editor-preview h6, .editor-preview-side h6 { font-size: 1rem !important; margin: 3rem 0 0.5rem !important; }
  .editor-preview p, .editor-preview-side p { margin: 0 0 1rem !important; }
  .editor-preview a, .editor-preview-side a { color: rgb(79,177,186) !important; }
  .editor-preview strong, .editor-preview-side strong { color: #333 !important; }
  .editor-preview em, .editor-preview-side em { font-style: italic !important; }
  .editor-preview code, .editor-preview-side code {
    background: rgba(0,0,0,0.05) !important; color: #333 !important;
    padding: 0.1em 0.4em !important; border-radius: 3px !important;
    font-size: 0.88em !important; font-family: 'Fira Code', Menlo, Monaco, Consolas, monospace !important;
  }
  .editor-preview pre, .editor-preview-side pre {
    background: #f6f8fa !important; border: 1px solid #ebebeb !important;
    border-radius: 6px !important; padding: 16px 20px !important;
    overflow-x: auto !important; margin: 1em 0 !important;
  }
  .editor-preview pre code, .editor-preview-side pre code {
    background: transparent !important; color: #333 !important;
    padding: 0 !important; font-size: 0.9em !important;
  }
  .editor-preview blockquote, .editor-preview-side blockquote {
    border-left: 1px solid #ebebeb !important; margin: 1rem -1rem !important;
    padding: 1.2rem 1rem 0 1rem !important; color: #666 !important;
    background: transparent !important; border-radius: 0 !important;
    font-size: 0.9em !important;
  }
  .editor-preview ul, .editor-preview ol,
  .editor-preview-side ul, .editor-preview-side ol {
    padding-left: 1.25em !important; margin: 0 0 1rem !important;
  }
  .editor-preview li, .editor-preview-side li { margin: 0.2em 0 !important; }
  .editor-preview hr, .editor-preview-side hr {
    border: none !important; border-top: 1px solid #ebebeb !important; margin: 1rem 0 !important;
  }
  .editor-preview img, .editor-preview-side img {
    max-width: 100% !important; margin: 0.5em 0 !important;
    display: block !important;
  }
  .editor-preview table, .editor-preview-side table {
    border-collapse: collapse !important; width: 100% !important; margin: 1em 0 !important;
  }
  .editor-preview th, .editor-preview td,
  .editor-preview-side th, .editor-preview-side td {
    border: 1px solid #ebebeb !important; padding: 8px 12px !important;
  }
  .editor-preview th, .editor-preview-side th { background: #f6f8fa !important; }
  /* u = highlight (site style) */
  .editor-preview u, .editor-preview-side u {
    text-decoration: none !important; border-bottom: none !important;
    background-color: rgba(253,224,71,0.85) !important;
    padding: 0.05em 0.25em !important; border-radius: 3px !important;
  }
  /* TOC (#markdown-toc) */
  .editor-preview #markdown-toc, .editor-preview-side #markdown-toc {
    border-left: 1px solid #ebebeb !important;
    padding: 1.2rem 1rem 0.5rem 2.5rem !important;
    margin: 1.5rem 0 2rem !important;
    font-size: 0.9em !important; position: relative !important;
    background: transparent !important; color: #333 !important;
  }
  .editor-preview #markdown-toc .toc-label,
  .editor-preview-side #markdown-toc .toc-label {
    font-size: 0.667rem !important; font-weight: bold !important;
    text-transform: uppercase !important; letter-spacing: 0.025rem !important;
    color: #bbb !important; margin-bottom: 0.5rem !important;
    display: block !important; margin-left: -1.5rem !important;
  }
  .editor-preview #markdown-toc ul, .editor-preview-side #markdown-toc ul {
    list-style: disc !important; padding: 0 !important; margin: 0 !important;
  }
  .editor-preview #markdown-toc li, .editor-preview-side #markdown-toc li {
    margin: 0.2em 0 !important;
  }
  .editor-preview #markdown-toc a, .editor-preview-side #markdown-toc a {
    color: rgb(79,177,186) !important; text-decoration: none !important;
  }
  .editor-preview #markdown-toc a:hover, .editor-preview-side #markdown-toc a:hover {
    text-decoration: underline !important;
  }
  /* figcaption */
  .editor-preview .figcaption, .editor-preview-side .figcaption {
    text-align: center !important; color: #777 !important;
    font-size: 0.85em !important; margin-top: -0.5rem !important;
    margin-bottom: 2rem !important; display: block !important;
  }
  .editor-statusbar { background: var(--surface) !important; color: var(--muted) !important;
    border-color: var(--border) !important; }
  .CodeMirror-scroll { overflow-y: auto !important; }

  /* Buttons */
  button { cursor: pointer; border: none; font-size: 13px; font-weight: 500;
    border-radius: 6px; padding: 7px 14px; transition: all 0.15s; }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: #2563eb; }
  .btn-success { background: var(--success); color: #fff; font-size: 13px;
    padding: 7px 18px; }
  .btn-success:hover { background: #16a34a; }
  .btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); }
  .btn-ghost:hover { background: var(--surface2); color: var(--text); }
  .btn-danger { background: transparent; color: var(--danger);
    border: 1px solid var(--border); }
  .btn-danger:hover { background: #450a0a; }
  .btn-sm { padding: 5px 10px; font-size: 12px; }

  /* Status bar */
  .status-bar { padding: 6px 20px; background: var(--surface);
    border-top: 1px solid var(--border); font-size: 12px; color: var(--muted);
    display: flex; gap: 16px; align-items: center; flex-shrink: 0; }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
  .status-dot.saved { background: var(--success); }
  .status-dot.unsaved { background: #f59e0b; }
  .status-filename { font-family: monospace; font-size: 11px; }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; backdrop-filter: blur(4px); }
  .modal-overlay.hidden { display: none; }
  .modal { background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 24px; width: 480px; max-width: 95vw; }
  .modal h2 { font-size: 16px; margin-bottom: 16px; }
  .modal input, .modal textarea {
    width: 100%; background: var(--bg); border: 1px solid var(--border);
    color: var(--text); padding: 8px 12px; border-radius: 6px; font-size: 13px;
    margin-bottom: 12px; }
  .modal input:focus, .modal textarea:focus { outline: none; border-color: var(--accent); }
  .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }

  /* Image drop zone */
  .drop-zone { border: 2px dashed var(--border); border-radius: 8px;
    padding: 32px; text-align: center; cursor: pointer; color: var(--muted);
    margin-bottom: 12px; transition: all 0.2s; font-size: 13px; }
  .drop-zone:hover, .drop-zone.dragover { border-color: var(--accent);
    background: rgba(59,130,246,0.05); color: var(--text); }
  .drop-zone input { display: none; }

  /* Toast */
  .toast { position: fixed; bottom: 24px; right: 24px; padding: 10px 18px;
    border-radius: 8px; font-size: 13px; z-index: 9999;
    opacity: 0; transition: opacity 0.3s; pointer-events: none; }
  .toast.show { opacity: 1; }
  .toast.success { background: #14532d; color: #86efac; border: 1px solid #166534; }
  .toast.error { background: #450a0a; color: #fca5a5; border: 1px solid #7f1d1d; }

  /* Empty state */
  .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; color: var(--muted); gap: 12px; }
  .empty-state svg { opacity: 0.3; }
  .empty-state p { font-size: 14px; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
</style>
</head>
<body>

<header>
  <h1>✏️ Blog Editor</h1>
  <span class="badge">Jekyll · Hydejack</span>
</header>

<div class="layout">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <span>Posts</span>
      <button class="btn-primary btn-sm" onclick="newPost()">+ New</button>
    </div>
    <div class="post-list" id="postList"></div>
  </aside>

  <!-- Main -->
  <main class="main" id="mainArea">
    <div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      <p>Select a post or create a new one</p>
      <button class="btn-primary" onclick="newPost()">+ New Post</button>
    </div>
  </main>
</div>

<!-- New Post Modal -->
<div class="modal-overlay hidden" id="newPostModal">
  <div class="modal">
    <h2>New Post</h2>
    <label style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;">Title</label>
    <input type="text" id="npTitle" placeholder="Post title..." style="margin-top:5px;" autofocus>
    <label style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;">Tags (space-separated)</label>
    <input type="text" id="npTags" placeholder="javascript react nextjs" style="margin-top:5px;">
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal('newPostModal')">Cancel</button>
      <button class="btn-primary" onclick="createPost()">Create</button>
    </div>
  </div>
</div>

<!-- Image Upload Modal -->
<div class="modal-overlay hidden" id="imageModal">
  <div class="modal">
    <h2>Insert Image</h2>
    <div class="drop-zone" id="dropZone" onclick="document.getElementById('imgInput').click()">
      <input type="file" id="imgInput" accept="image/*" onchange="handleFile(this.files[0])">
      <div id="dropText">Click or drag & drop an image here</div>
    </div>
    <label style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;">Alt text</label>
    <input type="text" id="imgAlt" placeholder="Image description" style="margin-top:5px;">
    <div id="imgPreviewWrap" style="display:none;margin-bottom:12px;">
      <img id="imgPreview" style="max-width:100%;border-radius:6px;max-height:160px;object-fit:cover;">
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal('imageModal')">Cancel</button>
      <button class="btn-primary" onclick="insertImage()" id="insertImgBtn" disabled>Insert</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>

<script src="https://unpkg.com/easymde/dist/easymde.min.js"></script>
<script>
let editor = null;
let currentFile = null;
let isDirty = false;
let pendingImageFile = null;

// ── Boot ──────────────────────────────────────────────────────────────────────
window.onload = () => {
  loadPosts();
  setupDragDrop();
};

// ── Posts List ────────────────────────────────────────────────────────────────
async function loadPosts() {
  const res = await fetch('/api/posts');
  const posts = await res.json();
  const list = document.getElementById('postList');
  list.innerHTML = '';
  if (!posts.length) {
    list.innerHTML = '<div style="padding:16px;color:var(--muted);font-size:13px;">No posts yet</div>';
    return;
  }
  posts.forEach(p => {
    const dateMatch = p.filename.match(/^(\\d{4}-\\d{2}-\\d{2})/);
    const date = dateMatch ? dateMatch[1] : '';
    const el = document.createElement('div');
    el.className = 'post-item' + (p.filename === currentFile ? ' active' : '');
    el.dataset.file = p.filename;
    el.innerHTML = \`<div class="post-date">\${date}</div><div class="post-title">\${p.title}</div>\`;
    el.onclick = () => openPost(p.filename);
    list.appendChild(el);
  });
}

// ── Open Post ─────────────────────────────────────────────────────────────────
async function openPost(filename) {
  if (isDirty && !confirm('Unsaved changes. Continue?')) return;
  const res = await fetch('/api/post?file=' + encodeURIComponent(filename));
  const data = await res.json();
  if (!data.content) return;

  currentFile = filename;
  isDirty = false;

  // Parse frontmatter
  const fm = parseFrontmatter(data.content);
  mountEditor(fm);
  updateSidebar();
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\\n([\\s\\S]*?)\\n---\\n?([\\s\\S]*)/);
  if (!match) return { title: '', tags: '', image: '', body: raw };
  const yamlStr = match[1];
  const body = match[2] || '';
  const get = (key) => {
    const m = yamlStr.match(new RegExp('(?:^|\\\\n)' + key + ':\\\\s*(.+?)\\\\s*(?:\\\\n|$)'));
    if (!m) return '';
    return m[1].trim().replace(/^["']|["']$/g, '');
  };
  const imgMatch = yamlStr.match(/image:[\\s\\S]*?path:\\s*(.+)/);
  return {
    title: get('title'),
    tags: get('tags'),
    image: imgMatch ? imgMatch[1].trim() : '',
    body: body.trim()
  };
}

function buildFrontmatter(title, tags, image, date) {
  let fm = \`---\\nlayout: post\\ntitle: "\${title}"\\ncategory: blog\`;
  if (tags) fm += \`\\ntags: \${tags}\`;
  if (image) fm += \`\\nimage:\\n  path: \${image}\`;
  fm += \`\\ncomments: true\\n---\\n\`;
  return fm;
}

// ── Editor ────────────────────────────────────────────────────────────────────
function mountEditor(fm) {
  const main = document.getElementById('mainArea');

  // Pull date from filename
  const dateMatch = currentFile && currentFile.match(/^(\\d{4}-\\d{2}-\\d{2})/);
  const postDate = dateMatch ? dateMatch[1] : today();

  main.innerHTML = \`
    <div class="editor-toolbar-custom">
      <button class="btn-ghost btn-sm" onclick="openImageModal()">🖼 Image</button>
      <button class="btn-ghost btn-sm" onclick="insertSnippet('code')">{ } Code</button>
      <button class="btn-ghost btn-sm" onclick="insertSnippet('toc')">≡ TOC</button>
      <div style="flex:1"></div>
      <span id="filenameDisplay" style="font-family:monospace;font-size:11px;color:var(--muted)">\${currentFile || ''}</span>
      <button class="btn-success" onclick="savePost()">Save ⌘S</button>
    </div>
    <div class="frontmatter">
      <div class="fm-group">
        <label>Title</label>
        <input type="text" id="fmTitle" value="\${escHtml(fm.title)}" placeholder="Post title" oninput="markDirty()">
      </div>
      <div class="fm-group">
        <label>Tags</label>
        <input type="text" id="fmTags" value="\${escHtml(fm.tags)}" placeholder="tag1 tag2 tag3" oninput="markDirty(); checkNewTags()">
        <div id="newTagBadges" style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;"></div>
      </div>
      <div class="fm-group">
        <label>Thumb Image Path</label>
        <input type="text" id="fmImage" value="\${escHtml(fm.image)}" placeholder="/assets/img/blog/..." oninput="markDirty()">
      </div>
      <div class="fm-group">
        <label>&nbsp;</label>
        <button class="btn-ghost btn-sm" onclick="openImageAsThumb()">Browse</button>
      </div>
    </div>
    <div class="editor-wrap">
      <textarea id="mdeArea"></textarea>
    </div>
    <div class="status-bar">
      <span class="status-dot saved" id="statusDot"></span>
      <span id="statusText">Saved</span>
      <span style="flex:1"></span>
      <span class="status-filename" id="statusFilename">\${currentFile || ''}</span>
    </div>
  \`;

  if (editor) { try { editor.toTextArea(); } catch(e){} editor = null; }

  editor = new EasyMDE({
    element: document.getElementById('mdeArea'),
    initialValue: fm.body,
    spellChecker: false,
    autosave: { enabled: false },
    toolbar: ['bold','italic','heading','|','quote','unordered-list','ordered-list','|','link','|','preview','side-by-side','fullscreen','|','guide'],
    status: false,
    minHeight: '200px',
    previewRender: renderPreview,
    renderingConfig: { breaks: true },
  });

  editor.codemirror.on('change', markDirty);
  loadExistingTags().then(checkNewTags);

  // Keyboard shortcuts
  editor.codemirror.setOption('extraKeys', {
    'Cmd-S': savePost, 'Ctrl-S': savePost,
    "Cmd-\\\\": toggleSideBySide, "Ctrl-\\\\": toggleSideBySide,
    'Cmd-B': wrapBold, 'Ctrl-B': wrapBold,
    'Cmd-U': wrapUnderline, 'Ctrl-U': wrapUnderline,
    'Cmd-K': insertLink, 'Ctrl-K': insertLink,
    'Cmd-E': wrapCode, 'Ctrl-E': wrapCode,
  });

  // Ctrl+V paste image
  editor.codemirror.on('paste', async (cm, e) => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) break;
        const dateMatch = currentFile && currentFile.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2})/);
        const date = dateMatch ? dateMatch[1] : today();
        const uid = Date.now();
        const placeholder = '![uploading-' + uid + ']()';
        cm.replaceSelection(placeholder);
        toast('Uploading image...', 'success');
        try {
          const base64 = await toBase64(file);
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, filename: 'paste-' + uid + '.png', base64, mimeType: file.type })
          });
          const data = await res.json();
          if (data.path) {
            editor.value(editor.value().replace(placeholder, '![image](' + data.path + ')'));
            toast('Image pasted!', 'success');
            markDirty();
          } else {
            editor.value(editor.value().replace(placeholder, ''));
            toast('Upload failed', 'error');
          }
        } catch {
          editor.value(editor.value().replace(placeholder, ''));
          toast('Upload failed', 'error');
        }
        break;
      }
    }
  });
}

function escHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function markDirty() {
  isDirty = true;
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  if (dot) { dot.className = 'status-dot unsaved'; }
  if (txt) txt.textContent = 'Unsaved changes';
}

function markSaved() {
  isDirty = false;
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  if (dot) { dot.className = 'status-dot saved'; }
  if (txt) txt.textContent = 'Saved';
}

// ── Save ─────────────────────────────────────────────────────────────────────
async function savePost() {
  if (!currentFile || !editor) return;
  const title = document.getElementById('fmTitle')?.value || '';
  const tags = document.getElementById('fmTags')?.value || '';
  const image = document.getElementById('fmImage')?.value || '';
  const dateMatch = currentFile.match(/^(\\d{4}-\\d{2}-\\d{2})/);
  const date = dateMatch ? dateMatch[1] : today();
  const fm = buildFrontmatter(title, tags, image, date);
  const body = editor.value();
  const content = fm + '\\n' + body;

  const res = await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: currentFile, content })
  });
  const data = await res.json();
  if (data.ok) {
    markSaved();
    toast('Saved!', 'success');
    loadPosts();
  } else {
    toast('Save failed: ' + (data.error || 'unknown error'), 'error');
  }
}

// ── New Post ──────────────────────────────────────────────────────────────────
function newPost() {
  document.getElementById('npTitle').value = '';
  document.getElementById('npTags').value = '';
  document.getElementById('newPostModal').classList.remove('hidden');
  setTimeout(() => document.getElementById('npTitle').focus(), 50);
}

async function createPost() {
  const title = document.getElementById('npTitle').value.trim();
  const tags = document.getElementById('npTags').value.trim();
  if (!title) { toast('Title is required', 'error'); return; }
  const date = today();
  const slug = slugify(title);
  const filename = \`\${date}-\${slug}.md\`;
  const fm = buildFrontmatter(title, tags, '', date);
  const content = fm + '\\n';

  const res = await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, content })
  });
  const data = await res.json();
  if (data.ok) {
    closeModal('newPostModal');
    currentFile = data.filename;
    isDirty = false;
    await loadPosts();
    await openPost(data.filename);
    toast('Post created!', 'success');
  } else {
    toast('Failed: ' + (data.error || ''), 'error');
  }
}

// ── Image Upload ──────────────────────────────────────────────────────────────
let imageForThumb = false;

function openImageModal(forThumb = false) {
  imageForThumb = forThumb;
  pendingImageFile = null;
  document.getElementById('dropText').textContent = 'Click or drag & drop an image here';
  document.getElementById('imgAlt').value = '';
  document.getElementById('imgPreviewWrap').style.display = 'none';
  document.getElementById('insertImgBtn').disabled = true;
  document.getElementById('imageModal').classList.remove('hidden');
}

function openImageAsThumb() { openImageModal(true); }

function handleFile(file) {
  if (!file) return;
  pendingImageFile = file;
  document.getElementById('dropText').textContent = '✓ ' + file.name;
  document.getElementById('insertImgBtn').disabled = false;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('imgPreview').src = e.target.result;
    document.getElementById('imgPreviewWrap').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

async function insertImage() {
  if (!pendingImageFile) return;
  const dateMatch = currentFile && currentFile.match(/^(\\d{4}-\\d{2}-\\d{2})/);
  const date = dateMatch ? dateMatch[1] : today();
  const alt = document.getElementById('imgAlt').value || pendingImageFile.name.replace(/\\.[^.]+$/, '');

  const btn = document.getElementById('insertImgBtn');
  btn.textContent = 'Uploading...'; btn.disabled = true;

  const base64 = await toBase64(pendingImageFile);
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, filename: pendingImageFile.name, base64, mimeType: pendingImageFile.type })
  });
  const data = await res.json();
  btn.textContent = 'Insert'; btn.disabled = false;

  if (data.path) {
    if (imageForThumb) {
      const fi = document.getElementById('fmImage');
      if (fi) fi.value = data.path;
      markDirty();
    } else if (editor) {
      const imgMd = \`![\${alt}](\${data.path})\`;
      editor.codemirror.replaceSelection(imgMd);
    }
    closeModal('imageModal');
    toast('Image uploaded!', 'success');
  } else {
    toast('Upload failed', 'error');
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Wrap / Insert helpers ─────────────────────────────────────────────────────
function wrapBold() {
  if (!editor) return;
  const cm = editor.codemirror;
  const sel = cm.getSelection();
  if (sel) {
    cm.replaceSelection('**' + sel + '**');
  } else {
    const cur = cm.getCursor();
    cm.replaceRange('****', cur);
    cm.setCursor({ line: cur.line, ch: cur.ch + 2 });
  }
  cm.focus();
}

function wrapCode() {
  if (!editor) return;
  const cm = editor.codemirror;
  const sel = cm.getSelection();
  if (sel && sel.includes('\\n')) {
    cm.replaceSelection('\`\`\`\\n' + sel + '\\n\`\`\`');
  } else if (sel) {
    cm.replaceSelection('\`' + sel + '\`');
  } else {
    const cur = cm.getCursor();
    cm.replaceRange('\`\`', cur);
    cm.setCursor({ line: cur.line, ch: cur.ch + 1 });
  }
  cm.focus();
}

function wrapUnderline() {
  if (!editor) return;
  const cm = editor.codemirror;
  const sel = cm.getSelection();
  if (sel) {
    cm.replaceSelection('<u>' + sel + '</u>');
  } else {
    const cur = cm.getCursor();
    cm.replaceRange('<u></u>', cur);
    cm.setCursor({ line: cur.line, ch: cur.ch + 3 });
  }
  cm.focus();
}

function insertLink() {
  if (!editor) return;
  const cm = editor.codemirror;
  const sel = cm.getSelection();
  const text = sel || 'link text';
  const snippet = '[' + text + '](url)';
  cm.replaceSelection(snippet);
  // select 'url' part so user can type right away
  const cur = cm.getCursor();
  const urlStart = cur.ch - 4;
  cm.setSelection({ line: cur.line, ch: urlStart }, { line: cur.line, ch: cur.ch - 1 });
  cm.focus();
}

// ── Tag Management ────────────────────────────────────────────────────────────
let existingTags = [];

async function loadExistingTags() {
  const res = await fetch('/api/tags');
  existingTags = await res.json();
}

function checkNewTags() {
  const input = document.getElementById('fmTags');
  const badges = document.getElementById('newTagBadges');
  if (!input || !badges) return;
  const tags = input.value.trim().split(/\\s+/).filter(Boolean);
  const newTags = tags.filter(t => t && !existingTags.includes(t));
  badges.innerHTML = '';
  newTags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'btn-ghost btn-sm';
    btn.style.cssText = 'font-size:11px;padding:2px 8px;color:#f59e0b;border-color:#f59e0b;';
    btn.textContent = '+ ' + tag;
    btn.title = 'Click to create _featured_tags/' + tag + '.md';
    btn.onclick = () => createNewTag(tag);
    badges.appendChild(btn);
  });
}

async function createNewTag(slug) {
  const res = await fetch('/api/create-tag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug })
  });
  const data = await res.json();
  if (data.ok) {
    existingTags.push(data.slug);
    toast('Tag "' + data.slug + '" created!', 'success');
    checkNewTags();
  } else {
    toast('Failed: ' + (data.error || ''), 'error');
  }
}

// ── Preview Render ────────────────────────────────────────────────────────────
function tocId(text) {
  return text.toLowerCase()
    .replace(/[^\\w\\s가-힣]/g, '')
    .replace(/\\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateTOCHtml(markdown) {
  const items = [];
  const re = /^(#{1,6})\\s+(.+)$/gm;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    const level = m[1].length;
    const raw = m[2]
      .replace(/\\*\\*(.*?)\\*\\*/g, '$1')
      .replace(/\\*(.*?)\\*/g, '$1')
      .replace(/\`(.*?)\`/g, '$1')
      .replace(/<[^>]+>/g, '').trim();
    items.push({ level, text: raw, id: tocId(raw) });
  }
  if (!items.length) return '<nav id="markdown-toc"><span class="toc-label">목차</span><p style="color:#aaa;font-size:0.85em;margin:0.5rem 0">헤딩이 없습니다.</p></nav>';
  const minLevel = Math.min(...items.map(i => i.level));
  let html = '<nav id="markdown-toc"><span class="toc-label">목차</span><ul>';
  items.forEach(item => {
    const pad = (item.level - minLevel) * 14;
    html += \`<li style="padding-left:\${pad}px"><a href="#\${item.id}">\${item.text}</a></li>\`;
  });
  html += '</ul></nav>';
  return html;
}

function renderPreview(text) {
  if (!editor) return '';
  // 1. Protect SVG blocks — marked.js mangles <text> elements inside SVG
  const svgBlocks = [];
  let md = text.replace(/<svg[\\s\\S]*?<\\/svg>/gi, (match) => {
    svgBlocks.push(match);
    return 'SVGBLOCK' + (svgBlocks.length - 1) + 'ENDSVG';
  });
  // 2. Pre-process TOC: * toc\\n{:toc}
  md = md.replace(/^\\*\\s+toc\\s*\\n\\{:toc\\}/gm, '\\nXTOCPLACEHOLDERX\\n');
  let html = editor.markdown(md);
  // 3. Restore SVG blocks (handle both plain and <p>-wrapped placeholders)
  html = html.replace(/<p>SVGBLOCK(\\d+)ENDSVG<\\/p>/g, (_, i) => svgBlocks[+i]);
  html = html.replace(/SVGBLOCK(\\d+)ENDSVG/g, (_, i) => svgBlocks[+i]);
  // 4. Post-process figcaption: marked renders {:.figcaption} as <p>{:.figcaption}</p>
  html = html.replace(/(<p>(?:(?!<p>|<\\/p>)[\\s\\S])*?<\\/p>)\\s*<p>\\{:\\.figcaption\\}<\\/p>/g,
    (match, prevP) => '<p class="figcaption">' + prevP.slice(3));
  // 5. Add IDs to headings (for TOC anchor links)
  html = html.replace(/<(h[1-6])>([\\s\\S]*?)<\\/\\1>/g, (match, tag, content) => {
    const id = tocId(content.replace(/<[^>]+>/g, '').trim());
    return \`<\${tag} id="\${id}">\${content}</\${tag}>\`;
  });
  // 6. Insert TOC
  html = html.replace('<p>XTOCPLACEHOLDERX</p>', generateTOCHtml(text));
  return html;
}

// ── Toggle Side-by-side ───────────────────────────────────────────────────────
function toggleSideBySide() {
  if (!editor) return;
  const btn = document.querySelector('.editor-toolbar .side-by-side');
  if (btn) btn.click();
}

// ── Snippets ──────────────────────────────────────────────────────────────────
function insertSnippet(type) {
  if (!editor) return;
  const snippets = {
    code: '\\n\`\`\`javascript\\n// code here\\n\`\`\`\\n',
    toc: '\\n* toc\\n{:toc}\\n',
  };
  editor.codemirror.replaceSelection(snippets[type] || '');
  editor.codemirror.focus();
}

// ── Drag & Drop ───────────────────────────────────────────────────────────────
function setupDragDrop() {
  const dz = document.getElementById('dropZone');
  if (!dz) return;
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  });
}

// ── Modals ────────────────────────────────────────────────────────────────────
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => m.classList.add('hidden'));
  }
});

// ── Toast ─────────────────────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = \`toast \${type} show\`;
  setTimeout(() => el.classList.remove('show'), 2500);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function slugify(text) {
  return text.toLowerCase().replace(/[^\\w\\s-]/g,'').replace(/[\\s_-]+/g,'-').replace(/^-+|-+$/g,'');
}
function today() {
  const d = new Date();
  return \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`;
}
function updateSidebar() {
  document.querySelectorAll('.post-item').forEach(el => {
    el.classList.toggle('active', el.dataset.file === currentFile);
  });
}
</script>
</body>
</html>`;

// ─── HTTP Server ─────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');

  // GET /
  if (req.method === 'GET' && pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML);
    return;
  }

  // GET /api/posts
  if (req.method === 'GET' && pathname === '/api/posts') {
    json(res, listPosts());
    return;
  }

  // GET /api/post?file=xxx
  if (req.method === 'GET' && pathname === '/api/post') {
    const file = parsed.query.file;
    const content = readPost(file);
    if (content === null) { json(res, { error: 'not found' }, 404); return; }
    json(res, { content });
    return;
  }

  // POST /api/save
  if (req.method === 'POST' && pathname === '/api/save') {
    const body = await readBody(req);
    try {
      const saved = savePost(body);
      if (!saved) { json(res, { error: 'invalid data' }, 400); return; }
      json(res, { ok: true, filename: saved });
    } catch (e) {
      json(res, { error: e.message }, 500);
    }
    return;
  }

  // GET /api/tags
  if (req.method === 'GET' && pathname === '/api/tags') {
    json(res, listTags());
    return;
  }

  // POST /api/create-tag
  if (req.method === 'POST' && pathname === '/api/create-tag') {
    const body = await readBody(req);
    try {
      const slug = createTag(body);
      if (!slug) { json(res, { error: 'invalid slug' }, 400); return; }
      json(res, { ok: true, slug });
    } catch (e) {
      json(res, { error: e.message }, 500);
    }
    return;
  }

  // POST /api/upload
  if (req.method === 'POST' && pathname === '/api/upload') {
    const body = await readBody(req);
    try {
      const imgPath = uploadImage(body);
      if (!imgPath) { json(res, { error: 'invalid data' }, 400); return; }
      json(res, { path: imgPath });
    } catch (e) {
      json(res, { error: e.message }, 500);
    }
    return;
  }

  // Serve static assets (images etc.) from blog root
  if (req.method === 'GET' && (pathname.startsWith('/assets/') || pathname.startsWith('/favicon'))) {
    const filePath = path.join(BLOG_ROOT, pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = { '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
        '.gif':'image/gif', '.webp':'image/webp', '.svg':'image/svg+xml' }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n  Blog Editor running at http://localhost:${PORT}\n`);
  console.log(`  Posts dir : ${POSTS_DIR}`);
  console.log(`  Assets dir: ${ASSETS_DIR}`);
  console.log(`\n  Press Ctrl+C to stop\n`);
});

function shutdown() {
  server.close(() => process.exit(0));
  // Force exit if server.close hangs (open connections)
  setTimeout(() => process.exit(0), 500).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

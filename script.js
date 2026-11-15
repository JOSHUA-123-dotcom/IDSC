'use strict';

/* ==========================================================
   Infotech Development System College – responsive web app
   (phone layout + desktop layout, one code base)
   1) Helpers  2) Data  3) Screens  4) States  5) Router  6) Events
   ========================================================== */

/* ---------- 1) Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const icon = (name, cls = '') => `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const parts = (iso) => iso.split('-').map(Number); // [year, month, day]
const fmtShort = (iso) => { const [y, m, d] = parts(iso); return `${MONTHS_SHORT[m - 1]} ${d}, ${y}`; };
const fmtLong = (iso) => { const [y, m, d] = parts(iso); return `${MONTHS_LONG[m - 1]} ${d}, ${y}`; };

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('idsc:' + key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('idsc:' + key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  },
};

let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------- 2) Data (edit this to change the content) ---------- */

/* ALL PICTURES LIVE HERE. Put the files in the "images" folder and
   change the file name. Leave '' (empty) to show a green placeholder.
   Announcement pictures are set per announcement further below. */
const images = {
  logo:   'images/logo.png',     // header, menu, sidebar
  hero:   'images/campus.jpg',   // Home banner background
  about:  'images/campus.jpg',   // About page photo
  avatar: '',                    // default profile photo in Settings
};

/* items = the buttons shown on each module's page */
const modules = [
  { name: 'Registrar',      icon: 'user',   desc: 'Student records & enrollment',
    items: ['View enrollment status', 'Request transcript of records', 'Update student record'] },
  { name: 'Library',        icon: 'book',   desc: 'Books & resources',
    items: ['Search the catalog', 'View borrowed books', 'Reserve a book'] },
  { name: 'Student Portal', icon: 'cap',    desc: 'Grades & student services',
    items: ['View grades', 'Class schedule', 'Request a certificate'] },
  { name: 'Finance',        icon: 'dollar', desc: 'Tuition & payments',
    items: ['View tuition balance', 'Payment history', 'Submit proof of payment'] },
  { name: 'Faculty',        icon: 'users',  desc: 'Faculty portal & tools',
    items: ['Class lists', 'Submit grades', 'Post an announcement'] },
  { name: 'Clinic',         icon: 'heart',  desc: 'Health services',
    items: ['Book a clinic visit', 'Health records', 'Request a medical certificate'] },
  { name: 'Inventory',      icon: 'box',    desc: 'Supplies & equipment',
    items: ['Request supplies', 'View equipment', 'Report a damaged item'] },
];
const slugify = (s) => s.toLowerCase().replace(/\s+/g, '-');

// cat = filter category: 'news' | 'events' | 'school'
const announcements = [
  {
    id: 1, type: 'announcement', cat: 'school', label: 'ANNOUNCEMENT',
    image: 'images/campus.jpg',                    // CARD picture (small, in the list)
    detailImage: 'images/enrollment-detail.jpg',   // CLICKED picture (large, details screen)
    title: 'Enrollment for A.Y. 2026-2027 is now open',
    excerpt: 'Enrollment for A.Y. 2026-2027 is now officially open...',
    date: '2026-09-15',
    body: [
      'Good news, students! Enrollment for A.Y. 2026-2027 is now officially open.',
      'Make sure to prepare all the required documents and complete your enrollment within the given schedule.',
      'For more information and updates, stay tuned to the college’s official pages.',
      'Enroll on time and be ready for another exciting academic year!',
    ],
  },
  {
    id: 2, type: 'event', cat: 'events', label: 'EVENT',
    image: 'images/intramurals.jpg',                // CARD picture (small, in the list)
    detailImage: 'images/intramurals-detail.jpg',  // CLICKED picture (large, details screen)
    title: 'College Intramurals Schedule',
    excerpt: 'Get ready for the upcoming college intramurals...',
    date: '2026-09-10',
    body: [
      'Get ready for our upcoming College Intramurals!',
      'Students are invited to participate in the scheduled sports competitions and college activities.',
      'Please wait for the official announcement of the event venue, team assignments, and complete schedule.',
      'For more information and updates, stay tuned to the college’s official pages.',
    ],
  },
  {
    id: 3, type: 'news', cat: 'news', label: 'NEWS',
    image: 'images/maintenance.jpg',                // CARD picture (small, in the list)
    detailImage: 'images/maintenance-detail.jpg',  // CLICKED picture (large, details screen)
    title: 'System Maintenance', detailTitle: 'System Maintenance Notice',
    excerpt: 'System maintenance will improve performance...',
    date: '2026-09-08',
    body: [
      'Please be informed that selected college systems may undergo scheduled maintenance.',
      'During this period, some online services may be temporarily unavailable.',
      'Students are encouraged to complete important online transactions ahead of the maintenance schedule.',
      'Thank you for your patience and understanding.',
    ],
  },
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'news', label: 'News' },
  { key: 'events', label: 'Events' },
  { key: 'school', label: 'School Information' },
];

/* State that survives between screens */
let filter = 'all';
let query = '';
let announcementsSeen = false;        // the first visit shows the Loading state
let newsTimer;
let user = store.get('user', null);   // set when someone logs in (demo, no real accounts)
let settings = {
  name: 'Juan Dela Cruz',
  email: 'juan.delacruz@email.com',
  role: 'Student',
  notifications: true,
  emailUpdates: true,
  theme: 'light',
  ...store.get('settings', {}),
};

function applyTheme() {
  document.documentElement.dataset.theme = settings.theme === 'dark' ? 'dark' : 'light';
}

/* ---------- 3) Screens (each returns an HTML string) ---------- */
const tag = (label, cls) => `<span class="tag ${cls}">${label}</span>`;

const moduleTile = (m, wide = false) => `
  <a class="card module" href="#/module/${slugify(m.name)}">
    <span class="module-ico">${icon(m.icon)}</span>
    <span class="module-text"><strong>${m.name}</strong><small>${m.desc}</small></span>
    <span class="module-open">${wide ? 'Open Module' : 'Open'} ${icon('arrow-right')}</span>
  </a>`;

const newsCard = (a) => `
  <a class="card news-card" href="#/announcement/${a.id}">
    <div class="thumb"><img src="${a.image}" alt="" loading="lazy" onerror="this.remove()"></div>
    <div class="news-body">
      <div class="tags">${tag(a.label, a.type)}${tag('PUBLISHED', 'published')}</div>
      <h3>${a.title}</h3>
      <p class="excerpt">${a.excerpt}</p>
      <div class="news-foot">
        <time datetime="${a.date}">${fmtShort(a.date)}</time>
        <span class="more">Read More ${icon('arrow-right')}</span>
      </div>
    </div>
  </a>`;

const latestCard = (a) => `
  <a class="card latest" href="#/announcement/${a.id}">
    ${tag(a.label, a.type)}
    <h3>${a.title}</h3>
    <p class="excerpt">${a.excerpt}</p>
    <div class="latest-foot">
      <time datetime="${a.date}">${fmtShort(a.date)}</time>
      <span class="more">Read More ${icon('arrow-right')}</span>
    </div>
  </a>`;

const newest = () => [...announcements].sort((a, b) => b.date.localeCompare(a.date));

/* Form field helpers. Every field has a slot for its red validation message. */
const msgSlot = '<small class="field-msg" role="alert"></small>';
const pwField = (id, label, placeholder, autocomplete) => `
  <label class="field"><span>${label}</span>
    <div class="input">${icon('lock')}<input id="${id}" type="password" autocomplete="${autocomplete}" placeholder="${placeholder}">
      <button type="button" data-action="toggle-password" aria-label="Show password">${icon('eye')}</button></div>${msgSlot}</label>`;
const textField = (id, label, placeholder, ico, autocomplete) => `
  <label class="field"><span>${label}</span>
    <div class="input">${icon(ico)}<input id="${id}" autocomplete="${autocomplete}" placeholder="${placeholder}"></div>${msgSlot}</label>`;

const views = {
  home: () => `
    <section class="hero"${images.hero ? ` style="--hero-img:url('${images.hero}')"` : ''}>
      <p class="hero-kicker">Welcome to</p>
      <h1 class="hero-title">Infotech Development System College</h1>
      <p class="hero-sub">Building better futures through quality education.</p>
      <div class="hero-actions">
        <a class="btn btn-sm" href="#/modules" style="border:1px solid rgba(255,255,255,.6)">Explore Modules</a>
        <a class="btn btn-sm btn-light" href="#/login">Student Login</a>
      </div>
    </section>

    <h2 class="section-title" style="margin-top:22px">Quick Access</h2>
    <p class="sub">Access the services and systems available in the College Management System.</p>
    <div class="grid-2">${modules.map((m) => moduleTile(m)).join('')}</div>

    <div class="section-head">
      <h2 class="section-title">Latest Announcements</h2>
      <a class="link" href="#/announcements">View All ${icon('arrow-right')}</a>
    </div>
    <div class="latest-list">${newest().slice(0, 3).map(latestCard).join('')}</div>`,

  modules: () => `
    <h1 class="page-title">College Modules</h1>
    <p class="sub">Access the services and systems available in the College Management System.</p>
    <div class="stack">${modules.map((m) => moduleTile(m, true)).join('')}</div>`,

  announcements: () => `
    <h1 class="page-title">Announcement &amp; Updates</h1>
    <p class="sub">Stay informed with the latest news, events and updates from our college.</p>
    <label class="search" style="margin-top:18px">
      ${icon('search')}
      <input id="search" type="search" placeholder="Search announcements..." value="${esc(query)}" autocomplete="off">
    </label>
    <div class="chips" role="group" aria-label="Filter announcements">
      ${FILTERS.map((f) => `<button type="button" class="chip" data-filter="${f.key}" aria-pressed="${f.key === filter}">${f.label}</button>`).join('')}
    </div>
    <div id="newsList" class="news-list" aria-live="polite"></div>`,

  announcement: (id) => {
    const a = announcements.find((x) => x.id === Number(id));
    if (!a) return null;
    return `
      <a class="back" href="#/announcements">${icon('arrow-left')} Back to Announcement</a>
      <article class="detail">
        <h1>${a.detailTitle || a.title}</h1>
        <div class="tags">${tag(a.label, a.type)}${tag('PUBLISHED', 'published')}</div>
        <div class="date-row">${icon('calendar')}<time datetime="${a.date}">${fmtLong(a.date)}</time></div>
        <div class="detail-img"><img src="${a.detailImage}" alt="" onerror="if(!this.dataset.f){this.dataset.f=1;this.src='${a.image}'}else{this.remove()}"></div>
        <div class="prose">${a.body.map((p) => `<p>${p}</p>`).join('')}</div>
      </article>`;
  },

  module: (slug) => {
    const m = modules.find((x) => slugify(x.name) === slug);
    if (!m) return null;
    return `
      <a class="back" href="#/modules">${icon('arrow-left')} Back to Modules</a>
      <div class="detail">
        <div class="mod-head">
          <span class="module-ico">${icon(m.icon)}</span>
          <div><h2 class="page-title">${m.name}</h2><p class="sub">${m.desc}</p></div>
        </div>
        ${user ? '' : '<p class="notice">Please <a href="#/login">log in</a> to use this module.</p>'}
        <div class="mod-actions">
          ${m.items.map((item) => `
            <button type="button" class="card mod-action" data-action="module-action" data-name="${m.name}" data-item="${item}">
              <span>${item}</span>${icon('arrow-right')}
            </button>`).join('')}
        </div>
      </div>`;
  },

  about: () => `
    <h1 class="page-title">About Infotech Development System College</h1>
    <p class="sub">Learn more about our institution, our mission, and our commitment to students.</p>
    <div class="about-grid">
      <div class="about-img">${images.about ? `<img src="${images.about}" alt="Campus building" onerror="this.remove()">` : ''}</div>
      <div>
        <h2>Who We Are</h2>
        <p>Infotech Development System College is a leading educational institution committed to providing quality education and developing competent, innovative and responsible individuals.</p>
      </div>
    </div>

    <div class="info-row">
      <div class="card info-card"><span class="info-ico">${icon('heart')}</span>
        <div><h3>Mission</h3><p>To provide quality education for personal and community development.</p></div></div>
      <div class="card info-card"><span class="info-ico">${icon('eye')}</span>
        <div><h3>Vision</h3><p>To produce skilled and responsible graduates who help their communities.</p></div></div>
      <div class="card info-card"><span class="info-ico">${icon('users')}</span>
        <div><h3>Goals</h3><p>1. Promote community development.<br>2. Provide quality education.<br>3. Develop future leaders.<br>4. Encourage community involvement.</p></div></div>
    </div>

    <section class="contact">
      <h2>Contact Information</h2>
      <div class="contact-list">
        <div class="contact-row"><span class="info-ico">${icon('pin')}</span><div><small>Address</small><strong>Natera St., Dunao, Ligao City, 4504</strong></div></div>
        <div class="contact-row"><span class="info-ico">${icon('mail')}</span><div><small>Email</small><strong>idscollegesinc@gmail.com</strong></div></div>
        <div class="contact-row"><span class="info-ico">${icon('phone')}</span><div><small>Phone</small><strong>09178812638</strong></div></div>
      </div>
    </section>`,

  settings: () => `
    <h1 class="page-title">Settings</h1>
    <p class="sub">Manage your account preferences and settings.</p>

    <section class="card settings-card">
      <h2>Profile Information</h2>
      <div class="profile">
        <div class="avatar-col">
          <div class="avatar" id="avatar">${images.avatar ? `<img src="${images.avatar}" alt="Profile photo" onerror="this.remove()">` : icon('user')}</div>
          <input type="file" id="photoInput" accept="image/*" hidden>
          <button type="button" class="btn-outline" data-action="change-photo">Change Photo</button>
        </div>
        <div>
          <label class="field"><span>Full Name</span>
            <div class="input readonly"><input id="fullName" value="${esc(settings.name)}" readonly></div></label>
          <label class="field"><span>Email Address</span>
            <div class="input readonly"><input id="email" type="email" value="${esc(settings.email)}" readonly></div></label>
          <label class="field"><span>Role</span>
            <div class="input readonly">${icon('lock')}<input value="${esc(settings.role)}" readonly></div></label>
          <p class="error" id="profileError"></p>
          <div class="profile-actions">
            <button type="button" class="btn btn-sm" data-action="edit-profile" id="editBtn">${icon('edit')} Edit Profile</button>
          </div>
        </div>
      </div>
    </section>

    <section class="card settings-card">
      <h2>Preferences</h2>
      <div class="prefs">
        <div class="pref"><span class="pref-ico">${icon('bell')}</span>
          <div class="pref-text"><strong>Notifications</strong><small>Receive college announcements</small></div>
          <input type="checkbox" class="switch" data-setting="notifications" aria-label="Notifications" ${settings.notifications ? 'checked' : ''}></div>
        <div class="pref"><span class="pref-ico">${icon('mail')}</span>
          <div class="pref-text"><strong>Email Updates</strong><small>Receive updates by email</small></div>
          <input type="checkbox" class="switch" data-setting="emailUpdates" aria-label="Email updates" ${settings.emailUpdates ? 'checked' : ''}></div>
        <div class="pref"><span class="pref-ico">${icon('palette')}</span>
          <div class="pref-text"><strong>Theme</strong><small>Choose your preferred theme</small>
            <select class="select" data-setting="theme" aria-label="Theme">
              <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
              <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
            </select></div></div>
      </div>
    </section>

    <section class="card settings-card">
      <h2>Security</h2>
      <div class="security-row">${icon('shield')}<span>Keep your account secure by updating your password regularly.</span>
        <button type="button" class="btn btn-sm" data-action="change-password">${icon('lock')} Change Password</button>
      </div>
    </section>

    <dialog class="dlg" id="pwDialog" aria-labelledby="pwTitle">
      <form id="pwForm" novalidate>
        <h2 id="pwTitle">Change Password</h2>
        ${pwField('pwCurrent', 'Current Password', '', 'current-password')}
        ${pwField('pwNew', 'New Password', '', 'new-password')}
        ${pwField('pwConfirm', 'Confirm New Password', '', 'new-password')}
        <div class="dlg-actions">
          <button type="button" class="btn-outline" data-action="close-dialog">Cancel</button>
          <button type="submit" class="btn btn-sm">Save Password</button>
        </div>
      </form>
    </dialog>`,

  /* mode: undefined = log in, 'signup' = create account, 'forgot' = reset password */
  login: (mode) => {
    let body;
    if (mode === 'signup') {
      body = `
        <h1>Create account</h1>
        <p class="sub">Sign up to use the College Management System.</p>
        <form id="signupForm" novalidate>
          ${textField('suName', 'Full Name', 'Enter your full name', 'user', 'name')}
          ${textField('suEmail', 'Email', 'Enter your email', 'mail', 'email')}
          ${pwField('suPw', 'Password', 'At least 6 characters', 'new-password')}
          ${pwField('suPw2', 'Confirm Password', 'Re-enter your password', 'new-password')}
          <button class="btn btn-block" type="submit">Create account</button>
        </form>
        <p class="login-foot">Already have an account? <a href="#/login">Log in</a></p>`;
    } else if (mode === 'forgot') {
      body = `
        <h1>Forgot password?</h1>
        <p class="sub">Enter your email and we’ll send you a reset link.</p>
        <form id="forgotForm" novalidate>
          ${textField('fpEmail', 'Email', 'Enter your email', 'mail', 'email')}
          <button class="btn btn-block" type="submit">Send reset link</button>
        </form>
        <p class="login-foot">Back to <a href="#/login">Log in</a></p>`;
    } else {
      body = `
        <h1>Welcome!</h1>
        <p class="sub">Sign in to continue to the College Management System.</p>
        <form id="loginForm" novalidate>
          ${textField('loginId', 'Email or Student ID', 'Enter your email or student ID', 'user', 'username')}
          ${pwField('loginPw', 'Password', 'Enter your password', 'current-password')}
          <div class="row-between">
            <label class="check"><input type="checkbox" id="remember" checked> Remember me</label>
            <a href="#/login/forgot">Forgot password?</a>
          </div>
          <button class="btn btn-block" type="submit">Login</button>
        </form>
        <p class="login-foot">Don’t have an account? <a href="#/login/signup">Sign up</a></p>`;
    }

    return `
      <div class="login-wrap">
        <div class="login-card">
          <a class="icon-btn login-close" href="#/home" aria-label="Close">${icon('x')}</a>
          <div class="login-brand"><span class="dot"></span>IDS College</div>
          ${body}
        </div>
      </div>`;
  },
};

/* ---------- 4) States (loading, empty, error, success, confirmation) ---------- */
const stateCard = ({ ico, tone = '', title, text = '', actions = '' }) => `
  <div class="state-card" role="status">
    <span class="state-ico ${tone}">${ico}</span>
    <h2>${title}</h2>
    ${text ? `<p>${text}</p>` : ''}
    ${actions ? `<div class="state-actions">${actions}</div>` : ''}
  </div>`;

const stateBtn = (label, action) => `<button type="button" class="btn btn-sm" data-action="${action}">${label}</button>`;

const states = {
  loading: () => stateCard({
    ico: icon('spinner', 'spin'), title: 'Loading...',
    text: 'Please wait while we fetch the latest information.',
  }),
  empty: () => stateCard({
    ico: icon('file'), title: 'No announcement yet.',
    text: 'There are currently no published announcements.',
    actions: stateBtn('Refresh', 'reload-news'),
  }),
  noMatch: () => stateCard({
    ico: icon('search'), title: 'No announcement found.',
    text: 'Try a different search or filter.',
    actions: stateBtn('Clear filters', 'clear-filters'),
  }),
  error: () => stateCard({
    ico: icon('warn'), tone: 'err', title: 'Something went wrong',
    text: 'We couldn’t load the data at the moment.',
    actions: stateBtn('Try Again', 'reload-news'),
  }),
};

/* Pop-up versions (success + confirmation) share one dialog */
const modal = document.createElement('dialog');
modal.className = 'dlg state-dlg';
document.body.append(modal);

function showSuccess(title) {
  modal.innerHTML = stateCard({
    ico: icon('check-circle'), tone: 'ok', title,
    actions: '<button type="button" class="btn btn-sm" data-modal="close">Continue</button>',
  });
  modal.showModal();
}

function showConfirmPassword() {
  modal.innerHTML = `
    <button type="button" class="dlg-x" data-modal="close" aria-label="Close">${icon('x')}</button>
    ${stateCard({
      ico: icon('alert-square'), tone: 'ok',
      title: 'Are you sure you want to change password?',
      text: 'Continue if you want to change your password',
      actions: `<button type="button" class="btn btn-sm" data-modal="confirm-password">Continue</button>
                <button type="button" class="btn-danger" data-modal="close">Cancel</button>`,
    })}`;
  modal.showModal();
}

modal.addEventListener('click', (e) => {
  if (e.target === modal) { modal.close(); return; }          // click on the dark backdrop
  const el = e.target.closest('[data-modal]');
  if (!el) return;
  modal.close();
  if (el.dataset.modal === 'confirm-password') {
    const dialog = $('#pwDialog');
    if (!dialog) return;
    $('#pwForm').reset();
    $$('.input.invalid', dialog).forEach((b) => b.classList.remove('invalid'));
    $$('.field-msg', dialog).forEach((m) => { m.textContent = ''; });
    dialog.showModal();
  }
});

/* Announcement list: loading -> list / empty / error.
   force = 'loading' | 'empty' | 'error' lets you preview each state:
   open  #/announcements/loading  #/announcements/empty  #/announcements/error */
function renderNewsList(force) {
  const box = $('#newsList');
  if (!box) return;
  clearTimeout(newsTimer);

  if (force === 'loading') { box.innerHTML = states.loading(); return; }
  if (force === 'empty') { box.innerHTML = states.empty(); return; }
  if (force === 'error' || !navigator.onLine) { box.innerHTML = states.error(); return; }

  if (!announcementsSeen) {                       // first visit: show Loading for a moment
    box.innerHTML = states.loading();
    newsTimer = setTimeout(() => { announcementsSeen = true; renderNewsList(); }, 700);
    return;
  }

  const q = query.trim().toLowerCase();
  const items = newest().filter((a) =>
    (filter === 'all' || a.cat === filter) &&
    (!q || `${a.title} ${a.excerpt}`.toLowerCase().includes(q)));
  box.innerHTML = !announcements.length ? states.empty()
    : items.length ? items.map(newsCard).join('')
    : states.noMatch();
}

/* Red validation messages under form fields */
function setFieldError(id, message) {
  const input = $('#' + id);
  if (!input) return;
  const box = input.closest('.input');
  const slot = box.parentElement.querySelector('.field-msg');
  box.classList.toggle('invalid', Boolean(message));
  input.setAttribute('aria-invalid', String(Boolean(message)));
  if (slot) slot.textContent = message ? '*' + message : '';
}

/* errors = { fieldId: 'message' or '' }. Returns true if any field is wrong. */
function showErrors(errors) {
  const ids = Object.keys(errors);
  ids.forEach((id) => setFieldError(id, errors[id]));
  const first = ids.find((id) => errors[id]);
  if (first) $('#' + first).focus();
  return Boolean(first);
}

/* ---------- 5) Router (the URL after # decides the screen) ---------- */
const view = $('#view');

function route() {
  const [name = 'home', param] = (location.hash.replace(/^#\/?/, '') || 'home').split('/');
  const build = views[name];
  const html = build ? build(param) : null;
  if (html === null) { location.hash = '#/home'; return; }

  view.innerHTML = html;
  if (name === 'announcements') renderNewsList(param);

  document.body.classList.toggle('login-mode', name === 'login');
  const section = name === 'announcement' ? 'announcements' : name;
  $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === section));

  renderUser();
  setMenu(false);
  window.scrollTo(0, 0);
}

/* ---------- 6) Events ---------- */
/* Slide-out menu (phone layout) */
const drawer = $('#drawer');
const scrim = $('#scrim');
const menuBtn = $('#menuBtn');

function setMenu(open) {
  const was = drawer.classList.contains('open');
  drawer.classList.toggle('open', open);
  scrim.classList.toggle('show', open);
  drawer.inert = !open;
  drawer.setAttribute('aria-hidden', String(!open));
  menuBtn.setAttribute('aria-expanded', String(open));
  if (open) $('#closeBtn').focus();
  else if (was) menuBtn.focus();
}
menuBtn.addEventListener('click', () => setMenu(true));
$('#closeBtn').addEventListener('click', () => setMenu(false));
scrim.addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

/* Desktop top bar: search, bell, user name */
$('#deskSearch').addEventListener('submit', (e) => {
  e.preventDefault();
  query = $('#deskSearchInput').value;
  filter = 'all';
  $('#deskSearchInput').value = '';
  if (location.hash.split('/')[1] === 'announcements') route();
  else location.hash = '#/announcements';
});
$('#bellBtn').addEventListener('click', () => toast('You have no new notifications.'));

function renderUser() {
  const first = user ? (settings.name.trim().split(/\s+/)[0] || 'Student') : 'Student';
  $('#userLabel').textContent = first;
}

/* Clicks inside the current screen */
view.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action], [data-filter]');
  if (!el) return;

  if (el.dataset.filter) {
    filter = el.dataset.filter;
    $$('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === el)));
    renderNewsList();
    return;
  }

  switch (el.dataset.action) {
    case 'module-action':
      if (!user) {
        toast('Please log in first.');
        location.hash = '#/login';
      } else {
        toast(`${el.dataset.item}: request submitted (demo).`);
      }
      break;

    case 'reload-news':
      announcementsSeen = false;                       // shows Loading, then the list again
      if (location.hash === '#/announcements') route();
      else location.hash = '#/announcements';
      break;

    case 'clear-filters':
      filter = 'all';
      query = '';
      route();
      break;

    case 'toggle-password': {
      const input = el.closest('.input').querySelector('input');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      el.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      break;
    }

    case 'change-photo':
      $('#photoInput').click();
      break;

    case 'change-password':
      showConfirmPassword();
      break;

    case 'close-dialog':
      el.closest('dialog').close();
      break;

    case 'edit-profile': {
      const name = $('#fullName');
      const email = $('#email');
      const error = $('#profileError');
      const editing = !name.readOnly;

      if (!editing) {                       // switch to edit mode
        [name, email].forEach((i) => { i.readOnly = false; i.parentElement.classList.remove('readonly'); });
        name.focus();
        el.innerHTML = `${icon('check')} Save Profile`;
        return;
      }
      if (!name.value.trim()) { error.textContent = 'Please enter your full name.'; return; }
      if (!EMAIL_RE.test(email.value.trim())) { error.textContent = 'Please enter a valid email address.'; return; }
      error.textContent = '';
      settings.name = name.value.trim();
      settings.email = email.value.trim();
      store.set('settings', settings);
      [name, email].forEach((i) => { i.readOnly = true; i.parentElement.classList.add('readonly'); });
      el.innerHTML = `${icon('edit')} Edit Profile`;
      renderUser();
      showSuccess('Profile Updated Successfully');
      break;
    }
  }
});

/* Search box on the Announcements screen; typing clears a red error */
view.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'search') { query = t.value; renderNewsList(); }
  if (t.closest('.input.invalid')) setFieldError(t.id, '');
});

/* Switches, theme select and profile photo */
view.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.setting) {
    settings[t.dataset.setting] = t.type === 'checkbox' ? t.checked : t.value;
    store.set('settings', settings);
    if (t.dataset.setting === 'theme') applyTheme();
    toast('Preference saved.');
  }
  if (t.id === 'photoInput' && t.files[0]) {
    const url = URL.createObjectURL(t.files[0]);
    $('#avatar').innerHTML = `<img src="${url}" alt="Profile photo">`;
  }
});

/* Forms. Demo only: there is no server, so nothing is checked against real
   accounts, and passwords are never stored. */
const EMAIL_RE = /^\S+@\S+\.\S+$/;

function logIn(id) {
  user = { id };
  store.set('user', user);
  renderAuth();
}

view.addEventListener('submit', (e) => {
  const form = e.target;
  e.preventDefault();

  if (form.id === 'loginForm') {
    const id = $('#loginId').value.trim();
    const pw = $('#loginPw').value;
    const idError = !id ? 'Please enter your email or student ID.'
      : id.includes('@') ? (EMAIL_RE.test(id) ? '' : 'Please enter a valid email address.')
      : (/^[\w-]{3,}$/.test(id) ? '' : 'Please enter a valid student ID.');
    const pwError = !pw ? 'Enter your password.' : pw.length < 6 ? 'Enter your correct password.' : '';
    if (showErrors({ loginId: idError, loginPw: pwError })) return;
    logIn(id);
    toast('Welcome back!');
    location.hash = '#/home';
  }

  if (form.id === 'signupForm') {
    const name = $('#suName').value.trim();
    const email = $('#suEmail').value.trim();
    const pw = $('#suPw').value;
    if (showErrors({
      suName: name ? '' : 'Please enter your full name.',
      suEmail: EMAIL_RE.test(email) ? '' : 'Please enter a valid email address.',
      suPw: pw.length >= 6 ? '' : 'Password must be at least 6 characters.',
      suPw2: $('#suPw2').value === pw ? '' : 'Passwords do not match.',
    })) return;
    settings.name = name;
    settings.email = email;
    store.set('settings', settings);
    logIn(email);
    toast('Account created. Welcome!');
    location.hash = '#/home';
  }

  if (form.id === 'forgotForm') {
    const email = $('#fpEmail').value.trim();
    if (showErrors({ fpEmail: EMAIL_RE.test(email) ? '' : 'Please enter a valid email address.' })) return;
    toast(`Reset link sent to ${email} (demo).`);
    location.hash = '#/login';
  }

  if (form.id === 'pwForm') {
    const current = $('#pwCurrent').value;
    const next = $('#pwNew').value;
    if (showErrors({
      pwCurrent: current ? '' : 'Enter your current password.',
      pwNew: next.length < 6 ? 'New password must be at least 6 characters.'
        : next === current ? 'New password must be different from the current one.' : '',
      pwConfirm: $('#pwConfirm').value === next ? '' : 'Passwords do not match.',
    })) return;
    $('#pwDialog').close();
    showSuccess('Password Changed Successfully');
  }
});

/* Log in / Log out item in the phone menu and the desktop sidebar */
const authItems = $$('.drawer-links, .side-links').map((ul) => {
  const li = document.createElement('li');
  ul.append(li);
  return li;
});

function renderAuth() {
  const html = user
    ? `<a href="#/home" data-logout>${icon('arrow-left')}Log out</a>`
    : `<a href="#/login">${icon('user')}Log in</a>`;
  authItems.forEach((li) => { li.innerHTML = html; });
  renderUser();
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-logout]')) return;
  user = null;
  store.set('user', null);
  renderAuth();
  setMenu(false);
  toast('You have been logged out.');
});

/* Start */
$$('.logo img').forEach((img) => { if (images.logo) img.src = images.logo; else img.remove(); });
renderAuth();
applyTheme();
window.addEventListener('hashchange', route);
route();

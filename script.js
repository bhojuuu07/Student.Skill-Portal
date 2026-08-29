/* ============================================================
   Student Career & Skill Portal — shared client-side logic
   NOTE: Login/registration here are simulated in the browser
   (localStorage) for demo purposes only — there is no real
   server or database. Swap `Auth` for real API calls when you
   connect a backend.
   ============================================================ */

const Auth = {
  USERS_KEY: 'spc_users',
  SESSION_KEY: 'spc_session',

  getUsers() {
    return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
  },
  saveUsers(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },
  findByEmail(email) {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  register(user) {
    const users = this.getUsers();
    if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    users.push(user);
    this.saveUsers(users);
    return { ok: true };
  },
  login(email, password) {
    const user = this.findByEmail(email);
    if (!user) return { ok: false, error: 'No account found with that email.' };
    if (user.password !== password) return { ok: false, error: 'Incorrect password.' };
    localStorage.setItem(this.SESSION_KEY, email);
    return { ok: true, user };
  },
  logout() {
    localStorage.removeItem(this.SESSION_KEY);
  },
  currentUser() {
    const email = localStorage.getItem(this.SESSION_KEY);
    if (!email) return null;
    return this.findByEmail(email) || null;
  },
  generateStudentId() {
    const year = 2027;
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `CS-${year}-${rand}`;
  }
};

/* ---------- header: mobile menu + auth-aware links ---------- */
function initHeader() {
  const menuBtn = document.getElementById('menuBtn');
  const headerRight = document.getElementById('headerRight');
  if (menuBtn && headerRight) {
    menuBtn.addEventListener('click', () => {
      const isOpen = headerRight.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', isOpen);
    });
  }

  // Active nav link based on current page
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === path) link.classList.add('active');
  });

  // Auth-aware header area
  const authLinks = document.getElementById('authLinks');
  if (authLinks) {
    const user = Auth.currentUser();
    if (user) {
      authLinks.innerHTML = `
        <span class="user-chip">${user.name.split(' ')[0]} · ${user.studentId}
          <button id="logoutBtn" type="button">Sign out</button>
        </span>`;
      document.getElementById('logoutBtn').addEventListener('click', () => {
        Auth.logout();
        window.location.href = 'index.html';
      });
    } else {
      authLinks.innerHTML = `
        <a href="login.html" class="signin">Sign in</a>
        <a href="register.html" class="signup">Register</a>`;
    }
  }
}

/* ---------- login page ---------- */
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  const alertBox = document.getElementById('loginAlert');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const result = Auth.login(email, password);
    if (!result.ok) {
      alertBox.textContent = result.error;
      alertBox.classList.add('show', 'error');
      alertBox.classList.remove('success');
      return;
    }
    alertBox.textContent = `Welcome back, ${result.user.name.split(' ')[0]}. Redirecting…`;
    alertBox.classList.add('show', 'success');
    alertBox.classList.remove('error');
    setTimeout(() => { window.location.href = 'index.html'; }, 900);
  });
}

/* ---------- registration page ---------- */
function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;
  const alertBox = document.getElementById('registerAlert');
  const resultPanel = document.getElementById('resultPanel');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    alertBox.classList.remove('show');

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const course = document.getElementById('regCourse').value;
    const semester = document.getElementById('regSemester').value;
    const password = document.getElementById('regPassword').value;

    if (!name || !email || !course || !semester || password.length < 6) {
      alertBox.textContent = 'Please fill every field — password must be at least 6 characters.';
      alertBox.classList.add('show', 'error');
      alertBox.classList.remove('success');
      return;
    }

    const studentId = Auth.generateStudentId();
    const user = { name, email, course, semester, password, studentId, registeredOn: new Date().toISOString().slice(0, 10) };
    const result = Auth.register(user);

    if (!result.ok) {
      alertBox.textContent = result.error;
      alertBox.classList.add('show', 'error');
      alertBox.classList.remove('success');
      return;
    }

    // Populate the registration result panel
    document.getElementById('resStudentId').textContent = studentId;
    document.getElementById('resName').textContent = name;
    document.getElementById('resCourse').textContent = course;
    document.getElementById('resSemester').textContent = semester;
    document.getElementById('resDate').textContent = user.registeredOn;
    resultPanel.classList.add('show');
    form.reset();
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

/* ---------- syllabus accordion + search ---------- */
function initSyllabus() {
  const items = document.querySelectorAll('.syllabus-item');
  if (!items.length) return;

  items.forEach(item => {
    const toggle = item.querySelector('.syllabus-toggle');
    const body = item.querySelector('.syllabus-body');
    toggle.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      body.style.maxHeight = isOpen ? body.scrollHeight + 'px' : '0';
    });
  });

  const searchInput = document.getElementById('syllabusSearch');
  const emptyState = document.getElementById('syllabusEmpty');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      let anyVisible = false;

      items.forEach(item => {
        const rows = item.querySelectorAll('.subject-table tbody tr');
        let itemHasMatch = query === '';
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          const match = text.includes(query);
          row.hidden = query !== '' && !match;
          if (match) itemHasMatch = true;
        });
        item.hidden = !itemHasMatch;
        if (itemHasMatch) anyVisible = true;

        // Auto-expand items with matches while searching
        if (query !== '' && itemHasMatch) {
          item.classList.add('open');
          const body = item.querySelector('.syllabus-body');
          body.style.maxHeight = body.scrollHeight + 'px';
        } else if (query === '') {
          item.classList.remove('open');
          item.querySelector('.syllabus-body').style.maxHeight = '0';
        }
      });

      emptyState.classList.toggle('show', !anyVisible);
    });
  }
}

/* ---------- home page: skill bars + project filter (index.html only) ---------- */
function initHomeExtras() {
  const ledgerRows = document.querySelectorAll('.ledger-row');
  if (ledgerRows.length) {
    const skillObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fill = entry.target.querySelector('.ledger-fill');
          fill.style.width = entry.target.dataset.level + '%';
          skillObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    ledgerRows.forEach(row => skillObserver.observe(row));
  }

  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      projectCards.forEach(card => {
        card.hidden = !(filter === 'all' || card.dataset.category === filter);
      });
    });
  });

  const sections = document.querySelectorAll('section[id]');
  const navLinksScroll = document.querySelectorAll('.nav-link[href^="#"], .nav-link[href="index.html"]');
  if (sections.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinksScroll.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => navObserver.observe(s));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initLoginForm();
  initRegisterForm();
  initSyllabus();
  initHomeExtras();
});

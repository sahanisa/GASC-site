/* ==========================================================================
   GASC Idappadi Library · Client-Side Portal Logic & Bilingual Engine
   ========================================================================== */

// Current App State
const state = {
    currentUser: null,       // { id, regNo, email, name, type, department, ... }
    roleTab: 'student',      // 'student' or 'faculty'
    currentLang: 'en',       // 'en' or 'ta'
    currentTheme: 'dark',    // 'dark' or 'light'
    books: [],
    departments: [],
    searchQuery: '',
    selectedDept: 'ALL',
    selectedStatus: 'ALL',
    systemInfo: null,
    searchDebounceTimer: null
};

// Bilingual Translations Dictionary
const i18n = {
    en: {
        brandTitle: "GASC Idappadi Library",
        brandSubtitle: "Live Book Availability & Verification Gate 2.0",
        liveConnected: "Live Database Connected",
        navNoticeQr: "Notice Board QR",
        switchUser: "Switch User / Logout",
        
        // Auth Card
        authStudentTab: "Student (Reg No)",
        authFacultyTab: "Faculty (Email)",
        authStudentTitle: "Student Verification Gate",
        authFacultyTitle: "Faculty Verification Gate",
        authStudentDesc: "Enter your registered Student Register Number (e.g., C24UG183CSC001) to verify your account and search physical book stock.",
        authFacultyDesc: "Enter your registered Faculty Email Address (e.g., faculty@college.edu) to verify your account and check physical library stock.",
        lblRegNo: "Student Register Number",
        lblEmail: "Faculty Email Address",
        phRegNo: "e.g., C24UG183CSC001",
        phEmail: "e.g., faculty@college.edu",
        btnLogin: "Verify & Access Catalog",
        verifying: "Verifying with Library Database...",
        
        note1: "Real-time physical book shelf & borrow status",
        note2: "Restricted to verified students & faculty members only",
        note3: "Accessible from home or anywhere on college Wi-Fi",
        
        // Dashboard
        totalTitles: "Total Book Titles",
        availableNow: "Available on Shelf",
        currentlyBorrowed: "Currently Borrowed",
        myActiveLoans: "Your Active Loans",
        
        searchPlaceholder: "Search by Book Title, Accession No (e.g. CS001), Author, Subject...",
        allDepartments: "All Departments",
        allStatus: "All Availability",
        statusAvailableOnly: "🟢 Available on Shelf",
        statusBorrowedOnly: "🔴 Currently Borrowed",
        chipAll: "All Titles",
        chipAvailable: "🟢 Available in Library",
        chipBorrowed: "🔴 Currently Borrowed",
        chipMyLoans: "📚 My Borrowed Books",
        
        // Card Labels
        accNo: "Acc No:",
        dept: "Dept:",
        author: "Author:",
        edition: "Edition:",
        publisher: "Publisher:",
        statusAvailable: "Available in Library",
        statusAvailableHint: "Ready to borrow at Department Shelf",
        statusBorrowed: "Currently Borrowed",
        statusBorrowedHint: "Checked out · Expected Due Date:",
        
        // States
        searching: "Searching library collection...",
        noResults: "No books found matching your search.",
        noResultsHint: "Try adjusting keywords or selecting 'All Departments'.",
        
        // QR Modal
        qrModalTitle: "Notice Board QR Code",
        qrModalSubtitle: "Scan with mobile phone to open book availability portal",
        qrDirectUrl: "Direct Mobile URL:",
        btnPrintPoster: "Open Printable A4 Poster",
        btnDownloadQr: "Download QR PNG",
        btnClose: "Close"
    },
    ta: {
        brandTitle: "அரசுக் கலை & அறிவியல் கல்லூரி, எடப்பாடி",
        brandSubtitle: "நூலகப் புத்தக இருப்பு & சரிபார்ப்பு தளம் 2.0",
        liveConnected: "நேரலை தரவுத்தளம் இணைக்கப்பட்டுள்ளது",
        navNoticeQr: "அறிவிப்பு பலகை QR",
        switchUser: "வெளியேறு / பயனர் மாற்றம்",
        
        // Auth Card
        authStudentTab: "மாணவர் (பதிவு எண்)",
        authFacultyTab: "ஆசிரியர் (மின்னஞ்சல்)",
        authStudentTitle: "மாணவர் நுழைவு சரிபார்ப்பு",
        authFacultyTitle: "ஆசிரியர் நுழைவு சரிபார்ப்பு",
        authStudentDesc: "நூலகத்தில் புத்தகம் உள்ளதா என அறிய உங்கள் கல்லூரி பதிவு எண்ணை (உ.ம்: C24UG183CSC001) உள்ளிடவும்.",
        authFacultyDesc: "நூலகப் புத்தக இருப்பை அறிய உங்கள் பதிவு செய்யப்பட்ட மின்னஞ்சல் முகவரியை உள்ளிடவும்.",
        lblRegNo: "மாணவர் பதிவு எண் (Register Number)",
        lblEmail: "ஆசிரியர் மின்னஞ்சல் (Faculty Email)",
        phRegNo: "உ.ம்: C24UG183CSC001",
        phEmail: "உ.ம்: faculty@college.edu",
        btnLogin: "சரிபார்த்து பட்டியலைக் காண்க",
        verifying: "நூலகத் தரவுத்தளத்தில் சரிபார்க்கிறது...",
        
        note1: "புத்தகம் நூலக அலமாரியில் உள்ளதா என நேரலை தகவல்",
        note2: "கல்லூரி மாணவர்கள் மற்றும் ஆசிரியர்களுக்கு மட்டுமே அனுமதி",
        note3: "வீட்டிலிருந்தோ அல்லது கல்லூரி வளாகத்திலிருந்தோ அணுகலாம்",
        
        // Dashboard
        totalTitles: "மொத்த புத்தகங்கள்",
        availableNow: "நூலகத்தில் கிடைக்கும்",
        currentlyBorrowed: "இரவல் கொடுக்கப்பட்டது",
        myActiveLoans: "உங்கள் கடன் புத்தகங்கள்",
        
        searchPlaceholder: "புத்தக பெயர், அணுகல் எண் (Acc No: CS001), ஆசிரியர் பெயர்...",
        allDepartments: "அனைத்து துறைகள்",
        allStatus: "அனைத்து இருப்பு நிலை",
        statusAvailableOnly: "🟢 நூலகத்தில் உள்ளது",
        statusBorrowedOnly: "🔴 இரவலில் உள்ளது",
        chipAll: "அனைத்து புத்தகங்கள்",
        chipAvailable: "🟢 நூலகத்தில் உள்ளது",
        chipBorrowed: "🔴 இரவல் கொடுக்கப்பட்டது",
        chipMyLoans: "📚 எனது கடன் புத்தகங்கள்",
        
        // Card Labels
        accNo: "அணுகல் எண்:",
        dept: "துறை:",
        author: "ஆசிரியர்:",
        edition: "பதிப்பு:",
        publisher: "வெளியீடு:",
        statusAvailable: "நூலகத்தில் உள்ளது (கிடைக்கும்)",
        statusAvailableHint: "நூலக அலமாரியில் நேரடியாகப் பெறலாம்",
        statusBorrowed: "இரவல் கொடுக்கப்பட்டுள்ளது",
        statusBorrowedHint: "கடன் வாங்கப்பட்டுள்ளது · திரும்ப ஒப்படைக்க வேண்டிய நாள்:",
        
        // States
        searching: "புத்தகங்களைத் தேடுகிறது...",
        noResults: "உங்கள் தேடலுக்குரிய புத்தகங்கள் கிடைக்கவில்லை.",
        noResultsHint: "எழுத்துப்பிழைகளை சரிபார்க்கவும் அல்லது 'அனைத்து துறைகள்' தேர்வு செய்க.",
        
        // QR Modal
        qrModalTitle: "அறிவிப்பு பலகை QR குறியீடு",
        qrModalSubtitle: "மொபைல் மூலம் ஸ்கேன் செய்து புத்தக இருப்பை உடனுக்குடன் அறியலாம்",
        qrDirectUrl: "நேரடி இணைய முகவரி:",
        btnPrintPoster: "அறிவிப்பு பலகை A4 போஸ்டர் அச்சிடுக",
        btnDownloadQr: "QR படத்தைப் பதிவிறக்குக",
        btnClose: "மூடுக"
    }
};

// -------------------------------------------------------------
// Initialization
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 1. Restore Theme
    const savedTheme = localStorage.getItem('gasc_portal_theme') || 'dark';
    setTheme(savedTheme);

    // 2. Restore Language
    const savedLang = localStorage.getItem('gasc_portal_lang') || 'en';
    setLanguage(savedLang);

    // 3. Restore User Session
    const savedUser = sessionStorage.getItem('gasc_portal_user');
    if (savedUser) {
        try {
            state.currentUser = JSON.parse(savedUser);
            renderDashboardView();
        } catch (e) {
            sessionStorage.removeItem('gasc_portal_user');
            renderAuthView();
        }
    } else {
        renderAuthView();
    }

    // 4. Fetch System & QR Info
    fetchSystemInfo();
});

// -------------------------------------------------------------
// Language & Theme Handlers
// -------------------------------------------------------------
function setLanguage(lang) {
    state.currentLang = lang;
    localStorage.setItem('gasc_portal_lang', lang);
    document.documentElement.setAttribute('lang', lang);
    
    const label = document.getElementById('currentLangLabel');
    if (label) label.textContent = lang === 'en' ? 'தமிழ்' : 'English';

    applyTranslations();
    if (state.currentUser) {
        renderBookCards(state.books);
    }
}

function toggleLanguage() {
    setLanguage(state.currentLang === 'en' ? 'ta' : 'en');
}

function applyTranslations() {
    const t = i18n[state.currentLang];
    
    // Header
    safeSetText('brandTitleText', t.brandTitle);
    safeSetText('brandSubtitleText', t.brandSubtitle);
    safeSetText('liveStatusText', t.liveConnected);
    safeSetText('navNoticeQrText', t.navNoticeQr);
    safeSetText('btnLogoutText', t.switchUser);

    // Auth view
    safeSetText('txtStudentTab', t.authStudentTab);
    safeSetText('txtFacultyTab', t.authFacultyTab);
    updateAuthHeadings();
    
    safeSetText('txtNote1', t.note1);
    safeSetText('txtNote2', t.note2);
    safeSetText('txtNote3', t.note3);
    
    // Search & Filter Placeholders
    const searchInput = document.getElementById('catalogSearchInput');
    if (searchInput) searchInput.placeholder = t.searchPlaceholder;

    // Metrics labels
    safeSetText('lblMetricTotal', t.totalTitles);
    safeSetText('lblMetricAvail', t.availableNow);
    safeSetText('lblMetricBorrow', t.currentlyBorrowed);
    safeSetText('lblMetricMyBooks', t.myActiveLoans);

    // Quick chips
    safeSetText('chipAllText', t.chipAll);
    safeSetText('chipAvailText', t.chipAvailable);
    safeSetText('chipBorrowText', t.chipBorrowed);
    safeSetText('chipMyText', t.chipMyLoans);

    // QR Modal
    safeSetText('qrModalTitleText', t.qrModalTitle);
    safeSetText('qrModalSubtitleText', t.qrModalSubtitle);
    safeSetText('qrDirectUrlLabel', t.qrDirectUrl);
    safeSetText('btnPrintPosterText', t.btnPrintPoster);
    safeSetText('btnDownloadQrText', t.btnDownloadQr);
}

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el && text !== undefined) el.textContent = text;
}

function setTheme(theme) {
    state.currentTheme = theme;
    localStorage.setItem('gasc_portal_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    const icon = document.getElementById('themeToggleIcon');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function toggleTheme() {
    setTheme(state.currentTheme === 'dark' ? 'light' : 'dark');
}

// -------------------------------------------------------------
// Auth & Role Selector
// -------------------------------------------------------------
function switchRoleTab(role) {
    state.roleTab = role;
    
    const studentTab = document.getElementById('tabStudent');
    const facultyTab = document.getElementById('tabFaculty');
    const inputIcon = document.getElementById('authInputIcon');
    const input = document.getElementById('authIdentifierInput');
    const errorBox = document.getElementById('authErrorBox');

    if (errorBox) errorBox.classList.add('hidden');

    if (role === 'student') {
        studentTab.classList.add('active');
        facultyTab.classList.remove('active');
        if (inputIcon) inputIcon.className = 'fas fa-id-card input-icon';
        if (input) {
            input.placeholder = i18n[state.currentLang].phRegNo;
            input.type = 'text';
            input.className = 'text-input text-uppercase';
            input.value = '';
            input.focus();
        }
    } else {
        facultyTab.classList.add('active');
        studentTab.classList.remove('active');
        if (inputIcon) inputIcon.className = 'fas fa-envelope input-icon';
        if (input) {
            input.placeholder = i18n[state.currentLang].phEmail;
            input.type = 'email';
            input.className = 'text-input text-lowercase';
            input.value = '';
            input.focus();
        }
    }

    updateAuthHeadings();
}

function handleIdentifierInput(el) {
    if (!el) return;
    if (state.roleTab === 'student') {
        el.value = el.value.toUpperCase();
    } else {
        el.value = el.value.toLowerCase();
    }
}

function updateAuthHeadings() {
    const t = i18n[state.currentLang];
    if (state.roleTab === 'student') {
        safeSetText('authCardTitle', t.authStudentTitle);
        safeSetText('authCardSubtitle', t.authStudentDesc);
        safeSetText('authInputLabel', t.lblRegNo);
    } else {
        safeSetText('authCardTitle', t.authFacultyTitle);
        safeSetText('authCardSubtitle', t.authFacultyDesc);
        safeSetText('authInputLabel', t.lblEmail);
    }
}

async function handleAuthSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('authIdentifierInput');
    const errorBox = document.getElementById('authErrorBox');
    const submitBtn = document.getElementById('authSubmitBtn');
    const btnText = document.getElementById('authBtnText');
    const btnSpinner = document.getElementById('authBtnSpinner');

    const identifier = (input.value || '').trim();
    if (!identifier) return;

    // Reset error
    errorBox.classList.add('hidden');
    submitBtn.disabled = true;
    btnSpinner.classList.remove('hidden');
    btnText.textContent = i18n[state.currentLang].verifying;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, role: state.roleTab })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            state.currentUser = data.user;
            state.currentUser.userType = data.type; // 'student' or 'faculty'
            sessionStorage.setItem('gasc_portal_user', JSON.stringify(state.currentUser));
            
            renderDashboardView();
        } else {
            // User Not Found / Not Registered Error
            showAuthError(data);
        }
    } catch (err) {
        showAuthError({
            error: 'Failed to connect to Library database server. Please ensure the server is running.',
            errorTamil: 'நூலகத் தரவுத்தள சேவையகத்துடன் தொடர்பு கொள்ள முடியவில்லை. சேவையகம் இயங்குவதை உறுதிசெய்யவும்.'
        });
    } finally {
        submitBtn.disabled = false;
        btnSpinner.classList.add('hidden');
        btnText.textContent = i18n[state.currentLang].btnLogin;
    }
}

function showAuthError(data) {
    const errorBox = document.getElementById('authErrorBox');
    const errorTitle = document.getElementById('authErrorTitle');
    const errorDesc = document.getElementById('authErrorDesc');

    const isTamil = state.currentLang === 'ta';
    
    errorTitle.textContent = isTamil ? 'அனுமதி மறுக்கப்பட்டது / பதிவு செய்யப்படவில்லை' : 'Access Restricted · User Not Found';
    errorDesc.textContent = isTamil ? (data.errorTamil || data.error) : (data.error || 'User not recognized.');
    
    errorBox.classList.remove('hidden');
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function logoutUser() {
    sessionStorage.removeItem('gasc_portal_user');
    state.currentUser = null;
    state.books = [];
    renderAuthView();
}

// -------------------------------------------------------------
// View Switching
// -------------------------------------------------------------
function renderAuthView() {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('dashboardSection').classList.add('hidden');
    document.getElementById('navUserActions').classList.add('hidden');
    
    // Focus input
    setTimeout(() => {
        const input = document.getElementById('authIdentifierInput');
        if (input) input.focus();
    }, 100);
}

function renderDashboardView() {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    document.getElementById('navUserActions').classList.remove('hidden');

    // Populate User Profile Banner
    const u = state.currentUser;
    safeSetText('userDisplayName', u.name);
    safeSetText('userRoleBadge', u.userType === 'faculty' ? 'Faculty Member' : 'Student');
    
    const avatar = document.getElementById('userAvatarCircle');
    if (avatar) avatar.textContent = (u.name || 'U').charAt(0).toUpperCase();

    // Render Meta Tags
    const tagsContainer = document.getElementById('userMetaTags');
    if (tagsContainer) {
        tagsContainer.innerHTML = '';
        if (u.userType === 'student') {
            tagsContainer.innerHTML += `<span class="meta-chip"><i class="fas fa-id-badge"></i> ${u.regNo}</span>`;
            tagsContainer.innerHTML += `<span class="meta-chip"><i class="fas fa-graduation-cap"></i> ${u.departmentName || u.department}</span>`;
            if (u.yearLevel) tagsContainer.innerHTML += `<span class="meta-chip"><i class="fas fa-calendar-alt"></i> ${u.yearLevel}</span>`;
            if (u.bloodGroup) tagsContainer.innerHTML += `<span class="meta-chip"><i class="fas fa-tint"></i> ${u.bloodGroup}</span>`;
        } else {
            tagsContainer.innerHTML += `<span class="meta-chip"><i class="fas fa-envelope"></i> ${u.email}</span>`;
            if (u.phone) tagsContainer.innerHTML += `<span class="meta-chip"><i class="fas fa-phone"></i> ${u.phone}</span>`;
            tagsContainer.innerHTML += `<span class="meta-chip"><i class="fas fa-chalkboard-teacher"></i> ${u.department || 'Faculty'}</span>`;
        }
    }

    // Set Active Loan count
    safeSetText('metricMyBooksCount', u.activeBorrowingsCount || 0);

    // Fetch Departments and Books
    fetchDepartments();
    searchCatalog();
}

// -------------------------------------------------------------
// Catalog & Real-Time Availability Engine
// -------------------------------------------------------------
async function fetchDepartments() {
    try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        if (data.success && data.departments) {
            state.departments = data.departments;
            const select = document.getElementById('deptFilterSelect');
            if (select) {
                const current = select.value;
                select.innerHTML = `<option value="ALL">${i18n[state.currentLang].allDepartments}</option>`;
                data.departments.forEach(d => {
                    select.innerHTML += `<option value="${d}">${d}</option>`;
                });
                select.value = current || 'ALL';
            }
        }
    } catch (e) {
        console.warn('Departments fetch note:', e);
    }
}

async function searchCatalog() {
    const grid = document.getElementById('booksGridContainer');
    const loading = document.getElementById('catalogLoadingState');
    const empty = document.getElementById('catalogEmptyState');
    const resultsCount = document.getElementById('resultsCountDisplay');

    if (loading) loading.classList.remove('hidden');
    if (empty) empty.classList.add('hidden');
    if (grid) grid.innerHTML = '';

    const query = state.searchQuery || '';
    const dept = state.selectedDept || 'ALL';
    const status = state.selectedStatus || 'ALL';

    try {
        const params = new URLSearchParams({
            q: query,
            dept: dept,
            status: status
        });

        const res = await fetch(`/api/books/search?${params.toString()}`);
        const data = await res.json();

        if (res.ok && data.success) {
            state.books = data.books || [];

            // Update Summary Stats
            if (data.stats) {
                safeSetText('metricTotalCount', data.stats.totalBooks);
                safeSetText('metricAvailCount', data.stats.availableNow);
                safeSetText('metricBorrowCount', data.stats.borrowedNow);
            }

            if (resultsCount) {
                const count = state.books.length;
                resultsCount.textContent = `${count} ${count === 1 ? 'Book' : 'Books'} found`;
            }

            if (state.books.length === 0) {
                if (empty) empty.classList.remove('hidden');
            } else {
                renderBookCards(state.books);
            }
        }
    } catch (err) {
        console.error('Search error:', err);
    } finally {
        if (loading) loading.classList.add('hidden');
    }
}

function handleSearchInput(e) {
    clearTimeout(state.searchDebounceTimer);
    state.searchQuery = e.target.value.trim();
    state.searchDebounceTimer = setTimeout(() => {
        searchCatalog();
    }, 280);
}

function handleDeptFilterChange(e) {
    state.selectedDept = e.target.value;
    searchCatalog();
}

function setQuickFilter(status, btnElement) {
    state.selectedStatus = status;
    
    // Update active class on chips
    document.querySelectorAll('.chip-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    if (status === 'MY_LOANS') {
        showMyLoansSection();
    } else {
        searchCatalog();
    }
}

// -------------------------------------------------------------
// Render Book Cards with Real-Time Physical Availability (Grouped Copies)
// -------------------------------------------------------------
function renderBookCards(books) {
    const grid = document.getElementById('booksGridContainer');
    if (!grid) return;
    grid.innerHTML = '';

    const isTamil = state.currentLang === 'ta';
    const t = i18n[state.currentLang];

    books.forEach(b => {
        const card = document.createElement('div');
        card.className = 'book-card';

        // Render Accession Numbers Chips (if any)
        let accChipsHtml = '';
        if (b.copiesDetails && b.copiesDetails.length > 0) {
            const chips = b.copiesDetails.map(c => {
                if (c.isAvailable) {
                    return `<span class="accno-chip accno-chip-avail" title="Available on shelf"><i class="fas fa-check"></i> ${c.accNo}</span>`;
                } else {
                    const due = c.activeIssue ? ` (Due: ${c.activeIssue.dueDate})` : '';
                    return `<span class="accno-chip accno-chip-borrowed" title="Currently Borrowed${due}"><i class="fas fa-clock"></i> ${c.accNo}</span>`;
                }
            }).join('');
            accChipsHtml = `
                <div style="font-size:0.75rem;font-weight:700;color:var(--text-dim);margin-top:0.4rem;">
                    Accession Numbers (${b.copiesDetails.length}):
                </div>
                <div class="accno-chips-container">${chips}</div>
            `;
        } else if (b.accNos && b.accNos.length > 0) {
            const chips = b.accNos.map(a => `<span class="accno-chip accno-chip-avail">${a}</span>`).join('');
            accChipsHtml = `<div class="accno-chips-container">${chips}</div>`;
        }

        // Physical Status Badge (Green vs Red)
        let statusBadgeHtml = '';
        if (b.isAvailable) {
            statusBadgeHtml = `
                <div class="status-badge status-available">
                    <i class="fas fa-check-circle"></i>
                    <span>${isTamil ? b.statusTextTamil : b.statusText}</span>
                </div>
                <div class="status-detail-hint">
                    <i class="fas fa-map-marker-alt"></i> ${t.statusAvailableHint} (${b.dept})
                </div>
            `;
        } else {
            statusBadgeHtml = `
                <div class="status-badge status-borrowed">
                    <i class="fas fa-user-clock"></i>
                    <span>${isTamil ? b.statusTextTamil : b.statusText}</span>
                </div>
                <div class="status-detail-hint">
                    <i class="fas fa-calendar-times"></i> ${t.statusBorrowedHint}
                </div>
            `;
        }

        card.innerHTML = `
            <div>
                <div class="book-card-top">
                    <span class="book-dept-pill"><i class="fas fa-bookmark"></i> ${b.dept}</span>
                    <span class="book-qty-badge"><i class="fas fa-layer-group"></i> ${b.copies} ${b.copies === 1 ? 'Copy' : 'Copies'}</span>
                </div>
                <h3 class="book-title">${b.name}</h3>
                <div class="book-author">
                    <i class="fas fa-feather-alt"></i> ${b.author}
                </div>
                <div class="book-specs-row">
                    <span><i class="fas fa-book"></i> ${b.edition}</span>
                    <span><i class="fas fa-building"></i> ${b.publication}</span>
                </div>
                ${accChipsHtml}
            </div>

            <div class="availability-status-box">
                ${statusBadgeHtml}
            </div>
        `;

        grid.appendChild(card);
    });
}

// -------------------------------------------------------------
// My Borrowed Books Quick View
// -------------------------------------------------------------
async function showMyLoansSection() {
    if (!state.currentUser) return;
    const grid = document.getElementById('booksGridContainer');
    const loading = document.getElementById('catalogLoadingState');
    const empty = document.getElementById('catalogEmptyState');
    const resultsCount = document.getElementById('resultsCountDisplay');

    if (loading) loading.classList.remove('hidden');
    if (empty) empty.classList.add('hidden');
    if (grid) grid.innerHTML = '';

    try {
        const id = state.currentUser.userType === 'faculty' ? state.currentUser.email : state.currentUser.regNo;
        const res = await fetch(`/api/user/my-books?identifier=${encodeURIComponent(id)}&type=${state.currentUser.userType}`);
        const data = await res.json();

        if (res.ok && data.success) {
            const active = data.active || [];
            if (resultsCount) resultsCount.textContent = `${active.length} Book(s) Currently Issued to You`;

            if (active.length === 0) {
                if (empty) {
                    empty.classList.remove('hidden');
                    document.getElementById('emptyStateTitle').textContent = 'No Active Loans';
                    document.getElementById('emptyStateDesc').textContent = 'You currently have no borrowed books from the library.';
                }
            } else {
                active.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'book-card';
                    card.style.borderColor = 'var(--warning)';

                    card.innerHTML = `
                        <div>
                            <div class="book-card-top">
                                <span class="book-accno-pill"><i class="fas fa-barcode"></i> ${item.accNo || 'AccNo'}</span>
                                <span class="book-dept-pill" style="color:var(--warning)">My Loan</span>
                            </div>
                            <h3 class="book-title">${item.book || item.bookName || 'Library Book'}</h3>
                            <div class="book-specs-row" style="margin-top:0.75rem;">
                                <span><i class="fas fa-calendar-check"></i> Issued: ${item.issueDate || 'Recent'}</span>
                            </div>
                        </div>

                        <div class="availability-status-box">
                            <div class="status-badge" style="background:var(--warning-bg);color:var(--warning);border:1px solid rgba(245,158,11,0.3);">
                                <i class="fas fa-clock"></i> Return Due: ${item.dueDate || 'Return Soon'}
                            </div>
                            <div class="status-detail-hint">
                                <i class="fas fa-info-circle"></i> Please return to library before due date to avoid penalty.
                            </div>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            }
        }
    } catch (e) {
        console.error('My loans error:', e);
    } finally {
        if (loading) loading.classList.add('hidden');
    }
}

// -------------------------------------------------------------
// Notice Board QR Code Modal & System Info
// -------------------------------------------------------------
async function fetchSystemInfo() {
    try {
        const res = await fetch('/api/system/info');
        const data = await res.json();
        if (data.success) {
            state.systemInfo = data;
            const qrImg = document.getElementById('modalQrImage');
            const qrUrl = document.getElementById('modalPortalUrl');
            
            if (qrImg && data.qrDataUrl) qrImg.src = data.qrDataUrl;
            if (qrUrl && data.portalUrl) {
                qrUrl.textContent = data.portalUrl;
                qrUrl.href = data.portalUrl;
            }
        }
    } catch (e) {
        console.warn('System info note:', e);
    }
}

function openQrModal() {
    const modal = document.getElementById('qrModal');
    if (modal) modal.classList.add('active');
}

function closeQrModal() {
    const modal = document.getElementById('qrModal');
    if (modal) modal.classList.remove('active');
}

function downloadQrPng() {
    const link = document.createElement('a');
    link.href = '/api/system/qr.png';
    link.download = 'GASC-Library-NoticeBoard-QR.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
const QRCode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Supabase Cloud Live Database Support
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hgkshflogfaidwfugtxk.supabase.co';
const DEFAULT_SUPA_KEY = Buffer.from('c2Jfc2VjcmV0X21kcXVJOEI5UzhGSkwwc0ZpQmhmVFFfeVQ3eVRwOXU=', 'base64').toString('utf8');
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPA_KEY;

let supabaseClient = null;
try {
    if (SUPABASE_URL && SUPABASE_KEY) {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('☁️ [GASC-SITE] Supabase cloud connection configured:', SUPABASE_URL);
    }
} catch (e) {
    console.warn('⚠️ [GASC-SITE] Supabase notice:', e.message);
}

// -------------------------------------------------------------
// Live Database Locator & Cache Management
// -------------------------------------------------------------
function resolveDbPath() {
    // 1. Check APPDATA (where desktop app saves live data)
    if (process.env.APPDATA) {
        const appDataDb = path.join(process.env.APPDATA, 'library-smart-connect', 'library_data.json');
        if (fs.existsSync(appDataDb)) return appDataDb;
    }
    // 2. Check parent directory
    const parentDb = path.join(__dirname, '..', 'library_data.json');
    if (fs.existsSync(parentDb)) return parentDb;

    // 3. Check current folder
    const localDb = path.join(__dirname, 'library_data.json');
    if (fs.existsSync(localDb)) return localDb;

    return null;
}

let cachedDb = null;
let lastDbMtime = 0;
let dbPathFound = resolveDbPath();

function getLiveDatabaseData() {
    try {
        if (!dbPathFound || !fs.existsSync(dbPathFound)) {
            dbPathFound = resolveDbPath();
        }

        if (dbPathFound && fs.existsSync(dbPathFound)) {
            const stats = fs.statSync(dbPathFound);
            if (!cachedDb || stats.mtimeMs !== lastDbMtime) {
                const raw = fs.readFileSync(dbPathFound, 'utf8');
                cachedDb = JSON.parse(raw);
                lastDbMtime = stats.mtimeMs;
                console.log(`🔄 [GASC-SITE] Reloaded live database from: ${dbPathFound}`);
            }
            return cachedDb;
        }
    } catch (err) {
        console.error('⚠️ [GASC-SITE] Error reading local database:', err.message);
    }

    return {
        users: [],
        library_books: [],
        library_students: [],
        library_issues: [],
        library_returns: [],
        faculty_accounts: [],
        faculty_issues: [],
        faculty_returns: [],
        library_depts: []
    };
}

// Auto-Detect the Currently Active Admin Mail ID
function getActiveAdminEmail(localData) {
    if (process.env.ACTIVE_ADMIN_EMAIL) return process.env.ACTIVE_ADMIN_EMAIL.toLowerCase().trim();
    if (process.env.ADMIN_EMAIL) return process.env.ADMIN_EMAIL.toLowerCase().trim();
    
    // Pick the most recently logged-in / created admin from users array
    if (localData && Array.isArray(localData.users) && localData.users.length > 0) {
        const lastUser = localData.users[localData.users.length - 1];
        if (lastUser && lastUser.email) {
            return String(lastUser.email).toLowerCase().trim();
        }
    }
    
    if (process.env.SMTP_EMAIL) return process.env.SMTP_EMAIL.toLowerCase().trim();
    return 'gasclibrary24@gmail.com';
}

// Helper to query remote or local with active admin filter
async function getFullLibrarySnapshot() {
    const local = getLiveDatabaseData();
    const activeAdmin = getActiveAdminEmail(local);

    const filterByUser = (arr) => {
        if (!arr || !Array.isArray(arr)) return [];
        // If items have user_email, match active admin email. If no items match, return all available.
        const userMatched = arr.filter(item => (item.user_email || '').toLowerCase() === activeAdmin);
        return userMatched.length > 0 ? userMatched : arr;
    };

    let books = filterByUser(local.library_books);
    let issues = filterByUser(local.library_issues);
    let students = filterByUser(local.library_students);
    let faculty = filterByUser(local.faculty_accounts);
    let facultyIssues = filterByUser(local.faculty_issues);

    // If cloud client is available, merge cloud data
    if (supabaseClient) {
        try {
            const [bRes, iRes, sRes] = await Promise.all([
                supabaseClient.from('library_books').select('*').limit(1000),
                supabaseClient.from('library_issues').select('*').eq('returned', false),
                supabaseClient.from('library_students').select('*').limit(1000)
            ]);

            if (bRes.data && bRes.data.length > 0) {
                const cloudBooks = filterByUser(bRes.data).map(b => ({
                    id: b.id,
                    accNo: b.acc_no || b.accNo,
                    name: b.name,
                    author: b.author,
                    edition: b.edition,
                    dept: b.dept,
                    amount: b.amount,
                    publication: b.publication,
                    user_email: b.user_email
                }));
                const bMap = new Map();
                for (const b of books) {
                    const key = (b.accNo || `ID_${b.id}`).toUpperCase();
                    bMap.set(key, b);
                }
                for (const b of cloudBooks) {
                    const key = (b.accNo || `ID_${b.id}`).toUpperCase();
                    if (!bMap.has(key)) bMap.set(key, b);
                }
                books = Array.from(bMap.values());
            }

            if (iRes.data && iRes.data.length > 0) {
                const cloudIssues = filterByUser(iRes.data).map(i => ({
                    id: i.id,
                    accNo: i.acc_no || i.accNo,
                    regNo: i.reg || i.regNo,
                    name: i.name,
                    book: i.book,
                    issueDate: i.issue_date || i.issueDate,
                    dueDate: i.due_date || i.dueDate,
                    returned: !!i.returned,
                    returnDate: i.return_date || i.returnDate,
                    user_email: i.user_email
                }));
                const iMap = new Map();
                for (const i of issues) iMap.set(String(i.id), i);
                for (const i of cloudIssues) if (!iMap.has(String(i.id))) iMap.set(String(i.id), i);
                issues = Array.from(iMap.values());
            }

            if (sRes.data && sRes.data.length > 0) {
                const cloudStudents = filterByUser(sRes.data).map(s => ({
                    id: s.id,
                    regNo: s.reg_no || s.regNo,
                    name: s.name,
                    department: s.department,
                    departmentName: s.department_name || s.departmentName,
                    courseType: s.course_type || s.courseType,
                    yearLevel: s.year_level || s.yearLevel,
                    status: s.status,
                    bloodGroup: s.blood_group || s.bloodGroup,
                    user_email: s.user_email
                }));
                const sMap = new Map();
                for (const s of students) {
                    const key = (s.regNo || s.reg_no || '').toUpperCase();
                    if (key) sMap.set(key, s);
                }
                for (const s of cloudStudents) {
                    const key = (s.regNo || '').toUpperCase();
                    if (key && !sMap.has(key)) sMap.set(key, s);
                }
                students = Array.from(sMap.values());
            }
        } catch (cloudErr) {
            console.warn('☁️ Supabase live snapshot fallback notice:', cloudErr.message);
        }
    }

    return { activeAdmin, books, issues, students, faculty, facultyIssues, depts: local.library_depts || [] };
}

// -------------------------------------------------------------
// Network & QR Code Utility
// -------------------------------------------------------------
function getLocalNetworkIp() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & VERIFICATION GATE
// -------------------------------------------------------------
// Verifies registered Student RegNo (CAPSLOCK) or Faculty Email (lowercase).
// Strictly denies access if not found in database.
app.post('/api/auth/login', async (req, res) => {
    try {
        const { identifier, role = 'auto' } = req.body;
        const rawId = (identifier || '').trim();

        if (!rawId) {
            return res.status(400).json({
                success: false,
                error: 'Please enter your Student Register Number or Faculty Email / பதிவு எண் அல்லது மின்னஞ்சலை உள்ளிடவும்.'
            });
        }

        const snapshot = await getFullLibrarySnapshot();
        // Force uppercase for student RegNo and lowercase for faculty Email
        const upperId = rawId.toUpperCase();
        const lowerId = rawId.toLowerCase();
        const isEmailInput = rawId.includes('@');

        // Mode 1: Student check
        if (role === 'student' || (!isEmailInput && role !== 'faculty')) {
            const student = snapshot.students.find(s => {
                const r = (s.regNo || s.reg_no || '').toUpperCase().trim();
                return r === upperId;
            });

            if (student) {
                const regNo = (student.regNo || student.reg_no || upperId).toUpperCase();
                const activeIssues = snapshot.issues.filter(i => 
                    (i.regNo || i.reg || '').toUpperCase().trim() === regNo && !i.returned
                );

                return res.json({
                    success: true,
                    type: 'student',
                    user: {
                        id: student.id,
                        regNo: regNo,
                        name: student.name,
                        department: student.department || 'CSC',
                        departmentName: student.departmentName || `${student.department || 'CSC'} Department`,
                        courseType: student.courseType || 'UG',
                        yearLevel: student.yearLevel || 'Active Student',
                        bloodGroup: student.bloodGroup || '',
                        status: student.status || 'Active',
                        activeBorrowingsCount: activeIssues.length,
                        activeBorrowings: activeIssues
                    }
                });
            }

            if (role === 'student') {
                return res.status(404).json({
                    success: false,
                    code: 'STUDENT_NOT_FOUND',
                    error: `User not found! Register Number "${upperId}" is not registered in the college library system.`,
                    errorTamil: `பயனர் விவரம் காணப்படவில்லை! "${upperId}" என்ற பதிவு எண் கல்லூரி நூலகத்தில் பதிவு செய்யப்படவில்லை. நூலகரை அணுகவும்.`
                });
            }
        }

        // Mode 2: Faculty check
        if (role === 'faculty' || (isEmailInput && role !== 'student')) {
            const faculty = snapshot.faculty.find(f => {
                const email = (f.email || '').toLowerCase().trim();
                const phone = (f.phone || '').trim();
                return email === lowerId || phone === rawId;
            });

            if (faculty) {
                const activeFacIssues = (snapshot.facultyIssues || []).filter(i => 
                    (i.email || '').toLowerCase().trim() === lowerId && !i.returned
                );

                return res.json({
                    success: true,
                    type: 'faculty',
                    user: {
                        name: faculty.name,
                        email: lowerId,
                        phone: faculty.phone,
                        department: faculty.dept || 'College Faculty',
                        activeBorrowingsCount: activeFacIssues.length,
                        activeBorrowings: activeFacIssues
                    }
                });
            }

            if (role === 'faculty') {
                return res.status(404).json({
                    success: false,
                    code: 'FACULTY_NOT_FOUND',
                    error: `User not found! Faculty Email "${lowerId}" is not registered in the library system.`,
                    errorTamil: `பயனர் விவரம் காணப்படவில்லை! "${lowerId}" என்ற மின்னஞ்சல் நூலக ஆசிரியர் பட்டியலில் இல்லை. நூலகரை அணுகவும்.`
                });
            }
        }

        return res.status(404).json({
            success: false,
            code: 'NOT_REGISTERED',
            error: `User not found! The identifier "${rawId}" is not registered as a Student or Faculty member.`,
            errorTamil: `பயனர் விவரம் காணப்படவில்லை! "${rawId}" என்ற விபரம் மாணவர் அல்லது ஆசிரியர் பட்டியலில் பதிவு செய்யப்படவில்லை.`
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, error: 'Server authentication error: ' + err.message });
    }
});

// -------------------------------------------------------------
// 2. REAL-TIME PHYSICAL BOOK AVAILABILITY SEARCH (GROUPED COPIES)
// -------------------------------------------------------------
// Point 4: If Title, Author, Dept, Edition match, group into 1 book card with quantity
// and list of all Accession Numbers (CS001, CS002...) + live physical availability!
app.get('/api/books/search', async (req, res) => {
    try {
        const query = (req.query.q || req.query.query || '').trim().toLowerCase();
        const deptFilter = (req.query.dept || '').trim().toUpperCase();
        const availabilityFilter = (req.query.status || req.query.availability || '').trim().toUpperCase();

        const snapshot = await getFullLibrarySnapshot();
        const { books, issues, facultyIssues, activeAdmin } = snapshot;

        // Combine all active unreturned issues
        const allActiveIssues = [];
        for (const i of issues) {
            if (!i.returned) allActiveIssues.push({ ...i, borrowerType: 'Student' });
        }
        for (const f of facultyIssues) {
            if (!f.returned) allActiveIssues.push({ ...f, borrowerType: 'Faculty' });
        }

        // GROUP BOOKS BY METADATA: Name + Author + Dept + Edition
        const groupMap = new Map();

        for (const b of books) {
            const normName = (b.name || '').trim().toLowerCase();
            const normAuthor = (b.author || '').trim().toLowerCase();
            const normDept = (b.dept || 'CSC').trim().toUpperCase();
            const normEdition = (b.edition || '1st').trim().toLowerCase();
            const groupKey = `${normName}:::${normAuthor}:::${normDept}:::${normEdition}`;

            const acc = (b.accNo || '').toUpperCase().trim();

            // Check if this specific copy is currently issued
            let copyIsAvailable = true;
            let copyActiveIssue = null;
            if (acc) {
                const active = allActiveIssues.find(i => (i.accNo || i.acc_no || '').toUpperCase().trim() === acc);
                if (active) {
                    copyIsAvailable = false;
                    copyActiveIssue = {
                        borrowerType: active.borrowerType || 'Reader',
                        dueDate: active.dueDate || active.due_date || 'Due soon',
                        issueDate: active.issueDate || active.issue_date
                    };
                }
            }

            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, {
                    id: b.id,
                    name: b.name,
                    author: b.author || 'Author not specified',
                    edition: b.edition || 'Standard Edition',
                    dept: b.dept || 'CSC',
                    publication: b.publication || 'Standard Publisher',
                    copies: 0,
                    availableCopies: 0,
                    borrowedCopies: 0,
                    accNos: [],
                    copiesDetails: []
                });
            }

            const group = groupMap.get(groupKey);
            const copyCount = b.copies && !acc ? Math.max(1, b.copies) : 1;
            group.copies += copyCount;

            if (acc) {
                if (!group.accNos.includes(acc)) {
                    group.accNos.push(acc);
                    group.copiesDetails.push({
                        accNo: acc,
                        isAvailable: copyIsAvailable,
                        activeIssue: copyActiveIssue
                    });
                    if (copyIsAvailable) group.availableCopies++;
                    else group.borrowedCopies++;
                }
            } else {
                // Legacy / seed books with copies count but no individual accNo
                const matchedActive = allActiveIssues.filter(i => (i.book || '').toLowerCase().trim() === normName);
                group.borrowedCopies = matchedActive.length;
                group.availableCopies = Math.max(0, group.copies - group.borrowedCopies);
            }
        }

        // Convert grouped books into array with real-time status strings
        let groupedBooks = Array.from(groupMap.values()).map(g => {
            const isAvail = g.availableCopies > 0;
            return {
                ...g,
                isAvailable: isAvail,
                statusText: isAvail 
                    ? `${g.availableCopies} of ${g.copies} Copies Available in Library`
                    : 'All Copies Currently Borrowed',
                statusTextTamil: isAvail 
                    ? `${g.copies}-ல் ${g.availableCopies} பிரதிகள் நூலகத்தில் உள்ளன`
                    : 'அனைத்துப் பிரதிகளும் இரவல் கொடுக்கப்பட்டுள்ளன'
            };
        });

        // Filter by Department
        if (deptFilter && deptFilter !== 'ALL') {
            groupedBooks = groupedBooks.filter(b => (b.dept || '').toUpperCase() === deptFilter);
        }

        // Filter by Search Query (Name, Author, AccNos, Dept, Publisher)
        if (query) {
            groupedBooks = groupedBooks.filter(b => {
                const name = (b.name || '').toLowerCase();
                const author = (b.author || '').toLowerCase();
                const dept = (b.dept || '').toLowerCase();
                const pub = (b.publication || '').toLowerCase();
                const accMatch = b.accNos.some(a => a.toLowerCase().includes(query));
                return name.includes(query) || author.includes(query) || dept.includes(query) || pub.includes(query) || accMatch;
            });
        }

        // Filter by Availability (AVAILABLE / BORROWED)
        if (availabilityFilter === 'AVAILABLE') {
            groupedBooks = groupedBooks.filter(b => b.isAvailable);
        } else if (availabilityFilter === 'BORROWED') {
            groupedBooks = groupedBooks.filter(b => !b.isAvailable);
        }

        // Totals
        const totalTitles = groupedBooks.length;
        const totalPhysicalCopies = groupedBooks.reduce((sum, b) => sum + b.copies, 0);
        const totalAvailableCopies = groupedBooks.reduce((sum, b) => sum + b.availableCopies, 0);
        const totalBorrowedCopies = groupedBooks.reduce((sum, b) => sum + b.borrowedCopies, 0);

        res.json({
            success: true,
            activeAdminEmail: activeAdmin,
            totalFound: totalTitles,
            stats: {
                totalTitles: totalTitles,
                totalCopies: totalPhysicalCopies,
                availableNow: totalAvailableCopies,
                borrowedNow: totalBorrowedCopies
            },
            books: groupedBooks
        });

    } catch (err) {
        console.error('Book search error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// -------------------------------------------------------------
// 3. USER'S PERSONAL BORROWED BOOKS (MY BOOKS)
// -------------------------------------------------------------
app.get('/api/user/my-books', async (req, res) => {
    try {
        const { identifier, type } = req.query;
        if (!identifier) return res.status(400).json({ success: false, error: 'Identifier required' });

        const snapshot = await getFullLibrarySnapshot();
        const upperId = identifier.toUpperCase().trim();
        const lowerId = identifier.toLowerCase().trim();

        let active = [];
        let history = [];

        if (type === 'faculty' || identifier.includes('@')) {
            const facIssues = snapshot.facultyIssues || [];
            active = facIssues.filter(i => (i.email || '').toLowerCase().trim() === lowerId && !i.returned);
            history = facIssues.filter(i => (i.email || '').toLowerCase().trim() === lowerId && i.returned);
        } else {
            const localIssues = snapshot.issues || [];
            const localReturns = getLiveDatabaseData().library_returns || [];
            active = localIssues.filter(i => (i.regNo || i.reg || '').toUpperCase().trim() === upperId && !i.returned);
            history = localReturns.filter(r => (r.regNo || r.reg || '').toUpperCase().trim() === upperId);
        }

        res.json({ success: true, active, history });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// -------------------------------------------------------------
// 4. NOTICE BOARD & QR CODE DETAILS API
// -------------------------------------------------------------
app.get('/api/system/info', async (req, res) => {
    try {
        const ip = getLocalNetworkIp();
        const portalUrl = `http://${ip}:${PORT}`;
        const localhostUrl = `http://localhost:${PORT}`;

        const qrDataUrl = await QRCode.toDataURL(portalUrl, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 600,
            color: { dark: '#0f172a', light: '#ffffff' }
        });

        const snapshot = await getFullLibrarySnapshot();

        res.json({
            success: true,
            college: 'Government Arts & Science College, Idappadi',
            collegeTamil: 'அரசுக் கலை மற்றும் அறிவியல் கல்லூரி, எடப்பாடி',
            libraryName: 'GASC Library Smart Connect',
            port: PORT,
            lanIp: ip,
            portalUrl: portalUrl,
            localhostUrl: localhostUrl,
            qrDataUrl: qrDataUrl,
            activeAdminEmail: snapshot.activeAdmin,
            stats: {
                totalBooks: snapshot.books.length,
                totalStudents: snapshot.students.length,
                totalFaculty: snapshot.faculty.length
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Dynamic QR PNG
app.get('/api/system/qr.png', async (req, res) => {
    try {
        const customUrl = req.query.url;
        const ip = getLocalNetworkIp();
        const targetUrl = customUrl || `http://${ip}:${PORT}`;

        res.setHeader('Content-Type', 'image/png');
        await QRCode.toFileStream(res, targetUrl, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 800,
            color: { dark: '#0f172a', light: '#ffffff' }
        });
    } catch (err) {
        res.status(500).send('Error generating QR code: ' + err.message);
    }
});

// Departments list endpoint
app.get('/api/departments', async (req, res) => {
    try {
        const snapshot = await getFullLibrarySnapshot();
        const depts = new Set(['CSC', 'TAM', 'ENG', 'MAT', 'CHE', 'BOT', 'PHY', 'COM', 'BBA', 'MBA']);
        for (const b of snapshot.books) {
            if (b.dept) depts.add(b.dept.toUpperCase().trim());
        }
        res.json({ success: true, departments: Array.from(depts).sort() });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Poster route
app.get('/poster', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'poster.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', async () => {
    const ip = getLocalNetworkIp();
    console.log('================================================================');
    console.log('🏛️  GOVERNMENT ARTS & SCIENCE COLLEGE, IDAPPADI - LIBRARY PORTAL');
    console.log('📖  Live Physical Book Availability & Student/Faculty Gate 2.0');
    console.log('================================================================');
    console.log(`🌐 Localhost URL:      http://localhost:${PORT}`);
    console.log(`📱 Wi-Fi / LAN URL:    http://${ip}:${PORT}`);
    console.log(`🖨️  Print Notice Poster: http://${ip}:${PORT}/poster.html`);
    console.log('================================================================');

    try {
        const qrPath = path.join(__dirname, 'public', 'library-qr.png');
        await QRCode.toFile(qrPath, `http://${ip}:${PORT}`, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 800,
            color: { dark: '#0f172a', light: '#ffffff' }
        });
        console.log(`✅ [GASC-SITE] High-res Notice Board QR Code ready: ${qrPath}`);
    } catch (e) {
        console.warn('QR code auto-save note:', e.message);
    }
});

/* login/login.js — টেস্ট লগইন: Google, Facebook, Guest → দেশ/ভয়েস → MOI ID দেখানো */
console.log('[MOI] login.js loaded');

const views = { login: $('view-login'), profile: $('view-profile') };
const redirectOverlay = $('redirectOverlay');
let selectedVoice = '';
let currentProfile = null;

function showView(name){ Object.keys(views).forEach(k => views[k].classList.toggle('hidden', k !== name)); }
function showRedirect(on){ redirectOverlay.classList.toggle('show', on); }
function busy(btn, on, html){ if (on){ btn._h = btn.innerHTML; btn.innerHTML = btn.classList.contains('mini-btn') ? '<span class="loading"></span>' : '<span class="loading"></span><span>' + (html || 'Please wait…') + '</span>'; btn.disabled = true; } else { if (btn._h) btn.innerHTML = btn._h; btn.disabled = false; } }

/* Firebase এরর → সহজ বাংলা */
function errText(e){
    const c = (e && e.code) || '';
    const m = {
        'auth/popup-closed-by-user': 'লগইন বাতিল করা হয়েছে।',
        'auth/cancelled-popup-request': 'লগইন বাতিল করা হয়েছে।',
        'auth/popup-blocked': 'ব্রাউজার লগইন পপআপ আটকে দিয়েছে। পপআপ অনুমতি দিয়ে আবার চেষ্টা করুন।',
        'auth/account-exists-with-different-credential': 'এই ইমেইল দিয়ে আগে অন্য পদ্ধতিতে (যেমন Google) অ্যাকাউন্ট খোলা আছে। সেই পদ্ধতিতে লগইন করুন।',
        'auth/network-request-failed': 'ইন্টারনেট সংযোগ চেক করুন।',
        'auth/operation-not-allowed': 'এই লগইন পদ্ধতি Firebase Console-এ চালু করা নেই।',
        'auth/unauthorized-domain': 'এই ডোমেইন Firebase → Authentication → Settings → Authorized domains এ যোগ করুন।',
        'PERMISSION_DENIED': 'ডাটাবেজ রুল লেখা আটকে দিয়েছে। Realtime Database → Rules চেক করুন।'
    };
    if (/permission_denied/i.test(c + ' ' + ((e && e.message) || ''))) return m['PERMISSION_DENIED'];
    return m[c] || ('সমস্যা হয়েছে: ' + ((e && e.message) || c || 'অজানা'));
}

/* ✅ সফল: আইডি তৈরি হয়ে গেছে — এখন শুধু দেখাচ্ছি (হোমে যাচ্ছি না) */
function showSuccess(p){
    $('redirectWho').textContent = 'লগইন সফল! স্বাগতম, ' + (p.name || 'User');
    $('redirectCounter').textContent = 'MOI ID · ' + p.moiId;
    showRedirect(true);
}

/* লগইনের পর: গেস্ট না হলে দেশ/ভয়েস সেটআপ, তারপর ID */
async function afterLogin(p){
    if (!p){ alert('প্রোফাইল লোড হয়নি। আবার চেষ্টা করুন।'); return; }
    currentProfile = p;
    if (!p.profileComplete && p.role !== 'guest'){
        $('profileName').textContent = p.name || 'User';
        $('profileAvatar').innerHTML = '<img src="' + esc(p.photo || GUEST_AVATAR) + '" alt="" onerror="this.src=\'' + GUEST_AVATAR + '\'">';
        $('countrySelect').value = p.country || '';
        selectedVoice = p.voice || '';
        document.querySelectorAll('.voice-btn').forEach(b => b.classList.toggle('active', b.dataset.voice === selectedVoice));
        showView('profile'); return;
    }
    try { showSuccess(await MOIAuth.finish(p.uid)); }
    catch(e){ alert(errText(e)); }
}

/* বাটন রিপল */
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('pointermove', e => { const r = btn.getBoundingClientRect(); btn.style.setProperty('--mx', (e.clientX - r.left) + 'px'); btn.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
    btn.addEventListener('pointerdown', e => {
        const r = btn.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2, s = document.createElement('span');
        s.className = 'ripple'; s.style.width = s.style.height = d + 'px';
        s.style.left = (e.clientX - r.left - d / 2) + 'px'; s.style.top = (e.clientY - r.top - d / 2) + 'px';
        btn.appendChild(s); setTimeout(() => s.remove(), 760);
    });
});

document.querySelectorAll('.voice-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.voice-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); selectedVoice = btn.dataset.voice;
}));

/* ═══ Google ═══ */
$('googleBtn').addEventListener('click', async () => {
    const b = $('googleBtn'); busy(b, true, 'Connecting…');
    try { await afterLogin(await MOIAuth.google()); } catch(e){ alert(errText(e)); } finally { busy(b, false); }
});

/* ═══ Facebook ═══ */
$('facebookBtn').addEventListener('click', async () => {
    const b = $('facebookBtn'); busy(b, true, 'Connecting…');
    try { await afterLogin(await MOIAuth.facebook()); } catch(e){ alert(errText(e)); } finally { busy(b, false); }
});

/* ═══ Guest ═══ */
$('guestBtn').addEventListener('click', async () => {
    const b = $('guestBtn'); busy(b, true, 'Please wait…');
    try { await afterLogin(await MOIAuth.guest()); } catch(e){ alert(errText(e)); } finally { busy(b, false); }
});

/* ═══ প্রোফাইল সেটআপ সেভ → ID তৈরি ═══ */
$('saveProfileBtn').addEventListener('click', async () => {
    if (!currentProfile){ showView('login'); return; }
    const country = $('countrySelect').value;
    if (!country) return alert('অনুগ্রহ করে আপনার দেশ সিলেক্ট করুন।');
    if (!selectedVoice) return alert('অনুগ্রহ করে ভয়েস প্রেফারেন্স সিলেক্ট করুন।');
    const b = $('saveProfileBtn'); busy(b, true, 'Saving…');
    try { showSuccess(await MOIAuth.finish(currentProfile.uid, { country, voice: selectedVoice })); }
    catch(e){ alert(errText(e)); }
    finally { busy(b, false); }
});

/* টেস্টের জন্য লগআউট */
$('logoutBtn').addEventListener('click', async () => {
    try { await MOIAuth.signOut(); } catch(e){}
    currentProfile = null; showRedirect(false); showView('login');
});

/* আগে থেকেই লগইন থাকলে (পেজ খোলার সময়) */
(async () => {
    try { const p = await MOIAuth.current(); if (p) afterLogin(p); } catch(e){ console.warn(e); }
})();

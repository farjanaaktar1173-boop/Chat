/* login/login-auth.js — লগইন (Google / Facebook / Guest) + MOI ID তৈরি (Realtime Database) */
const MOIAuth = (() => {
    const A = () => window.MOI_AUTH;
    const D = () => window.MOI_RTDB;

    /* users/{uid} না থাকলে নতুন তৈরি */
    async function ensureProfile(user, provider){
        const ref = D().ref('users/' + user.uid);
        const snap = await ref.once('value');
        if (snap.exists()) return snap.val();
        const p = {
            uid: user.uid,
            name: user.displayName || 'Guest',
            photo: user.photoURL || '',
            provider: provider,
            role: user.isAnonymous ? 'guest' : 'user',
            profileComplete: false,
            moiId: null,
            createdAt: Date.now()
        };
        await ref.set(p);
        return p;
    }

    async function signIn(providerObj, name){
        const cred = await A().signInWithPopup(providerObj);
        return ensureProfile(cred.user, name);
    }

    /* ৬ সংখ্যার ইউনিক ID — moiIds/{id} = uid (একই ID দুজন পাবে না) */
    async function assignId(uid){
        let lastErr = null;
        for (let i = 0; i < 12; i++){
            const id = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
            try {
                await D().ref('moiIds/' + id).set(uid);
                await D().ref('users/' + uid).update({ moiId: id });
                return id;
            } catch(e){ lastErr = e; }
        }
        throw lastErr || new Error('ID বানানো যায়নি');
    }

    async function reload(uid){
        const s = await D().ref('users/' + uid).once('value');
        return s.val();
    }

    return {
        google()   { const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); return signIn(p, 'google'); },
        facebook() { return signIn(new firebase.auth.FacebookAuthProvider(), 'facebook'); },
        async guest(){ const cred = await A().signInAnonymously(); return ensureProfile(cred.user, 'guest'); },

        /* আগে থেকে লগইন থাকলে প্রোফাইল */
        async current(){
            return new Promise(res => {
                const off = A().onAuthStateChanged(async u => {
                    off();
                    if (!u) return res(null);
                    try { res(await ensureProfile(u, u.isAnonymous ? 'guest' : 'returning')); } catch(e){ res(null); }
                });
            });
        },

        /* দেশ/ভয়েস সেভ + ID না থাকলে তৈরি */
        async finish(uid, extra){
            if (extra) await D().ref('users/' + uid).update(Object.assign({}, extra, { profileComplete: true }));
            let p = await reload(uid);
            if (!p.moiId){ await assignId(uid); p = await reload(uid); }
            return p;
        },

        signOut(){ return A().signOut(); }
    };
})();
window.MOIAuth = MOIAuth;

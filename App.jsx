import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, X, Clock, CheckCircle2, AlertTriangle, ChevronRight, Building2, Trees, Lock, Unlock, Pencil, Trash2, Menu, LogOut } from 'lucide-react';

const SUPABASE_URL = 'https://qsacfjedmurhdwunxtpt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzYWNmamVkbXVyaGR3dW54dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTgyNTgsImV4cCI6MjA5Nzc3NDI1OH0.44lKM16WNhl0XwV4yb8rXlTQSqg82924p3uEqSxrnRc';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GOV_BLUE = '#005ea8';
const GOV_BLUE_DARK = '#003d73';
const GOV_BLUE_LIGHT = '#eaf2fa';
const GOV_TEXT = '#212529';
const GOV_GRAY = '#5b6770';
const GOV_BORDER = '#d4dbe1';

function StateEmblem({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="48" fill="#ffffff" />
      <g stroke={GOV_BLUE} strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d="M50 78 C 38 70, 32 58, 34 46 C 36 50, 40 52, 44 50" />
        <path d="M50 78 C 38 70, 32 58, 34 46 C 36 50, 40 52, 44 50" transform="scale(-1,1) translate(-100,0)" />
        <path d="M50 70 C 40 64, 36 54, 38 44 C 40 47, 43 49, 46 47" />
        <path d="M50 70 C 40 64, 36 54, 38 44 C 40 47, 43 49, 46 47" transform="scale(-1,1) translate(-100,0)" />
      </g>
      <rect x="44" y="22" width="12" height="36" fill={GOV_BLUE} />
      <rect x="32" y="34" width="36" height="12" fill={GOV_BLUE} />
    </svg>
  );
}

export default function EKXARegistry() {
  const [view, setView] = useState('search');
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [toast, setToast] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [form, setForm] = useState(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const isOfficer = !!session;

  function emptyForm() {
    return { ownerName: '', parcelId: '', address: '', region: '', propertyType: 'land', sizeDescription: '', boundaries: '' };
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { loadRecords(); }, []);

  async function loadRecords() {
    setLoading(true);
    const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
    setRecords(!error && data ? data : []);
    setLoading(false);
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3600);
  }

  function genParcelId(region) {
    const r = (region || 'GR').slice(0, 2).toUpperCase();
    const num = Math.floor(100000 + Math.random() * 899999);
    return `${r}-${num}`;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthSubmitting(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPassword });
    if (error) {
      setAuthError('Λανθασμένα στοιχεία σύνδεσης — Incorrect email or password.');
    } else {
      setShowAuthModal(false);
      setLoginEmail('');
      setLoginPassword('');
      showToast('Πρόσβαση υπαλλήλου εγκρίθηκε — Officer access granted.');
    }
    setAuthSubmitting(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    showToast('Η πρόσβαση υπαλλήλου έληξε — Officer access ended.');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isOfficer) return;
    if (!form.ownerName.trim() || !form.address.trim() || !form.region.trim()) {
      showToast('Συμπληρώστε όλα τα απαιτούμενα πεδία.', 'error');
      return;
    }
    setSubmitting(true);
    const isEdit = !!editingRecord;
    const parcelId = isEdit ? editingRecord.parcel_id : (form.parcelId.trim() || genParcelId(form.region));

    const record = {
      parcel_id: parcelId,
      owner_name: form.ownerName.trim(),
      address: form.address.trim(),
      region: form.region.trim(),
      property_type: form.propertyType,
      size_description: form.sizeDescription.trim() || null,
      boundaries: form.boundaries.trim() || null,
      status: isEdit ? editingRecord.status : 'pending',
      notice_ends_at: isEdit ? editingRecord.notice_ends_at : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      last_edited_at: isEdit ? new Date().toISOString() : null,
    };

    let error;
    if (isEdit) {
      const res = await supabase.from('properties').update(record).eq('parcel_id', parcelId);
      error = res.error;
    } else {
      const res = await supabase.from('properties').insert(record);
      error = res.error;
    }

    if (error) {
      showToast(error.message.includes('duplicate') ? 'Αυτό το Αρ. Οικοπέδου υπάρχει ήδη.' : 'Παρουσιάστηκε σφάλμα.', 'error');
    } else {
      await loadRecords();
      showToast(isEdit ? `Το οικόπεδο ${parcelId} ενημερώθηκε.` : `Καταχωρήθηκε — Parcel ${parcelId} is now in the 7-day public notice period.`);
      setForm(emptyForm());
      setEditingRecord(null);
      setView('search');
    }
    setSubmitting(false);
  }

  async function handleDelete(record) {
    if (!isOfficer) return;
    const { error } = await supabase.from('properties').delete().eq('parcel_id', record.parcel_id);
    if (error) {
      showToast('Δεν ήταν δυνατή η αφαίρεση.', 'error');
    } else {
      await loadRecords();
      setSelectedRecord(null);
      showToast(`Το οικόπεδο ${record.parcel_id} αφαιρέθηκε.`);
    }
  }

  function startEdit(record) {
    if (!isOfficer) return;
    setForm({
      ownerName: record.owner_name, parcelId: record.parcel_id, address: record.address,
      region: record.region, propertyType: record.property_type,
      sizeDescription: record.size_description || '', boundaries: record.boundaries || '',
    });
    setEditingRecord(record);
    setSelectedRecord(null);
    setView('register');
  }

  function isNoticeExpired(record) { return new Date() > new Date(record.notice_ends_at); }
  function effectiveStatus(record) {
    if (record.status === 'pending' && isNoticeExpired(record)) return 'confirmed';
    return record.status;
  }

  const filtered = records.filter(r => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return r.parcel_id.toLowerCase().includes(q) || r.address.toLowerCase().includes(q) ||
           r.owner_name.toLowerCase().includes(q) || r.region.toLowerCase().includes(q);
  });

  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f8', fontFamily: "'Open Sans', Arial, sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&family=Roboto+Slab:wght@600;700&family=Roboto+Mono:wght@500&display=swap" />

      <div style={{ background: GOV_BLUE_DARK, color: '#cfe0f0', fontSize: 12, padding: '5px 0' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          <span>ΕΛΛΗΝΙΚΗ ΔΗΜΟΚΡΑΤΙΑ · HELLENIC REPUBLIC</span>
          <span style={{ opacity: 0.85 }}>{todayStr}</span>
        </div>
      </div>

      <header style={{ background: GOV_BLUE }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <StateEmblem size={44} />
            <div>
              <div style={{ color: '#fff', fontFamily: "'Roboto Slab', serif", fontWeight: 700, fontSize: 19, letterSpacing: 0.1, lineHeight: 1.2 }}>ΕΘΝΙΚΟ ΚΤΗΜΑΤΟΛΟΓΙΟ</div>
              <div style={{ color: '#cfe0f0', fontSize: 12, letterSpacing: 0.8, marginTop: 2, fontWeight: 500 }}>ΕΚΧΑ — NATIONAL CADASTRE &amp; MAPPING AGENCY</div>
            </div>
          </div>

          <div style={{ display: 'none', alignItems: 'center', gap: 8 }} className="ekxa-nav-desktop">
            <NavBtn active={view === 'search'} onClick={() => { setView('search'); setEditingRecord(null); }} label="Αναζήτηση Μητρώου" sub="Search Registry" />
            {isOfficer && <NavBtn active={view === 'register'} onClick={() => { setForm(emptyForm()); setEditingRecord(null); setView('register'); }} label="Καταχώριση Ακινήτου" sub="Register Property" />}
            <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.3)', margin: '0 6px' }} />
            {!authLoading && (
              isOfficer ? (
                <button onClick={handleLogout} style={pillBtnStyle()}><LogOut size={14} /> Αποσύνδεση</button>
              ) : (
                <button onClick={() => setShowAuthModal(true)} style={pillBtnStyle()}><Lock size={14} /> Είσοδος Υπαλλήλου</button>
              )
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="ekxa-burger" style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, padding: 9, cursor: 'pointer' }}>
            <Menu size={20} color="#fff" />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="ekxa-mobile-menu" style={{ background: GOV_BLUE_DARK, padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <NavBtn active={view === 'search'} onClick={() => { setView('search'); setEditingRecord(null); setMobileMenuOpen(false); }} label="Αναζήτηση Μητρώου" sub="Search Registry" full />
            {isOfficer && <NavBtn active={view === 'register'} onClick={() => { setForm(emptyForm()); setEditingRecord(null); setView('register'); setMobileMenuOpen(false); }} label="Καταχώριση Ακινήτου" sub="Register Property" full />}
            {!authLoading && (
              isOfficer ? (
                <button onClick={handleLogout} style={{ ...pillBtnStyle(), width: '100%', justifyContent: 'center' }}><LogOut size={14} /> Αποσύνδεση</button>
              ) : (
                <button onClick={() => setShowAuthModal(true)} style={{ ...pillBtnStyle(), width: '100%', justifyContent: 'center' }}><Lock size={14} /> Είσοδος Υπαλλήλου</button>
              )
            )}
          </div>
        )}
      </header>

      <div style={{ background: '#fff', borderBottom: `1px solid ${GOV_BORDER}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '10px 20px', fontSize: 12.5, color: GOV_GRAY, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>Αρχική</span><ChevronRight size={11} /><span>Υπουργείο Ψηφιακής Διακυβέρνησης</span><ChevronRight size={11} /><span style={{ color: GOV_BLUE, fontWeight: 700 }}>Εθνικό Κτηματολόγιο</span>
        </div>
      </div>

      {!isOfficer && !authLoading && (
        <div style={{ background: '#fff4ce', borderBottom: '1px solid #f0dca0', padding: '9px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: '#6b5a1d', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
            <Lock size={13} /> Δημόσια προβολή μόνο για ανάγνωση. Only ΕΚΧΑ officers may add, edit, or remove entries.
          </span>
        </div>
      )}

      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,30,60,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 4, maxWidth: 400, width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
            <div style={{ background: GOV_BLUE, padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Unlock size={18} color="#fff" />
                <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', fontFamily: "'Roboto Slab', serif" }}>Σύνδεση Υπαλλήλου</div>
              </div>
              <button onClick={() => { setShowAuthModal(false); setAuthError(''); setLoginEmail(''); setLoginPassword(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cfe0f0' }}><X size={20} /></button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontSize: 13.5, color: GOV_GRAY, marginBottom: 18, lineHeight: 1.55 }}>
                Συνδεθείτε με τα στοιχεία υπαλλήλου ΕΚΧΑ.<br /><span style={{ color: '#8a95a3' }}>Sign in with your ΕΚΧΑ officer credentials.</span>
              </p>
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 12 }}>
                  <input type="email" autoFocus required value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setAuthError(''); }} placeholder="Email"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 4, border: `1.5px solid ${GOV_BORDER}`, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <input type="password" required value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); setAuthError(''); }} placeholder="Κωδικός / Password"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 4, border: authError ? '1.5px solid #b23b3b' : `1.5px solid ${GOV_BORDER}`, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                {authError && <div style={{ fontSize: 12.5, color: '#b23b3b', marginBottom: 10 }}>{authError}</div>}
                <button type="submit" disabled={authSubmitting} style={{ width: '100%', background: authSubmitting ? '#9aa7bd' : GOV_BLUE, color: '#fff', border: 'none', padding: '12px', borderRadius: 4, fontSize: 14.5, fontWeight: 700, cursor: authSubmitting ? 'default' : 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
                  {authSubmitting ? 'Σύνδεση…' : 'Σύνδεση'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 50, background: toast.type === 'error' ? '#7a2424' : '#1e5631', color: '#fff', padding: '14px 18px', borderRadius: 4, maxWidth: 380, fontSize: 14, lineHeight: 1.45, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', gap: 10, alignItems: 'flex-start', borderLeft: '4px solid ' + (toast.type === 'error' ? '#c9595b' : '#7fc494') }}>
          {toast.type === 'error' ? <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />}
          <span>{toast.msg}</span>
        </div>
      )}

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '32px 20px 64px' }}>
        {view === 'search' && !selectedRecord && (
          <SearchView query={query} setQuery={setQuery} filtered={filtered} loading={loading} onOpen={(r) => setSelectedRecord(r)} effectiveStatus={effectiveStatus}
            onGoRegister={() => { setForm(emptyForm()); setEditingRecord(null); setView('register'); }} isOfficer={isOfficer} totalCount={records.length} />
        )}
        {selectedRecord && (
          <RecordDetail record={selectedRecord} status={effectiveStatus(selectedRecord)} onBack={() => setSelectedRecord(null)} isOfficer={isOfficer}
            onEdit={() => startEdit(selectedRecord)} onDelete={() => handleDelete(selectedRecord)} />
        )}
        {view === 'register' && isOfficer && (
          <RegisterView form={form} setForm={setForm} onSubmit={handleSubmit} submitting={submitting} editingRecord={editingRecord} />
        )}
        {view === 'register' && !isOfficer && (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: '#fff', border: `1px solid ${GOV_BORDER}` }}>
            <Lock size={28} color={GOV_BLUE} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: GOV_BLUE_DARK }}>Απαιτείται πρόσβαση υπαλλήλου</div>
            <div style={{ fontSize: 14, color: GOV_GRAY, marginTop: 6 }}>Officer access required.</div>
          </div>
        )}
      </main>

      <footer style={{ background: GOV_BLUE_DARK, padding: '28px 20px', marginTop: 20 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StateEmblem size={28} />
            <div style={{ fontSize: 12, color: '#a8c0d8', lineHeight: 1.5 }}>ΕΚΧΑ — Εθνικό Κτηματολόγιο &amp; Χαρτογράφηση<br />Συσταθέν με το Προεδρικό Διάταγμα PD-ΕΚΧΑ-2026-001</div>
          </div>
          <div style={{ fontSize: 11.5, color: '#7d9bb8', textAlign: 'right' }}>© Ελληνική Δημοκρατία<br />Υπουργείο Ψηφιακής Διακυβέρνησης</div>
        </div>
      </footer>

      <style>{`@media (min-width: 860px) { .ekxa-nav-desktop { display: flex !important; } .ekxa-burger { display: none !important; } .ekxa-mobile-menu { display: none !important; } }`}</style>
    </div>
  );
}

function pillBtnStyle() { return { display: 'flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }; }

function NavBtn({ active, onClick, label, sub, full }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: full ? 'flex-start' : 'center', gap: 1, padding: '8px 16px', borderRadius: 4, border: 'none', cursor: 'pointer', background: active ? '#fff' : 'rgba(255,255,255,0.12)', color: active ? GOV_BLUE : '#fff', fontFamily: 'inherit', width: full ? '100%' : 'auto', textAlign: full ? 'left' : 'center' }}>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 10.5, opacity: 0.85, fontWeight: 500 }}>{sub}</span>
    </button>
  );
}

function StatusPill({ status }) {
  const map = {
    pending: { bg: '#fff4ce', text: '#6b5a1d', label: 'Δημόσια Προειδοποίηση', sub: 'Public notice', icon: <Clock size={13} /> },
    confirmed: { bg: '#e1f0e6', text: '#1e5631', label: 'Επιβεβαιωμένη Ιδιοκτησία', sub: 'Confirmed', icon: <CheckCircle2 size={13} /> },
    disputed: { bg: '#f9e3e1', text: '#7a2424', label: 'Υπό Αμφισβήτηση', sub: 'Disputed', icon: <AlertTriangle size={13} /> },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', background: s.bg, color: s.text, borderRadius: 4, padding: '5px 11px', borderLeft: `3px solid ${s.text}` }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}>{s.icon} {s.label}</span>
      <span style={{ fontSize: 10, opacity: 0.8 }}>{s.sub}</span>
    </span>
  );
}

function SearchView({ query, setQuery, filtered, loading, onOpen, effectiveStatus, onGoRegister, isOfficer, totalCount }) {
  return (
    <div>
      <div style={{ background: '#fff', border: `1px solid ${GOV_BORDER}`, borderTop: `4px solid ${GOV_BLUE}`, padding: '26px 28px', marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Roboto Slab', serif", fontSize: 24, fontWeight: 700, color: GOV_BLUE_DARK, margin: 0, letterSpacing: -0.2 }}>Αναζήτηση Μητρώου Ακινήτων</h1>
        <p style={{ color: GOV_GRAY, fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>Search by parcel ID, address, owner name, or region.</p>
        <span style={{ fontSize: 11.5, color: '#8a95a3', background: '#f3f5f7', padding: '3px 9px', borderRadius: 3 }}>{totalCount} εγγραφή/ές στο μητρώο</span>
      </div>

      <div style={{ position: 'relative', marginBottom: 22 }}>
        <Search size={17} color="#8a95a3" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="π.χ. Πλάκα, Αθήνα — ή AT-204819"
          style={{ width: '100%', padding: '13px 14px 13px 42px', borderRadius: 4, border: `1.5px solid ${GOV_BORDER}`, fontSize: 15, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
      </div>

      {loading ? (
        <div style={{ color: '#8a95a3', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>Φόρτωση μητρώου…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '52px 24px', background: '#fff', border: `1px solid ${GOV_BORDER}` }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: GOV_BLUE_DARK, marginBottom: 6 }}>{query ? 'Δεν βρέθηκαν αποτελέσματα' : 'Δεν υπάρχουν ακόμη καταχωρίσεις'}</div>
          {isOfficer && !query && <button onClick={onGoRegister} style={{ background: GOV_BLUE, color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 4, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Καταχώριση Ακινήτου</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: `1px solid ${GOV_BORDER}`, background: GOV_BORDER }}>
          {filtered.map((r) => (
            <button key={r.parcel_id} onClick={() => onOpen(r)} style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', background: '#fff', border: 'none', padding: '15px 18px', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
              <div style={{ width: 34, height: 34, borderRadius: 4, background: GOV_BLUE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {r.property_type === 'building' ? <Building2 size={16} color={GOV_BLUE} /> : <Trees size={16} color={GOV_BLUE} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: GOV_BLUE_DARK }}>{r.address}</div>
                <div style={{ fontSize: 12.5, color: '#8a95a3', marginTop: 2, fontFamily: "'Roboto Mono', monospace" }}>{r.parcel_id} · {r.region}</div>
              </div>
              <StatusPill status={effectiveStatus(r)} />
              <ChevronRight size={17} color="#c2c9d1" style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RecordDetail({ record, status, onBack, isOfficer, onEdit, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const fields = [
    ['Ιδιοκτήτης / Owner', record.owner_name], ['Διεύθυνση / Address', record.address], ['Περιφέρεια / Region', record.region],
    ['Τύπος / Type', record.property_type === 'building' ? 'Κτίριο' : 'Γη'], ['Περιγραφή', record.size_description || '—'], ['Όρια', record.boundaries || '—'],
  ];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: GOV_BLUE, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>← Επιστροφή</button>
        {isOfficer && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `1.5px solid ${GOV_BLUE}`, color: GOV_BLUE, padding: '7px 13px', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}><Pencil size={13} /> Επεξεργασία</button>
            {!confirmingDelete ? (
              <button onClick={() => setConfirmingDelete(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid #b23b3b', color: '#b23b3b', padding: '7px 13px', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}><Trash2 size={13} /> Αφαίρεση</button>
            ) : (
              <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#b23b3b', border: '1.5px solid #b23b3b', color: '#fff', padding: '7px 13px', borderRadius: 4, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}><Trash2 size={13} /> Επιβεβαίωση</button>
            )}
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${GOV_BORDER}` }}>
        <div style={{ background: GOV_BLUE, padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontFamily: "'Roboto Mono', monospace", color: '#cfe0f0', fontSize: 12.5, letterSpacing: 1, marginBottom: 6 }}>ΑΡ. ΟΙΚΟΠΕΔΟΥ {record.parcel_id}</div>
            <div style={{ color: '#fff', fontSize: 19, fontWeight: 700, fontFamily: "'Roboto Slab', serif" }}>{record.address}</div>
          </div>
          <StatusPill status={status} />
        </div>
        <div style={{ padding: '26px 28px' }}>
          {status === 'pending' && (
            <div style={{ background: '#fff4ce', borderLeft: '3px solid #c9a23b', padding: '12px 16px', marginBottom: 22, fontSize: 13, color: '#6b5a1d', display: 'flex', gap: 10 }}>
              <Clock size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span>Στην 7-ήμερη περίοδο δημόσιας προειδοποίησης, λήγει {new Date(record.notice_ends_at).toLocaleDateString('en-GB')}.</span>
            </div>
          )}
          {status === 'confirmed' && (
            <div style={{ background: '#e1f0e6', borderLeft: '3px solid #1e5631', padding: '12px 16px', marginBottom: 22, fontSize: 13, color: '#1e5631', display: 'flex', gap: 10 }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} /><span>Επιβεβαιωμένη εγγραφή στο εθνικό κτηματολόγιο.</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px 30px' }}>
            {fields.map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: '#8a95a3', letterSpacing: 0.4, marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 14.5, color: GOV_TEXT, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${GOV_BLUE_LIGHT}`, fontSize: 12, color: '#8a95a3' }}>
            Καταχωρήθηκε {new Date(record.created_at).toLocaleDateString('en-GB')}{record.last_edited_at && ` · Επεξεργάστηκε ${new Date(record.last_edited_at).toLocaleDateString('en-GB')}`}
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterView({ form, setForm, onSubmit, submitting, editingRecord }) {
  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  const inputStyle = { width: '100%', padding: '11px 13px', borderRadius: 4, border: `1.5px solid ${GOV_BORDER}`, fontSize: 14.5, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' };
  const labelStyle = { fontSize: 12.5, fontWeight: 700, color: GOV_BLUE_DARK, marginBottom: 6, display: 'block' };

  return (
    <div>
      <div style={{ background: '#fff', border: `1px solid ${GOV_BORDER}`, borderTop: `4px solid ${GOV_BLUE}`, padding: '26px 28px', marginBottom: 4 }}>
        <h1 style={{ fontFamily: "'Roboto Slab', serif", fontSize: 23, fontWeight: 700, color: GOV_BLUE_DARK, margin: 0 }}>{editingRecord ? `Επεξεργασία ${editingRecord.parcel_id}` : 'Καταχώριση Ακινήτου'}</h1>
      </div>
      <form onSubmit={onSubmit} style={{ background: '#fff', border: `1px solid ${GOV_BORDER}`, borderTop: 'none', padding: '24px 28px 8px' }}>
        <div style={{ marginBottom: 18 }}><label style={labelStyle}>Ονοματεπώνυμο Ιδιοκτήτη</label><input style={inputStyle} value={form.ownerName} onChange={(e) => update('ownerName', e.target.value)} placeholder="e.g. Δημήτρης Παπαδόπουλος" /></div>
        <div style={{ marginBottom: 18 }}><label style={labelStyle}>Διεύθυνση Ακινήτου</label><input style={inputStyle} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="e.g. Αδριανού 14, Πλάκα" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
          <div><label style={labelStyle}>Περιφέρεια</label><input style={inputStyle} value={form.region} onChange={(e) => update('region', e.target.value)} placeholder="e.g. Αττική" /></div>
          <div><label style={labelStyle}>Τύπος Ακινήτου</label>
            <select style={inputStyle} value={form.propertyType} onChange={(e) => update('propertyType', e.target.value)}>
              <option value="land">Γη</option><option value="building">Κτίριο</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Αρ. Οικοπέδου {editingRecord ? '(κλειδωμένο)' : '(προαιρετικό)'}</label>
          <input style={{ ...inputStyle, fontFamily: "'Roboto Mono', monospace", background: editingRecord ? '#f3f5f7' : '#fff' }} value={form.parcelId} disabled={!!editingRecord} onChange={(e) => update('parcelId', e.target.value)} placeholder="e.g. AT-204819" />
        </div>
        <div style={{ marginBottom: 18 }}><label style={labelStyle}>Περιγραφή</label><input style={inputStyle} value={form.sizeDescription} onChange={(e) => update('sizeDescription', e.target.value)} placeholder="e.g. 320 τ.μ., διώροφη κατοικία" /></div>
        <div style={{ marginBottom: 24 }}><label style={labelStyle}>Όρια (προαιρετικό)</label><textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.boundaries} onChange={(e) => update('boundaries', e.target.value)} /></div>
        <div style={{ paddingBottom: 24 }}>
          <button type="submit" disabled={submitting} style={{ width: '100%', background: submitting ? '#9aa7bd' : GOV_BLUE, color: '#fff', border: 'none', padding: '13px', borderRadius: 4, fontSize: 15, fontWeight: 700, cursor: submitting ? 'default' : 'pointer', fontFamily: 'inherit' }}>
            {submitting ? 'Αποθήκευση…' : editingRecord ? 'Αποθήκευση Αλλαγών' : 'Υποβολή Καταχώρισης'}
          </button>
        </div>
      </form>
    </div>
  );
}

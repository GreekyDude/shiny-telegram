import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, X, Clock, CheckCircle2, AlertTriangle, ChevronRight, Building2, Trees, Lock, Unlock, Pencil, Trash2, Menu, LogOut } from 'lucide-react';

const SUPABASE_URL = 'https://qsacfjedmurhdwunxtpt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzYWNmamVkbXVyaGR3dW54dHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxOTgyNTgsImV4cCI6MjA5Nzc3NDI1OH0.44lKM16WNhl0XwV4yb8rXlTQSqg82924p3uEqSxrnRc';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GOV_BLUE = '#0057b8';
const GOV_BLUE_DARK = '#003b7a';
const GOV_NAVY = '#002b5c';
const GOV_DEEP = '#001f45';
const GOV_CYAN = '#00aeef';
const GOV_GREEN = '#8cc63f';
const GOV_BLUE_LIGHT = '#eef6ff';
const GOV_TEXT = '#16233a';
const GOV_GRAY = '#66758a';
const GOV_BORDER = '#dce6f2';

function StateEmblem({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.14)" />
      <circle cx="50" cy="50" r="42" stroke="#ffffff" strokeWidth="3" opacity="0.95" />
      <g stroke="#ffffff" strokeWidth="2.6" fill="none" strokeLinecap="round">
        <path d="M50 78 C 38 70, 32 58, 34 46 C 36 50, 40 52, 44 50" />
        <path d="M50 78 C 38 70, 32 58, 34 46 C 36 50, 40 52, 44 50" transform="scale(-1,1) translate(-100,0)" />
        <path d="M50 70 C 40 64, 36 54, 38 44 C 40 47, 43 49, 46 47" />
        <path d="M50 70 C 40 64, 36 54, 38 44 C 40 47, 43 49, 46 47" transform="scale(-1,1) translate(-100,0)" />
      </g>
      <rect x="44" y="22" width="12" height="36" rx="1.5" fill="#ffffff" />
      <rect x="32" y="34" width="36" height="12" rx="1.5" fill="#ffffff" />
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

  const todayStr = new Date().toLocaleDateString('el-GR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#f5f8fc', fontFamily: "'Inter', 'Open Sans', Arial, sans-serif", color: GOV_TEXT }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@500&display=swap" />

      <header style={{ background: GOV_NAVY, color: '#fff' }}>
        <div style={{ background: GOV_DEEP, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StateEmblem size={34} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.7 }}>ΕΛΛΗΝΙΚΗ ΔΗΜΟΚΡΑΤΙΑ</div>
                <div style={{ fontSize: 10.5, opacity: 0.72 }}>Υπουργείο Ψηφιακής Διακυβέρνησης</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13 }}>
              <span style={{ opacity: 0.75 }}>{todayStr}</span>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', color: GOV_NAVY, border: 'none', borderRadius: 999, padding: '8px 14px', fontWeight: 700, fontFamily: 'inherit' }}>EL⌄</button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 34, height: 34, display: 'grid', gap: 3 }}>
                <span style={{ background: '#54b5ed', borderRadius: 6, transform: 'skewY(-30deg)' }} />
                <span style={{ background: GOV_GREEN, borderRadius: 6, transform: 'skewY(-30deg)' }} />
              </div>
              <div>
                <div style={{ fontSize: 30, lineHeight: 1, fontWeight: 800, letterSpacing: -0.6 }}>Κτηματολόγιο</div>
                <div style={{ marginTop: 5, color: '#b9d7f4', fontSize: 13, fontWeight: 600 }}>ΕΚΧΑ — Εθνικό Κτηματολόγιο &amp; Χαρτογράφηση</div>
              </div>
            </div>

            <div style={{ display: 'none', alignItems: 'center', gap: 10 }} className="ekxa-nav-desktop">
              <NavBtn active={view === 'search'} onClick={() => { setView('search'); setEditingRecord(null); }} label="Αναζήτηση" sub="Μητρώου" />
              {isOfficer && <NavBtn active={view === 'register'} onClick={() => { setForm(emptyForm()); setEditingRecord(null); setView('register'); }} label="Καταχώριση" sub="Ακινήτου" />}
              {!authLoading && (
                isOfficer ? (
                  <button onClick={handleLogout} style={pillBtnStyle()}><LogOut size={16} /> Αποσύνδεση</button>
                ) : (
                  <button onClick={() => setShowAuthModal(true)} style={pillBtnStyle()}><Lock size={16} /> Είσοδος Υπαλλήλου</button>
                )
              )}
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="ekxa-burger" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: 10, cursor: 'pointer' }}>
              <Menu size={22} color="#fff" />
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="ekxa-mobile-menu" style={{ marginTop: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 16, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <NavBtn active={view === 'search'} onClick={() => { setView('search'); setEditingRecord(null); setMobileMenuOpen(false); }} label="Αναζήτηση" sub="Μητρώου" full />
              {isOfficer && <NavBtn active={view === 'register'} onClick={() => { setForm(emptyForm()); setEditingRecord(null); setView('register'); setMobileMenuOpen(false); }} label="Καταχώριση" sub="Ακινήτου" full />}
              {!authLoading && (
                isOfficer ? (
                  <button onClick={handleLogout} style={{ ...pillBtnStyle(), width: '100%', justifyContent: 'center' }}><LogOut size={16} /> Αποσύνδεση</button>
                ) : (
                  <button onClick={() => setShowAuthModal(true)} style={{ ...pillBtnStyle(), width: '100%', justifyContent: 'center' }}><Lock size={16} /> Είσοδος Υπαλλήλου</button>
                )
              )}
            </div>
          )}
        </div>
      </header>

      <div style={{ background: '#fff', borderBottom: `1px solid ${GOV_BORDER}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '13px 24px', fontSize: 13, color: GOV_GRAY, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>gov.gr</span><ChevronRight size={13} /><span>Ηλεκτρονικές Υπηρεσίες</span><ChevronRight size={13} /><span style={{ color: GOV_BLUE, fontWeight: 800 }}>Εθνικό Κτηματολόγιο</span>
        </div>
      </div>

      {!isOfficer && !authLoading && (
        <div style={{ background: '#eaf6ff', borderBottom: '1px solid #cfeaff', padding: '11px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: GOV_NAVY, display: 'inline-flex', alignItems: 'center', gap: 7, fontWeight: 700 }}>
            <Lock size={14} /> Δημόσια προβολή μόνο για ανάγνωση. Only ΕΚΧΑ officers may add, edit, or remove entries.
          </span>
        </div>
      )}

      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,20,45,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 18, maxWidth: 420, width: '100%', boxShadow: '0 30px 80px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
            <div style={{ background: GOV_NAVY, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Unlock size={18} color="#fff" />
                <div style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>Σύνδεση Υπαλλήλου</div>
              </div>
              <button onClick={() => { setShowAuthModal(false); setAuthError(''); setLoginEmail(''); setLoginPassword(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cfe0f0' }}><X size={22} /></button>
            </div>
            <div style={{ padding: 26 }}>
              <p style={{ fontSize: 14, color: GOV_GRAY, marginBottom: 18, lineHeight: 1.55 }}>
                Συνδεθείτε με τα στοιχεία υπαλλήλου ΕΚΧΑ.<br /><span style={{ color: '#8a95a3' }}>Sign in with your ΕΚΧΑ officer credentials.</span>
              </p>
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 12 }}>
                  <input type="email" autoFocus required value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setAuthError(''); }} placeholder="Email"
                    style={modalInputStyle()} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <input type="password" required value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); setAuthError(''); }} placeholder="Κωδικός / Password"
                    style={{ ...modalInputStyle(), borderColor: authError ? '#b23b3b' : GOV_BORDER }} />
                </div>
                {authError && <div style={{ fontSize: 12.5, color: '#b23b3b', marginBottom: 10 }}>{authError}</div>}
                <button type="submit" disabled={authSubmitting} style={primaryBtnStyle(authSubmitting)}>
                  {authSubmitting ? 'Σύνδεση…' : 'Σύνδεση'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 50, background: toast.type === 'error' ? '#a12828' : '#17653a', color: '#fff', padding: '14px 18px', borderRadius: 12, maxWidth: 380, fontSize: 14, lineHeight: 1.45, boxShadow: '0 16px 40px rgba(0,0,0,0.25)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          {toast.type === 'error' ? <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />}
          <span>{toast.msg}</span>
        </div>
      )}

      <main>
        {view === 'search' && !selectedRecord && (
          <SearchView query={query} setQuery={setQuery} filtered={filtered} loading={loading} onOpen={(r) => setSelectedRecord(r)} effectiveStatus={effectiveStatus}
            onGoRegister={() => { setForm(emptyForm()); setEditingRecord(null); setView('register'); }} isOfficer={isOfficer} totalCount={records.length} />
        )}
        {selectedRecord && (
          <section style={{ maxWidth: 1180, margin: '0 auto', padding: '34px 24px 76px' }}>
            <RecordDetail record={selectedRecord} status={effectiveStatus(selectedRecord)} onBack={() => setSelectedRecord(null)} isOfficer={isOfficer}
              onEdit={() => startEdit(selectedRecord)} onDelete={() => handleDelete(selectedRecord)} />
          </section>
        )}
        {view === 'register' && isOfficer && (
          <section style={{ maxWidth: 980, margin: '0 auto', padding: '34px 24px 76px' }}>
            <RegisterView form={form} setForm={setForm} onSubmit={handleSubmit} submitting={submitting} editingRecord={editingRecord} />
          </section>
        )}
        {view === 'register' && !isOfficer && (
          <section style={{ maxWidth: 900, margin: '0 auto', padding: '34px 24px 76px' }}>
            <div style={{ textAlign: 'center', padding: '70px 24px', background: '#fff', border: `1px solid ${GOV_BORDER}`, borderRadius: 18, boxShadow: '0 18px 50px rgba(0, 43, 92, 0.08)' }}>
              <Lock size={32} color={GOV_BLUE} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: GOV_NAVY }}>Απαιτείται πρόσβαση υπαλλήλου</div>
              <div style={{ fontSize: 14, color: GOV_GRAY, marginTop: 6 }}>Officer access required.</div>
            </div>
          </section>
        )}
      </main>

      <footer style={{ background: '#fff', borderTop: `4px solid ${GOV_BLUE}`, padding: '30px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 12.5, color: GOV_GRAY, lineHeight: 1.6 }}>© Ελληνικό Κτηματολόγιο &amp; Χαρτογράφηση Α.Ε.<br />Υπηρεσίες κτηματολογίου για πολίτες και επαγγελματίες</div>
          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', fontSize: 13, color: GOV_NAVY, fontWeight: 700 }}>
            <span>Όροι Χρήσης</span><span>Πολιτική Απορρήτου</span><span>Προσβασιμότητα</span><span>Επικοινωνία</span>
          </div>
        </div>
      </footer>

      <style>{`
        @media (min-width: 860px) { .ekxa-nav-desktop { display: flex !important; } .ekxa-burger { display: none !important; } .ekxa-mobile-menu { display: none !important; } }
        @media (max-width: 760px) { .ekxa-results-row { grid-template-columns: 1fr !important; } .ekxa-fields-grid { grid-template-columns: 1fr !important; } .ekxa-services-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function modalInputStyle() { return { width: '100%', padding: '13px 14px', borderRadius: 10, border: `1.5px solid ${GOV_BORDER}`, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' }; }
function primaryBtnStyle(disabled) { return { width: '100%', background: disabled ? '#9aa7bd' : GOV_BLUE, color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontSize: 14.5, fontWeight: 800, cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit', marginTop: 4, boxShadow: disabled ? 'none' : '0 8px 18px rgba(0, 87, 184, 0.22)' }; }
function pillBtnStyle() { return { display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.28)', background: 'rgba(0, 87, 184, 0.72)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 10px 22px rgba(0,0,0,0.15)' }; }

function NavBtn({ active, onClick, label, sub, full }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: full ? 'flex-start' : 'center', gap: 1, padding: '10px 16px', borderRadius: 12, border: active ? '1px solid rgba(255,255,255,0.65)' : '1px solid transparent', cursor: 'pointer', background: active ? 'rgba(255,255,255,0.16)' : 'transparent', color: '#fff', fontFamily: 'inherit', width: full ? '100%' : 'auto', textAlign: full ? 'left' : 'center' }}>
      <span style={{ fontSize: 14, fontWeight: 800 }}>{label}</span>
      <span style={{ fontSize: 10.5, opacity: 0.72, fontWeight: 600 }}>{sub}</span>
    </button>
  );
}

function StatusPill({ status }) {
  const map = {
    pending: { bg: '#fff4ce', text: '#6b5a1d', label: 'Δημόσια Προειδοποίηση', sub: 'Public notice', icon: <Clock size={14} /> },
    confirmed: { bg: '#e3f5e9', text: '#17653a', label: 'Επιβεβαιωμένη Ιδιοκτησία', sub: 'Confirmed', icon: <CheckCircle2 size={14} /> },
    disputed: { bg: '#fae8e8', text: '#9b2c2c', label: 'Υπό Αμφισβήτηση', sub: 'Disputed', icon: <AlertTriangle size={14} /> },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', background: s.bg, color: s.text, borderRadius: 10, padding: '7px 12px' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800 }}>{s.icon} {s.label}</span>
      <span style={{ fontSize: 10.5, opacity: 0.8 }}>{s.sub}</span>
    </span>
  );
}

function SearchView({ query, setQuery, filtered, loading, onOpen, effectiveStatus, onGoRegister, isOfficer, totalCount }) {
  return (
    <div>
      <section style={{ background: `linear-gradient(180deg, ${GOV_NAVY} 0%, ${GOV_BLUE_DARK} 100%)`, color: '#fff', borderBottom: `4px solid ${GOV_CYAN}` }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '54px 24px 58px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 34, alignItems: 'center' }} className="ekxa-results-row">
          <div>
            <div style={{ fontSize: 14, color: '#9ed8ff', fontWeight: 800, marginBottom: 10 }}>ΗΛΕΚΤΡΟΝΙΚΗ ΥΠΗΡΕΣΙΑ ΚΤΗΜΑΤΟΛΟΓΙΟΥ</div>
            <h1 style={{ fontSize: 38, lineHeight: 1.12, fontWeight: 800, margin: 0, letterSpacing: -1 }}>Αναζήτηση Μητρώου Ακινήτων</h1>
            <p style={{ color: '#c7ddf2', fontSize: 17, marginTop: 12, maxWidth: 650, lineHeight: 1.55 }}>Αναζητήστε με αριθμό οικοπέδου, διεύθυνση, ιδιοκτήτη ή περιφέρεια.</p>
            <div style={{ marginTop: 24, position: 'relative', maxWidth: 620 }}>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Αναζήτηση εδώ ..."
                style={{ width: '100%', padding: '18px 70px 18px 20px', borderRadius: 10, border: 'none', fontSize: 16, fontFamily: 'inherit', outline: 'none', background: '#fff', boxSizing: 'border-box', boxShadow: '0 18px 40px rgba(0,0,0,0.18)' }} />
              <button style={{ position: 'absolute', right: 7, top: 7, bottom: 7, width: 52, border: 'none', background: GOV_BLUE_DARK, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Search size={22} color="#fff" /></button>
            </div>
          </div>
          <div style={{ minWidth: 260, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)', borderRadius: 24, padding: 24, boxShadow: '0 18px 50px rgba(0,0,0,0.12)' }}>
            <div style={{ fontSize: 13, color: '#b9d7f4', fontWeight: 800 }}>Ποσοστό Κτηματογράφησης</div>
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 70, height: 70, borderRadius: '50%', border: `10px solid ${GOV_GREEN}`, borderRightColor: 'rgba(255,255,255,0.18)' }} />
              <div style={{ fontSize: 34, fontWeight: 800 }}>76%</div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '34px 24px 28px' }}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 22, color: GOV_TEXT, margin: 0, fontWeight: 800 }}>Αποτελέσματα Αναζήτησης</h2>
          <div style={{ color: GOV_GRAY, fontSize: 14, marginTop: 6 }}>{loading ? 'Φόρτωση μητρώου…' : `${filtered.length} από ${totalCount} εγγραφή/ές`}</div>
        </div>

        {loading ? (
          <div style={{ color: GOV_GRAY, fontSize: 14, padding: '46px 0', textAlign: 'center', background: '#fff', border: `1px solid ${GOV_BORDER}`, borderRadius: 16 }}>Φόρτωση μητρώου…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '58px 24px', background: '#fff', border: `1px solid ${GOV_BORDER}`, borderRadius: 16, boxShadow: '0 18px 50px rgba(0, 43, 92, 0.08)' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: GOV_NAVY, marginBottom: 10 }}>{query ? 'Δεν βρέθηκαν αποτελέσματα' : 'Δεν υπάρχουν ακόμη καταχωρίσεις'}</div>
            {isOfficer && !query && <button onClick={onGoRegister} style={{ background: GOV_BLUE, color: '#fff', border: 'none', padding: '12px 22px', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Καταχώριση Ακινήτου</button>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((r) => (
              <button key={r.parcel_id} onClick={() => onOpen(r)} style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 24, alignItems: 'center', textAlign: 'left', background: '#fff', border: `1px solid ${GOV_BORDER}`, borderRadius: 16, padding: '24px 26px', cursor: 'pointer', fontFamily: 'inherit', width: '100%', boxShadow: '0 14px 36px rgba(0, 43, 92, 0.08)' }} className="ekxa-results-row">
                <div style={{ width: 78, height: 78, borderRadius: 14, background: GOV_BLUE_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {r.property_type === 'building' ? <Building2 size={34} color={GOV_BLUE} /> : <Trees size={34} color={GOV_BLUE} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: GOV_TEXT }}>{r.address}</div>
                  <div style={{ fontSize: 14, color: GOV_GRAY, marginTop: 6, fontFamily: "'Roboto Mono', monospace" }}>{r.parcel_id} · {r.region}</div>
                  <div style={{ marginTop: 16, display: 'flex', gap: 34, flexWrap: 'wrap', fontSize: 13.5, color: GOV_GRAY }}>
                    <span><b style={{ color: GOV_TEXT }}>Ιδιοκτήτης</b><br />{r.owner_name}</span>
                    <span><b style={{ color: GOV_TEXT }}>Τύπος</b><br />{r.property_type === 'building' ? 'Κτίριο' : 'Γη'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, justifyContent: 'space-between' }}>
                  <StatusPill status={effectiveStatus(r)} />
                  <ChevronRight size={24} color={GOV_BLUE} />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '10px 24px 76px' }}>
        <h2 style={{ color: GOV_TEXT, fontSize: 28, margin: 0, fontWeight: 800 }}>Υπηρεσίες Κτηματολογίου</h2>
        <p style={{ color: GOV_GRAY, marginTop: 8 }}>Ψηφιακές υπηρεσίες για πολίτες και επαγγελματίες</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22, marginTop: 22 }} className="ekxa-services-grid">
          <ServiceCard icon={<Search size={28} />} title="Αναζήτηση Ακινήτων" text="Αναζητήστε ακίνητα στο εθνικό μητρώο." />
          <ServiceCard icon={<Building2 size={28} />} title="Καταχώριση Ακινήτου" text="Υποβάλετε νέα ακίνητα ή ενημερώστε στοιχεία." />
          <ServiceCard icon={<CheckCircle2 size={28} />} title="Δήλωση Ιδιοκτησίας" text="Υποβάλετε δήλωση και συνοδευτικά έγγραφα." />
          <ServiceCard icon={<Clock size={28} />} title="Δημόσιες Προειδοποιήσεις" text="Παρακολουθήστε την περίοδο ελέγχου." />
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ icon, title, text }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${GOV_BORDER}`, borderRadius: 14, padding: 22, minHeight: 138, boxShadow: '0 12px 30px rgba(0, 43, 92, 0.06)' }}>
      <div style={{ color: GOV_BLUE, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontWeight: 800, color: GOV_BLUE, fontSize: 16 }}>{title}</div>
      <div style={{ color: GOV_GRAY, fontSize: 13.5, marginTop: 10, lineHeight: 1.45 }}>{text}</div>
      <div style={{ marginTop: 12, color: GOV_BLUE, fontWeight: 900 }}>→</div>
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
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: GOV_BLUE, fontWeight: 800, fontSize: 14, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>← Επιστροφή</button>
        {isOfficer && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onEdit} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `1.5px solid ${GOV_BLUE}`, color: GOV_BLUE, padding: '9px 14px', borderRadius: 10, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}><Pencil size={14} /> Επεξεργασία</button>
            {!confirmingDelete ? (
              <button onClick={() => setConfirmingDelete(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid #b23b3b', color: '#b23b3b', padding: '9px 14px', borderRadius: 10, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}><Trash2 size={14} /> Αφαίρεση</button>
            ) : (
              <button onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#b23b3b', border: '1.5px solid #b23b3b', color: '#fff', padding: '9px 14px', borderRadius: 10, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}><Trash2 size={14} /> Επιβεβαίωση</button>
            )}
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${GOV_BORDER}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 18px 50px rgba(0, 43, 92, 0.08)' }}>
        <div style={{ background: `linear-gradient(135deg, ${GOV_NAVY}, ${GOV_BLUE})`, padding: '28px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ fontFamily: "'Roboto Mono', monospace", color: '#b9d7f4', fontSize: 13, letterSpacing: 1, marginBottom: 6 }}>ΑΡ. ΟΙΚΟΠΕΔΟΥ {record.parcel_id}</div>
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 800 }}>{record.address}</div>
          </div>
          <StatusPill status={status} />
        </div>
        <div style={{ padding: '28px 30px' }}>
          {status === 'pending' && (
            <div style={{ background: '#fff4ce', borderRadius: 12, padding: '14px 16px', marginBottom: 24, fontSize: 13.5, color: '#6b5a1d', display: 'flex', gap: 10 }}>
              <Clock size={16} style={{ flexShrink: 0, marginTop: 1 }} /><span>Στην 7-ήμερη περίοδο δημόσιας προειδοποίησης, λήγει {new Date(record.notice_ends_at).toLocaleDateString('en-GB')}.</span>
            </div>
          )}
          {status === 'confirmed' && (
            <div style={{ background: '#e3f5e9', borderRadius: 12, padding: '14px 16px', marginBottom: 24, fontSize: 13.5, color: '#17653a', display: 'flex', gap: 10 }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} /><span>Επιβεβαιωμένη εγγραφή στο εθνικό κτηματολόγιο.</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '22px 32px' }} className="ekxa-fields-grid">
            {fields.map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 11.5, color: GOV_GRAY, letterSpacing: 0.4, marginBottom: 5, textTransform: 'uppercase', fontWeight: 800 }}>{label}</div>
                <div style={{ fontSize: 15.5, color: GOV_TEXT, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28, paddingTop: 18, borderTop: `1px solid ${GOV_BORDER}`, fontSize: 12.5, color: GOV_GRAY }}>
            Καταχωρήθηκε {new Date(record.created_at).toLocaleDateString('en-GB')}{record.last_edited_at && ` · Επεξεργάστηκε ${new Date(record.last_edited_at).toLocaleDateString('en-GB')}`}
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterView({ form, setForm, onSubmit, submitting, editingRecord }) {
  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  const inputStyle = { width: '100%', padding: '13px 14px', borderRadius: 10, border: `1.5px solid ${GOV_BORDER}`, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' };
  const labelStyle = { fontSize: 13, fontWeight: 800, color: GOV_NAVY, marginBottom: 7, display: 'block' };

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, ${GOV_NAVY}, ${GOV_BLUE})`, color: '#fff', borderRadius: '18px 18px 0 0', padding: '30px 32px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{editingRecord ? `Επεξεργασία ${editingRecord.parcel_id}` : 'Καταχώριση Ακινήτου'}</h1>
        <p style={{ color: '#c7ddf2', marginTop: 8, marginBottom: 0 }}>Συμπληρώστε τα στοιχεία του ακινήτου στο μητρώο.</p>
      </div>
      <form onSubmit={onSubmit} style={{ background: '#fff', border: `1px solid ${GOV_BORDER}`, borderTop: 'none', borderRadius: '0 0 18px 18px', padding: '28px 32px 10px', boxShadow: '0 18px 50px rgba(0, 43, 92, 0.08)' }}>
        <div style={{ marginBottom: 18 }}><label style={labelStyle}>Ονοματεπώνυμο Ιδιοκτήτη</label><input style={inputStyle} value={form.ownerName} onChange={(e) => update('ownerName', e.target.value)} placeholder="e.g. Δημήτρης Παπαδόπουλος" /></div>
        <div style={{ marginBottom: 18 }}><label style={labelStyle}>Διεύθυνση Ακινήτου</label><input style={inputStyle} value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="e.g. Αδριανού 14, Πλάκα" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }} className="ekxa-fields-grid">
          <div><label style={labelStyle}>Περιφέρεια</label><input style={inputStyle} value={form.region} onChange={(e) => update('region', e.target.value)} placeholder="e.g. Αττική" /></div>
          <div><label style={labelStyle}>Τύπος Ακινήτου</label>
            <select style={inputStyle} value={form.propertyType} onChange={(e) => update('propertyType', e.target.value)}>
              <option value="land">Γη</option><option value="building">Κτίριο</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Αρ. Οικοπέδου {editingRecord ? '(κλειδωμένο)' : '(προαιρετικό)'}</label>
          <input style={{ ...inputStyle, fontFamily: "'Roboto Mono', monospace", background: editingRecord ? '#f3f6fb' : '#fff' }} value={form.parcelId} disabled={!!editingRecord} onChange={(e) => update('parcelId', e.target.value)} placeholder="e.g. AT-204819" />
        </div>
        <div style={{ marginBottom: 18 }}><label style={labelStyle}>Περιγραφή</label><input style={inputStyle} value={form.sizeDescription} onChange={(e) => update('sizeDescription', e.target.value)} placeholder="e.g. 320 τ.μ., διώροφη κατοικία" /></div>
        <div style={{ marginBottom: 24 }}><label style={labelStyle}>Όρια (προαιρετικό)</label><textarea style={{ ...inputStyle, minHeight: 84, resize: 'vertical' }} value={form.boundaries} onChange={(e) => update('boundaries', e.target.value)} /></div>
        <div style={{ paddingBottom: 24 }}>
          <button type="submit" disabled={submitting} style={primaryBtnStyle(submitting)}>
            {submitting ? 'Αποθήκευση…' : editingRecord ? 'Αποθήκευση Αλλαγών' : 'Υποβολή Καταχώρισης'}
          </button>
        </div>
      </form>
    </div>
  );
}

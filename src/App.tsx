import { useEffect, useMemo, useRef, useState } from 'react';
import translations from './translations';

type Language = keyof typeof translations;
type Role = 'farmer' | 'mechanic' | 'vet' | 'buyer' | 'delivery';
type Tab = 'home' | 'buy' | 'sell' | 'role' | 'schemes';

type Profile = {
  name: string;
  email: string;
  phone: string;
  address: string;
  role: Role;
};

const navItems: Array<{ key: Tab; label: string; icon: string }> = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'buy', label: 'Buy', icon: '🛒' },
  { key: 'sell', label: 'Sell', icon: '🌾' },
  { key: 'role', label: 'Role', icon: '🔁' },
  { key: 'schemes', label: 'Schemes', icon: '📜' },
];

const roleMeta: Record<Role, { label: string; accent: string; icon: string }> = {
  farmer: { label: 'Farmer', accent: '#2e6f3d', icon: '🚜' },
  mechanic: { label: 'Mechanic', accent: '#7d5617', icon: '🔧' },
  vet: { label: 'Veterinarian', accent: '#4f7d48', icon: '🐄' },
  buyer: { label: 'Buyer', accent: '#884e2e', icon: '🛍️' },
  delivery: { label: 'Delivery', accent: '#395a8f', icon: '📦' },
};

const initialProfile: Profile = {
  name: 'Arjun Farmer',
  email: 'farmer@example.com',
  phone: '9876543210',
  address: 'Nashik, Maharashtra',
  role: 'farmer',
};

const sampleProducts = [
  { name: 'Fresh Onion', category: 'Vegetable', price: 18, premium: 24, trend: 'UP', location: 'Nashik' },
  { name: 'Tomato', category: 'Fruit', price: 26, premium: 34, trend: 'STABLE', location: 'Pune' },
  { name: 'Mushroom', category: 'Specialty', price: 35, premium: 49, trend: 'UP', location: 'Nagpur' },
  { name: 'Potato', category: 'Root Crop', price: 22, premium: 29, trend: 'DOWN', location: 'Aurangabad' },
];

const serviceRequests = [
  { name: 'Rajesh Patil', issue: 'Tractor engine overheating in field', fee: 120, category: 'mechanic' },
  { name: 'Sunita Mandlik', issue: 'Cow not eating and fever', fee: 100, category: 'vet' },
  { name: 'Bharat Wagh', issue: 'Harvester broken during harvest', fee: 120, category: 'mechanic' },
];

const schemes = [
  { title: 'PM-KISAN', benefit: '₹6,000/year', eligibility: 'Small and marginal farmers', link: '#' },
  { title: 'Kisan Credit Card', benefit: 'Crop loan up to ₹3 lakhs', eligibility: 'Farmers with land records', link: '#' },
  { title: 'Soil Health Card', benefit: 'Free soil testing', eligibility: 'Registered farmers', link: '#' },
  { title: 'PM Fasal Bima Yojana', benefit: 'Crop insurance', eligibility: 'All notified crops', link: '#' },
];

function App() {
  const [lang, setLang] = useState<Language>('mr');
  const [tab, setTab] = useState<Tab>('home');
  const [profile, setProfile] = useState<Profile>(() => {
    const value = localStorage.getItem('kissan-dhanwan-profile');
    return value ? JSON.parse(value) : initialProfile;
  });
  const [roleNotice, setRoleNotice] = useState('');
  const [diagResult, setDiagResult] = useState('');
  const [severity, setSeverity] = useState<'yes' | 'no'>('no');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [booking, setBooking] = useState({
    name: '',
    address: '',
    phone: '',
    payment: 'cash',
    type: 'mechanic',
  });
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  const t = useMemo(() => translations[lang], [lang]);

  useEffect(() => {
    localStorage.setItem('kissan-dhanwan-profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognitionRef.current = recognition;
    }
  }, [lang]);

  const handleVoice = (target: 'input' | 'output') => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      alert('Voice input is not available in this browser');
      return;
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (target === 'input') {
        setBooking((prev) => ({ ...prev, address: transcript }));
      } else {
        setDiagResult(transcript);
      }
    };

    recognition.start();
  };

  const runDiagnosis = () => {
    const text = diagResult.toLowerCase();
    const isSevere =
      text.includes('tractor') ||
      text.includes('engine') ||
      text.includes('severe') ||
      text.includes('fever') ||
      text.includes('paralysis') ||
      text.includes('bleeding') ||
      text.includes('harvester');

    const disease = text.includes('leaf') || text.includes('rust') ? 'Crop disease detected: fungal infection or nutrient stress.' :
      text.includes('cow') || text.includes('animal') ? 'Livestock illness needs veterinary attention.' :
      text.includes('tractor') || text.includes('engine') ? 'Machinery issue detected: engine or drive system failure likely.' :
      'Field inspection recommended with basic agronomic checks.';

    setSeverity(isSevere ? 'yes' : 'no');
    setDiagResult(`${disease} Suggested action: ${isSevere ? 'Immediate professional support is advised.' : 'Monitor, treat, and recheck after 48 hours.'}`);
  };

  const updateRole = (nextRole: Role) => {
    const emailKey = `kissan-role-${profile.email}`;
    localStorage.setItem(emailKey, nextRole);
    setProfile((prev) => ({ ...prev, role: nextRole }));
    setRoleNotice(`Role updated to ${roleMeta[nextRole].label}. One active role is stored for this account.`);
  };

  const exportMyData = () => {
    const data = {
      profile,
      role: profile.role,
      createdAt: new Date().toISOString(),
      marketplace: sampleProducts,
      services: serviceRequests,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'kissan-dhanwan-data.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const eraseMyData = () => {
    const confirmed = window.confirm('Type DELETE to permanently erase your account and records.');
    if (!confirmed) {
      return;
    }

    const typed = prompt('Please type DELETE to confirm complete erasure.');
    if (typed === 'DELETE') {
      localStorage.removeItem('kissan-dhanwan-profile');
      setProfile(initialProfile);
      setRoleNotice('All account data has been erased for this local demo.');
    }
  };

  const renderNavButton = (item: { key: Tab; label: string; icon: string }) => (
    <button
      key={item.key}
      className={`nav-btn ${tab === item.key ? 'active' : ''}`}
      onClick={() => setTab(item.key)}
    >
      <span>{item.icon}</span>
      <span>{item.key === 'home' ? t.home : item.key === 'buy' ? t.buy : item.key === 'sell' ? t.sell : item.key === 'role' ? t.role : t.schemes}</span>
    </button>
  );

  const RenderHome = () => (
    <>
      <section className="hero card">
        <div className="hero__header">
          <span className="badge">AI · Smart Agri</span>
          <span className="badge">{roleMeta[profile.role].icon} {roleMeta[profile.role].label}</span>
        </div>
        <h2>{t.appTitle}</h2>
        <div className="hero__meta">
          <div className="stat">
            <small>{t.weather}</small>
            <strong>28°C</strong>
          </div>
          <div className="stat">
            <small>{t.alerts}</small>
            <strong>{t.weatherNotice}</strong>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h3>{t.aiDiagnosis}</h3>
          <span className="badge">{t.serious}: {severity === 'yes' ? t.yes : t.no}</span>
        </div>

        <div className="card panel stack">
          <div className="form-row">
            <textarea
              className="textarea"
              placeholder="Describe crop disease, animal illness, or machine issue…"
              value={diagResult}
              onChange={(e) => setDiagResult(e.target.value)}
            />
          </div>

          <div className="image-frame">
            {selectedFile ? <img src={selectedFile} alt="uploaded item" /> : <div className="muted">Upload field image</div>}
          </div>

          <label className="primary-btn" style={{ display: 'inline-block', textAlign: 'center' }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                setSelectedFile(url);
              }}
              style={{ display: 'none' }}
            />
            {t.uploadImage}
          </label>

          <div className="inline-actions">
            <button className="secondary-btn" onClick={() => handleVoice('input')}>{t.voiceInput}</button>
            <button className="secondary-btn" onClick={() => handleVoice('output')}>{t.voiceOutput}</button>
            <button className="primary-btn" onClick={runDiagnosis}>{t.diagnosis}</button>
          </div>

          <div className="analysis-box">
            <strong>{t.diagnosis}:</strong>
            <p>{diagResult || 'No diagnosis yet. Add a crop, machine, or livestock description for AI support.'}</p>
          </div>

          {severity === 'yes' && (
            <div className="warning">
              {t.serious} alert: book a service visit for immediate support.
            </div>
          )}

          {severity === 'yes' && (
            <div className="card panel stack">
              <div className="form-row">
                <label>{t.farmerName}</label>
                <input className="input" value={booking.name} onChange={(e) => setBooking({ ...booking, name: e.target.value })} />
              </div>
              <div className="form-row">
                <label>{t.address}</label>
                <input className="input" value={booking.address} onChange={(e) => setBooking({ ...booking, address: e.target.value })} />
              </div>
              <div className="form-row">
                <label>{t.phone}</label>
                <input className="input" value={booking.phone} onChange={(e) => setBooking({ ...booking, phone: e.target.value })} />
              </div>
              <div className="form-row">
                <label>{t.payment}</label>
                <select className="select" value={booking.payment} onChange={(e) => setBooking({ ...booking, payment: e.target.value })}>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank">Net Banking</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>
              <div className="inline-actions">
                <button className="primary-btn" onClick={() => setTab('role')}>{t.mechanicVisit} ₹120</button>
                <button className="secondary-btn" onClick={() => setTab('role')}>{t.doctorVisit} ₹100</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );

  const RenderBuy = () => (
    <>
      <section className="section">
        <div className="section__header">
          <h3>{t.market}</h3>
          <span className="badge">Live Mandis</span>
        </div>
        <div className="stack">
          {sampleProducts.map((product) => (
            <div className="card panel" key={product.name}>
              <div className="list-card">
                <div>
                  <h4>{product.name}</h4>
                  <p>{product.location} · {product.category}</p>
                </div>
                <span className="price-tag">₹{product.price}/kg</span>
              </div>
              <div className="grid two" style={{ marginTop: 12 }}>
                <div className="panel">
                  <small>{t.directPrice}</small>
                  <div className="currency">₹{product.premium}/kg</div>
                </div>
                <div className="panel">
                  <small>{t.priceForecast}</small>
                  <div>{product.trend === 'UP' ? t.trendUp : product.trend === 'DOWN' ? t.trendDown : t.stable}</div>
                </div>
              </div>
              <div className="inline-actions" style={{ marginTop: 12 }}>
                <button className="primary-btn">{t.sellNow}</button>
                <button className="secondary-btn">{t.findRoutes}</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h3>{t.coldStorage}</h3>
        </div>
        <div className="card panel">
          <div className="list-card">
            <div>
              <h4>Pod 01</h4>
              <p>4°C · 3.6 km · 82% availability</p>
            </div>
            <button className="primary-btn">Google Maps</button>
          </div>
          <div className="progress" style={{ marginTop: 12 }}>
            <span style={{ width: '82%' }} />
          </div>
        </div>
      </section>
    </>
  );

  const RenderSell = () => (
    <>
      <section className="section">
        <div className="section__header">
          <h3>{t.addListing}</h3>
        </div>
        <div className="card panel stack">
          <div className="form-row">
            <label>Produce name</label>
            <input className="input" defaultValue="Tomato" />
          </div>
          <div className="form-row">
            <label>Village / Taluka</label>
            <input className="input" defaultValue="Nashik" />
          </div>
          <div className="form-row">
            <label>Quantity</label>
            <input className="input" defaultValue="350 kg" />
          </div>
          <button className="primary-btn">{t.submit}</button>
        </div>
      </section>

      <section className="section">
        <div className="section__header">
          <h3>AI Smart Pricing</h3>
        </div>
        <div className="card panel stack">
          <div className="list-card">
            <div>
              <h4>Instant sell price</h4>
              <p>Today’s local high-supply rate</p>
            </div>
            <span className="price-tag">₹26/kg</span>
          </div>
          <div className="list-card">
            <div>
              <h4>Premium direct price</h4>
              <p>Urban consumer demand</p>
            </div>
            <span className="price-tag">₹34/kg</span>
          </div>
          <div className="success">
            Store vs sell now verdict: For tomatoes, prefer direct sale or short-term cold storage to reduce spoilage.
          </div>
        </div>
      </section>
    </>
  );

  const RenderRole = () => (
    <>
      <section className="section">
        <div className="section__header">
          <h3>{t.roleSwitch}</h3>
        </div>
        <div className="card panel stack">
          <div className="role-grid">
            {(Object.keys(roleMeta) as Role[]).map((role) => (
              <button
                key={role}
                className={`role-card ${profile.role === role ? 'active' : ''}`}
                onClick={() => updateRole(role)}
              >
                <div style={{ fontSize: '2rem' }}>{roleMeta[role].icon}</div>
                <div><strong>{roleMeta[role].label}</strong></div>
              </button>
            ))}
          </div>

          <div className="form-row">
            <label>Email</label>
            <input className="input" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </div>

          <div className="form-row">
            <label>{t.farmerName}</label>
            <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>

          <div className="form-row">
            <label>{t.phone}</label>
            <input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>

          <div className="form-row">
            <label>{t.address}</label>
            <input className="input" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
          </div>

          {roleNotice && <div className="success">{roleNotice}</div>}
        </div>
      </section>
    </>
  );

  const RenderSchemes = () => (
    <>
      <section className="section">
        <div className="section__header">
          <h3>{t.schemePortal}</h3>
        </div>
        <div className="stack">
          {schemes.map((scheme) => (
            <div className="card panel" key={scheme.title}>
              <h4>{scheme.title}</h4>
              <p><strong>Benefit:</strong> {scheme.benefit}</p>
              <p><strong>Eligibility:</strong> {scheme.eligibility}</p>
              <button className="primary-btn" style={{ marginTop: 12 }}>{t.open}</button>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  const RenderPrivacy = () => (
    <>
      <section className="section">
        <div className="section__header">
          <h3>{t.privacy}</h3>
        </div>
        <div className="card panel stack">
          <p>We comply with India’s Digital Personal Data Protection (DPDP) Act.</p>
          <label className="checkbox-row">
            <input type="checkbox" defaultChecked />
            <span>Explicit consent for data processing and service support.</span>
          </label>
          <div className="grid two">
            <div className="panel"><strong>Right to access</strong><p>Review profile and request current data.</p></div>
            <div className="panel"><strong>Right to edit</strong><p>Update name, phone, and profile details.</p></div>
            <div className="panel"><strong>Right to export</strong><p>Download your data in JSON format.</p></div>
            <div className="panel"><strong>Right to erase</strong><p>Delete your account and records with confirmation.</p></div>
          </div>
        </div>
      </section>
    </>
  );

  const RenderMyData = () => (
    <>
      <section className="section">
        <div className="section__header">
          <h3>{t.myData}</h3>
        </div>
        <div className="card panel stack">
          <div className="form-row">
            <label>Name</label>
            <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Email</label>
            <input className="input" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </div>
          <div className="form-row">
            <label>{t.phone}</label>
            <input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>
          <div className="inline-actions">
            <button className="primary-btn" onClick={exportMyData}>{t.exportData}</button>
            <button className="secondary-btn" onClick={eraseMyData}>{t.eraseData}</button>
          </div>
        </div>
      </section>
    </>
  );

  const renderPage = () => {
    if (tab === 'buy') return RenderBuy();
    if (tab === 'sell') return RenderSell();
    if (tab === 'role') return RenderRole();
    if (tab === 'schemes') return RenderSchemes();
    return RenderHome();
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="topbar__title">🌾 {t.appTitle}</div>
          <div className="lang-toggle">
            {['mr', 'hi', 'en'].map((code) => (
              <button
                key={code}
                className={lang === code ? 'active' : ''}
                onClick={() => setLang(code as Language)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="content">
        {renderPage()}

        <section className="section">
          <div className="section__header">
            <h3>{t.paymentOptions}</h3>
          </div>
          <div className="card panel stack">
            <div className="grid two">
              <div className="panel">UPI</div>
              <div className="panel">Debit / Credit Card</div>
              <div className="panel">Net Banking</div>
              <div className="panel">Wallets</div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section__header">
            <h3>{t.delivery}</h3>
          </div>
          <div className="card panel stack">
            <div className="list-card">
              <div>
                <h4>Step 1: Accept order</h4>
                <p>Farmer: Priya More · +91 98765 43210</p>
              </div>
              <button className="primary-btn">📦 Received</button>
            </div>
            <div className="list-card">
              <div>
                <h4>Step 2: Deliver to buyer</h4>
                <p>Address: Pune City · +91 98765 11223</p>
              </div>
              <button className="secondary-btn">✔ Delivered</button>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section__header">
            <h3>{t.jobs}</h3>
          </div>
          <div className="stack">
            {serviceRequests.map((request) => (
              <div className="card panel" key={request.name + request.issue}>
                <h4>{request.name}</h4>
                <p>{request.issue}</p>
                <div className="inline-actions" style={{ marginTop: 8 }}>
                  <span className="badge">₹{request.fee}</span>
                  <span className="badge">{request.category}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section__header">
            <h3>{t.privacy}</h3>
          </div>
          <div className="card panel stack">
            <button className="secondary-btn" onClick={() => setTab('schemes')}>{t.privacy}</button>
            <button className="secondary-btn" onClick={() => setTab('sell')}>{t.myData}</button>
          </div>
        </section>
      </main>

      <nav className="bottom-nav">
        <div className="bottom-nav__inner">
          {navItems.map(renderNavButton)}
        </div>
      </nav>

      <div className="footer-credit">{t.createdBy}</div>
    </div>
  );
}

export default App;

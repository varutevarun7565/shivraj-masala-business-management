import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';
import { useTranslation } from '../i18n/TranslationContext';
import { Eye, EyeOff, Globe, ShieldCheck } from 'lucide-react';
import brandLogo from '../assets/shivraj-logo.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const { setRole, setUserName } = useApp();
  const { language, setLanguage, t } = useTranslation();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || password.length < 8) { toast.error('Enter username and a password of at least 8 characters.'); return; }
    if (!window.desktopAPI) { toast.error('Please run the desktop application using npm run desktop.'); return; }
    const result = await window.desktopAPI.login({ username: username.trim(), password });
    if (!result.ok || !result.user) { toast.error(result.message || 'Login failed.'); return; }
    setRole(result.user.role as import('../context/AppContext').Role);
    setUserName(result.user.displayName);
    navigate('/dashboard');
  };

  return (
    <div className="login-screen login-screen-vertical">
      <button onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')} className="login-language">
        <Globe size={14}/>{language === 'en' ? 'मराठी' : 'English'}
      </button>

      <main className="login-vertical-card">
        <div className="login-vertical-brand">
          <img src={brandLogo} className="login-brand-logo" alt="Shivraj Masala" />
          <div className="login-brand-name">Shivraj Masala's & Rice Mill</div>
          <div className="login-brand-sub">कोल्हापुरी ठसका • चवीचा वारसा</div>
        </div>

        <div className="login-vertical-form">
          <div className="login-kicker"><ShieldCheck size={15}/> BUSINESS MANAGEMENT SYSTEM</div>
          <h1>{t('login.title')}</h1>
          <p>Secure local access to billing, inventory, production and reports.</p>
          <form onSubmit={handleLogin} className="login-form">
            <div className="field"><label className="label">{t('login.username')}</label><input autoFocus type="text" className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="e.g. shivraj" autoComplete="username" /></div>
            <div className="field"><label className="label">{t('login.password')}</label><div className="relative"><input type={showPwd?'text':'password'} className="input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 8 characters" autoComplete="current-password" style={{paddingRight:42}}/><button type="button" data-keyboard-nav="off" onClick={()=>setShowPwd(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPwd?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
            <button type="submit" className="btn btn-primary login-submit">{t('action.login')}</button>
          </form>
          <div className="login-footnote">Local & secure • Business data stays on this computer</div>
        </div>
      </main>
    </div>
  );
}

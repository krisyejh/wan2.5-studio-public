import { useApp, type SectionType } from '../context/AppContext';
import './TopNavigationBar.css';

export function TopNavigationBar() {
  const { state, setActiveSection } = useApp();

  const handleSectionChange = (section: SectionType) => {
    setActiveSection(section);
  };

  return (
    <nav className="top-navigation">
      <div className="nav-tabs">
        <button
          className={`nav-tab ${state.activeSection === 'models' ? 'active' : ''}`}
          onClick={() => handleSectionChange('models')}
          aria-pressed={state.activeSection === 'models'}
        >
          <span className="nav-tab-icon">🎨</span>
          <span className="nav-tab-label">Models</span>
        </button>
        <button
          className={`nav-tab ${state.activeSection === 'tools' ? 'active' : ''}`}
          onClick={() => handleSectionChange('tools')}
          aria-pressed={state.activeSection === 'tools'}
        >
          <span className="nav-tab-icon">🛠️</span>
          <span className="nav-tab-label">Tools</span>
        </button>
        <button
          className={`nav-tab ${state.activeSection === 'agents' ? 'active' : ''}`}
          onClick={() => handleSectionChange('agents')}
          aria-pressed={state.activeSection === 'agents'}
        >
          <span className="nav-tab-icon">🤖</span>
          <span className="nav-tab-label">Agents</span>
        </button>
        <button
          className={`nav-tab ${state.activeSection === 'recent' ? 'active' : ''}`}
          onClick={() => handleSectionChange('recent')}
          aria-pressed={state.activeSection === 'recent'}
        >
          <span className="nav-tab-icon">📦</span>
          <span className="nav-tab-label">Recent Gens</span>
        </button>
      </div>
    </nav>
  );
}

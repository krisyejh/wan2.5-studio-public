import { useApp } from '../context/AppContext';
import { TopNavigationBar } from './TopNavigationBar';
import { ModelsSection } from './ModelsSection';
import { ToolsSection } from './ToolsSection';
import { AgentsSection } from './AgentsSection';
import { RecentGens } from './RecentGens';
import './App.css';

function App() {
  const { state } = useApp();

  const renderSection = () => {
    switch (state.activeSection) {
      case 'models':
        return <ModelsSection />;
      case 'tools':
        return <ToolsSection />;
      case 'agents':
        return <AgentsSection />;
      case 'recent':
        return <RecentGens />;
      default:
        return <ModelsSection />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 WanStudio</h1>
        <p className="app-motto">万物生 生万物</p>
        <p className="app-subtitle">AI-Powered Video Creation Platform</p>
      </header>

      <TopNavigationBar />

      <main className="app-main">
        {renderSection()}
      </main>

      <footer className="app-footer">
        <p>Powered by Alibaba Cloud Model Studio | Wanxiang AI Models</p>
      </footer>
    </div>
  );
}

export default App;

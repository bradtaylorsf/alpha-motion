import { Routes, Route } from 'react-router-dom';
import { UnifiedBoard } from './components/UnifiedBoard';
import { ComponentEditor } from './pages/ComponentEditor';
import { Header } from './components/layout/Header';

function BoardPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <UnifiedBoard />
      </main>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<BoardPage />} />
      <Route path="/component/:id" element={<ComponentEditor />} />
    </Routes>
  );
}

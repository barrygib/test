import { AppProvider } from './store/AppContext';
import LeftPane from './components/LeftPane/LeftPane';
import MiddlePane from './components/MiddlePane/MiddlePane';
import RightPane from './components/RightPane/RightPane';
import './App.css';

function App() {
  return (
    <AppProvider>
      <div className="app-layout">
        <LeftPane />
        <MiddlePane />
        <RightPane />
      </div>
    </AppProvider>
  );
}

export default App;

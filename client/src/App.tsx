import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <header className="header">
        <h1 className="text-3xl font-bold text-primary">AI Study Assistant</h1>
        <p className="text-accent">Welcome!</p>
      </header>
      <main className="main">
        <button
          type="button"
          className="counter px-4 py-2 bg-primary text-white rounded-md mt-4"
          onClick={() => setCount((count) => count + 1)}
        >
          count is {count}
        </button>
      </main>
    </div>
  );
}

export default App;

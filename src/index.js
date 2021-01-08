import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const demos = {
  roygbiv: React.lazy(() => import('./Roygbiv')),
};

function App() {
  const params = new URLSearchParams(window.location.search);
  const Demo = demos[params.get('demo')] || demos.roygbiv;

  return (
    <React.Suspense fallback={null}>
      <Demo />
    </React.Suspense>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));

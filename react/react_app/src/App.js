import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EventsChart from './EventChart';
import CustomHeatmapTable from './CustomHeatmapTable';
import Top20Chart from './Top20Chart';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<EventsChart />} />
        <Route path="/top20watchlistbyhour" element={<CustomHeatmapTable />} />
        <Route path="/top20Watchlist" element={<Top20Chart />} />
      </Routes>
    </Router>
  );
}

export default App;
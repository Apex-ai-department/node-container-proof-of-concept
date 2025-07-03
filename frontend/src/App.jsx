import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "rsuite/dist/rsuite-no-reset.min.css";
import "./global.css";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import DashboardPage from "./pages/Dashboard";

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/invoices" element={<DashboardPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

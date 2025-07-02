import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "rsuite/dist/rsuite-no-reset.min.css";
import "./global.css";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import InvoicesPage from "./pages/Invoices";

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/invoices" element={<InvoicesPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import LenisScroll from "./components/LenisScroll";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <LenisScroll>
    <App />
  </LenisScroll>
);

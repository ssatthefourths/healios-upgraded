import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import LenisScroll from "./components/LenisScroll";
import { runConsoleEasterEgg } from "./lib/consoleEasterEgg";
import "./index.css";

runConsoleEasterEgg();

createRoot(document.getElementById("root")!).render(
  <LenisScroll>
    <App />
  </LenisScroll>
);

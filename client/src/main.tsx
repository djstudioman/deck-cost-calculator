import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Console Easter egg — for the curious developer
const DECK_ART = `
%c
  ____  ____  ____  _  _     ____  __   ____  ____ 
 (  _ \\( ___)(  _ \\| )/ )   / ___)/  \\ / ___)(_  _)
  )(_) ))__)  )___/  (  <   \\___ \\  O )\\___ \\  )(  
 (____/(____)(__)  (_)\\_)   (____/\\__/ (____/ (__) 
  ____  __   __    ___  _  _  __    __  ____  __  __  ____ 
 / ___)(  ) / _\\  / __)/ )( \\(  )  / _\\(_  _)/  \\(  )(  _ \\
( (__  )(  /    \\( (__ ) \\/ (/ (_/\\/    \\ )( (  O ) )( )   /
 \\___)(__)  \\_/\\_/ \\___)\\_/\\_/\\____/\\_/\\_/(__) \\__/(__)(__) 

%c  2026 Pricing Data  |  Built with React + Tailwind + Recharts
  
  Hey there, fellow builder! Curious how this was made?
  It's all React 19, TypeScript, Framer Motion, and Recharts —
  with real 2026 regional cost data baked in.

  If you're building something similar, measure twice, cut once.

%c  https://deckcalc2026-axndupm8.manus.space
`;

console.log(
  DECK_ART,
  "color: #f59e0b; font-family: monospace; font-size: 10px; line-height: 1.4;",
  "color: #94a3b8; font-family: monospace; font-size: 11px; line-height: 1.6;",
  "color: #38bdf8; font-family: monospace; font-size: 11px;"
);

createRoot(document.getElementById("root")!).render(<App />);

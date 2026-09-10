import fs from 'fs';

// Generate exact vector logo matching user's uploaded image
const svg = `<svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g fill="#BE1E2F">
    <!-- Top-left horizontal ear / wing -->
    <rect x="75" y="155" width="145" height="66" rx="28" />

    <!-- Top horizontal main bar -->
    <rect x="150" y="90" width="148" height="66" rx="28" />

    <!-- Top-right upward stalk -->
    <rect x="352" y="90" width="73" height="131" rx="28" />

    <!-- Upper loop left wall -->
    <rect x="150" y="90" width="73" height="131" rx="28" />

    <!-- Center spine bar -->
    <rect x="153" y="219" width="194" height="62" rx="24" />

    <!-- Upper right shoulder connector block -->
    <rect x="290" y="155" width="135" height="66" rx="28" />

    <!-- Lower left shoulder connector block -->
    <rect x="75" y="279" width="135" height="66" rx="28" />

    <!-- Lower-left downward stalk -->
    <rect x="75" y="279" width="73" height="131" rx="28" />

    <!-- Bottom-right horizontal ear / wing -->
    <rect x="280" y="279" width="145" height="66" rx="28" />

    <!-- Bottom horizontal main bar -->
    <rect x="202" y="344" width="148" height="66" rx="28" />

    <!-- Lower loop right wall -->
    <rect x="277" y="279" width="73" height="131" rx="28" />
  </g>
</svg>`;

fs.writeFileSync('public/logo.svg', svg);
fs.writeFileSync('public/favicon.svg', svg);
console.log('Successfully wrote public/logo.svg and public/favicon.svg');

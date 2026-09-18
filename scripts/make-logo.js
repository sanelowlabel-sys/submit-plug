import fs from 'fs';

// Exact vector badge matching user's uploaded 1.png image
const svg = `<svg viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(-2.6 300 100)">
    <!-- Main green tilted rectangle banner matching website brand color -->
    <rect x="25" y="45" width="550" height="110" rx="4" fill="#1DB954" />
    
    <!-- Left white bullet dot -->
    <circle cx="78" cy="100" r="12" fill="#FFFFFF" />
    
    <!-- Bold PLAYLISTPLUG lettering -->
    <text 
      x="300" 
      y="114" 
      font-family="'Plus Jakarta Sans', 'Montserrat', 'Arial Black', sans-serif" 
      font-weight="900" 
      font-size="46" 
      fill="#FFFFFF" 
      text-anchor="middle" 
      letter-spacing="2"
      style="text-transform: uppercase;"
    >PLAYLISTPLUG</text>
    
    <!-- Right white bullet dot -->
    <circle cx="522" cy="100" r="12" fill="#FFFFFF" />
  </g>
</svg>`;

// Icon / Favicon version (square with the rotated green badge and PLUG mark)
const faviconSvg = `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" rx="44" fill="#121212" />
  <g transform="rotate(-3 100 100)">
    <rect x="15" y="60" width="170" height="80" rx="4" fill="#1DB954" />
    <circle cx="36" cy="100" r="8" fill="#FFFFFF" />
    <text 
      x="100" 
      y="108" 
      font-family="'Plus Jakarta Sans', 'Montserrat', 'Arial Black', sans-serif" 
      font-weight="900" 
      font-size="21" 
      fill="#FFFFFF" 
      text-anchor="middle" 
      letter-spacing="0.8"
    >PLAYLISTPLUG</text>
    <circle cx="164" cy="100" r="8" fill="#FFFFFF" />
  </g>
</svg>`;

fs.writeFileSync('public/logo.svg', svg);
fs.writeFileSync('public/favicon.svg', faviconSvg);
console.log('Successfully generated public/logo.svg and public/favicon.svg');

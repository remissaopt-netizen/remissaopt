// assets/mdi-icons.js
// This module imports the SVG paths for the Material Design Icons directly from @mdi/js,
// and renders them as standard SVG elements, completely bypassing React for maximum stability.

import { mdiInstagram, mdiWhatsapp, mdiChurch } from "https://esm.sh/@mdi/js";

function renderIcon(targetId, pathData) {
  const container = document.getElementById(targetId);
  if (!container) return;
  
  // Render a clean, standard SVG element using the requested gold highlight color.
  // The SVG viewBox for MDI is 0 0 24 24.
  container.innerHTML = `
    <svg viewBox="0 0 24 24" style="width: 2.2rem; height: 2.2rem; fill: var(--gold-light);">
      <path d="${pathData}" />
    </svg>
  `;
}

function initIcons() {
  // Original Instagram placeholder in header/cards
  renderIcon("instagramVue", mdiInstagram);
  
  // Contact section placeholders
  renderIcon("instagramReactContact", mdiInstagram);
  renderIcon("whatsappReactContact", mdiWhatsapp);
  renderIcon("churchReactContact", mdiChurch);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initIcons);
} else {
  initIcons();
}

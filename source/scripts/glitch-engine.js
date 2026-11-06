/**
 * Live Analogue Text Glitch & ASCII Corruption Engine
 * Simulates real-time CRT screen glitches, video game bugs, and character matrix building
 */

(function () {
  const glitchChars = "█░▓▒#@$%&*<>01!?:;+~=";

  function getRandomGlitchChar() {
    return glitchChars[Math.floor(Math.random() * glitchChars.length)];
  }

  // Live text glitcher that randomly corrupts characters as user reads
  function startLiveReadingGlitches() {
    const textNodes = [];

    // Target paragraphs and headings inside content sections
    document.querySelectorAll(".hero-subtitle, .about-text, .timeline-desc, .project-desc").forEach((container) => {
      textNodes.push(container);
    });

    setInterval(() => {
      if (textNodes.length === 0 || document.body.classList.contains("agent-building")) return;

      // Pick a random element
      const targetEl = textNodes[Math.floor(Math.random() * textNodes.length)];
      if (!targetEl || targetEl.dataset.glitching === "true") return;

      const originalText = targetEl.innerText;
      if (originalText.length < 5) return;

      targetEl.dataset.glitching = "true";

      // Pick a random index range to corrupt
      const startIdx = Math.floor(Math.random() * (originalText.length - 4));
      const corruptedCount = Math.floor(Math.random() * 4) + 2;

      let glitchStep = 0;
      const glitchInterval = setInterval(() => {
        let corruptedStr = "";
        for (let i = 0; i < originalText.length; i++) {
          if (i >= startIdx && i < startIdx + corruptedCount && originalText[i] !== " ") {
            corruptedStr += `<span class="matrix-char">${getRandomGlitchChar()}</span>`;
          } else {
            corruptedStr += originalText[i];
          }
        }

        targetEl.innerHTML = corruptedStr;
        glitchStep++;

        if (glitchStep > 3) {
          clearInterval(glitchInterval);
          targetEl.innerText = originalText;
          delete targetEl.dataset.glitching;
        }
      }, 70);
    }, 900); // Trigger glitch every 900ms
  }

  // Character-by-character CRT reveal animation
  function setupScrollTypewriterReveals() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            if (!el.dataset.revealed) {
              el.dataset.revealed = "true";
              typewriteReveal(el);
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll(".section-title").forEach((title) => {
      observer.observe(title);
    });
  }

  function typewriteReveal(el) {
    const fullText = el.getAttribute("data-original-text") || el.innerText;
    el.setAttribute("data-original-text", fullText);
    el.innerText = "";

    let currentLength = 0;
    const interval = setInterval(() => {
      currentLength += 2;
      let textSnippet = fullText.slice(0, currentLength);
      let glitchSuffix = getRandomGlitchChar() + getRandomGlitchChar();

      if (currentLength >= fullText.length) {
        clearInterval(interval);
        el.innerText = fullText;
      } else {
        el.innerHTML = textSnippet + `<span class="matrix-char">${glitchSuffix}</span>`;
      }
    }, 25);
  }

  function init() {
    startLiveReadingGlitches();
    setupScrollTypewriterReveals();
  }

  window.addEventListener("DOMContentLoaded", init);
})();

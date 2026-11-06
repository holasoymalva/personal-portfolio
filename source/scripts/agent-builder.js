/**
 * Multi-Agent Live Site Builder Engine
 * Simulates 24 autonomous AI design/code agents constructing and modifying the DOM
 * in real time with Figma-style wireframes, rulers, snap guides, and multi-cursors.
 */

(function () {
  const AGENT_COUNT = 24;
  const TOTAL_VIRTUAL_LAYERS = 381;

  const AGENT_COLORS = [
    "#38bdf8", // Sky Blue
    "#facc15", // Yellow
    "#f87171", // Coral Red
    "#4ade80", // Mint Green
    "#c084fc", // Purple
    "#fb923c", // Orange
    "#f472b6", // Pink
    "#ffffff", // Crisp White
    "#2dd4bf", // Teal
    "#60a5fa", // Figma Blue
  ];

  let overlayRoot = null;
  let guideCanvas = null;
  let guideCtx = null;
  let rulerTrack = null;
  let boxesContainer = null;
  let cursorsContainer = null;
  let hudBar = null;
  let hudLayerText = null;
  let hudProgressFill = null;
  let hudTourBtn = null;
  let hudSpeedBtn = null;

  let agents = [];
  let buildItems = [];
  let isBuilding = false;
  let isFinished = false;
  let speedMultiplier = 1;
  let autoTourActive = false;
  let animFrameId = null;
  let lastFrameTime = 0;
  let elapsedBuildTime = 0;
  let totalBuildDuration = 12500; // ms at 1x speed

  function init() {
    collectBuildTargets();
    createOverlayDOM();
    spawnAgents();
    startConstruction(false);

    window.addEventListener("resize", handleResize);
  }

  function collectBuildTargets() {
    const selectors = [
      // Header
      ".site-header .header-brand",
      ".site-header .menu-toggle-btn",
      // Hero
      ".hero-status-tag",
      ".hero-title",
      ".hero-subtitle",
      ".hero-actions .btn-primary",
      ".hero-actions .btn-secondary",
      // Marquee
      ".marquee-container",
      // About
      "#about .section-tag",
      "#about .section-title",
      "#about .about-card",
      "#about .about-text",
      "#about .social-pill",
      "#interactiveAvatar",
      // Experience
      "#experience .section-tag",
      "#experience .section-title",
      "#experience .timeline-content",
      "#experience .timeline-role",
      "#experience .timeline-company",
      "#experience .timeline-date",
      // Tech Stack
      "#tech .section-tag",
      "#tech .section-title",
      ".pixel-train-section",
      ".train-hint",
      // Projects (Granular like ShipRadar screenshot: image box + title + desc + tags)
      "#projects .section-tag",
      "#projects .section-title",
      ".project-img-wrapper",
      ".project-title",
      ".project-desc",
      ".project-tag",
      // Resources
      "#resources .section-tag",
      "#resources .section-title",
      ".resource-card",
      ".resource-icon",
      // Footer
      "#contact .section-tag",
      "#contact .footer-cta-title",
      "#contact .btn-primary",
    ];

    const rawElements = [];
    const seen = new Set();

    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el);
          rawElements.push(el);
        }
      });
    });

    // Sort top-to-bottom, left-to-right in document space
    rawElements.sort((a, b) => {
      const rA = a.getBoundingClientRect();
      const rB = b.getBoundingClientRect();
      const topA = rA.top + window.scrollY;
      const topB = rB.top + window.scrollY;
      if (Math.abs(topA - topB) > 28) return topA - topB;
      return rA.left - rB.left;
    });

    const count = rawElements.length;
    buildItems = rawElements.map((el, idx) => {
      const isText = el.matches(
        "h1, h2, p, .section-tag, .hero-status-tag, .timeline-role, .timeline-company, .timeline-date, .project-title, .project-desc, .about-text"
      );
      const isCard = el.matches(
        ".about-card, .timeline-content, .project-img-wrapper, .resource-card, .pixel-train-section, .marquee-container, #interactiveAvatar"
      );

      const normIdx = idx / Math.max(1, count - 1);
      // Stagger items across the timeline so there are always 4-10 items actively building simultaneously
      const startProgress = normIdx * 0.84;
      const durationProgress = isCard ? 0.16 : 0.13;

      return {
        id: idx,
        el,
        isText,
        isCard,
        startProgress,
        endProgress: Math.min(0.995, startProgress + durationProgress),
        localProgress: 0,
        state: "pending", // pending -> wireframe -> tweaking -> done
        boxEl: null,
      };
    });
  }

  function createOverlayDOM() {
    overlayRoot = document.createElement("div");
    overlayRoot.id = "agent-builder-overlay";
    overlayRoot.className = "agent-builder-overlay";

    // Top Ruler Bar
    const rulerBar = document.createElement("div");
    rulerBar.className = "ab-ruler-top";
    rulerTrack = document.createElement("div");
    rulerTrack.className = "ab-ruler-track";
    rulerBar.appendChild(rulerTrack);
    buildRulerTicks();

    // Guide Lines Canvas
    guideCanvas = document.createElement("canvas");
    guideCanvas.className = "ab-guide-canvas";
    guideCtx = guideCanvas.getContext("2d");

    // Bounding Boxes Layer
    boxesContainer = document.createElement("div");
    boxesContainer.className = "ab-boxes-layer";

    // Agent Cursors Layer
    cursorsContainer = document.createElement("div");
    cursorsContainer.className = "ab-cursors-layer";

    // Bottom Floating HUD Pill (matches screenshot)
    hudBar = document.createElement("div");
    hudBar.className = "ab-hud-pill";
    hudBar.innerHTML = `
      <div class="ab-hud-dots" aria-hidden="true">
        <span style="background:#f87171"></span>
        <span style="background:#38bdf8"></span>
        <span style="background:#4ade80"></span>
        <span style="background:#facc15"></span>
        <span style="background:#c084fc"></span>
      </div>
      <span class="ab-hud-agents">${AGENT_COUNT} agents</span>
      <span class="ab-hud-sep">|</span>
      <span class="ab-hud-layers" id="abHudLayers">1 / ${TOTAL_VIRTUAL_LAYERS} layers</span>
      <div class="ab-hud-progress" id="abHudProgress" title="Click to scrub build progress">
        <div class="ab-hud-progress-fill" id="abHudProgressFill"></div>
      </div>
      <button type="button" class="ab-hud-btn" id="abHudTourBtn" title="Auto-scroll tour / Replay build">Tour</button>
      <button type="button" class="ab-hud-btn" id="abHudSpeedBtn" title="Toggle build speed">1x</button>
      <button type="button" class="ab-hud-btn ab-hud-close" id="abHudCloseBtn" aria-label="Skip or close agent builder">&times;</button>
    `;

    overlayRoot.appendChild(rulerBar);
    overlayRoot.appendChild(guideCanvas);
    overlayRoot.appendChild(boxesContainer);
    overlayRoot.appendChild(cursorsContainer);
    document.body.appendChild(overlayRoot);
    document.body.appendChild(hudBar);

    hudLayerText = document.getElementById("abHudLayers");
    hudProgressFill = document.getElementById("abHudProgressFill");
    hudTourBtn = document.getElementById("abHudTourBtn");
    hudSpeedBtn = document.getElementById("abHudSpeedBtn");
    const closeBtn = document.getElementById("abHudCloseBtn");
    const progressTrack = document.getElementById("abHudProgress");

    hudTourBtn.addEventListener("click", () => {
      if (isFinished) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        startConstruction(true);
      } else {
        autoTourActive = !autoTourActive;
        hudTourBtn.classList.toggle("active", autoTourActive);
      }
    });

    hudSpeedBtn.addEventListener("click", () => {
      if (speedMultiplier === 1) speedMultiplier = 2;
      else if (speedMultiplier === 2) speedMultiplier = 4;
      else speedMultiplier = 1;
      hudSpeedBtn.textContent = `${speedMultiplier}x`;
    });

    closeBtn.addEventListener("click", () => {
      completeAllImmediately();
      hudBar.classList.add("ab-hud-minimized");
    });

    progressTrack.addEventListener("click", (e) => {
      const rect = progressTrack.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (isFinished) {
        startConstruction(false);
      }
      elapsedBuildTime = ratio * totalBuildDuration;
      buildItems.forEach((item) => {
        if (ratio < item.endProgress) {
          item.localProgress = 0;
          item.state = "pending";
        }
      });
    });

    handleResize();
  }

  function buildRulerTicks() {
    if (!rulerTrack) return;
    rulerTrack.innerHTML = "";
    const width = Math.max(window.innerWidth, 2400);
    for (let x = 0; x <= width; x += 100) {
      const tick = document.createElement("div");
      tick.className = "ab-ruler-tick";
      tick.style.left = `${x}px`;
      if (x % 200 === 0) {
        tick.innerHTML = `<span>${x}</span>`;
      }
      rulerTrack.appendChild(tick);
    }
  }

  function handleResize() {
    if (!guideCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    guideCanvas.width = window.innerWidth * dpr;
    guideCanvas.height = window.innerHeight * dpr;
    guideCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnAgents() {
    cursorsContainer.innerHTML = "";
    agents = [];

    for (let i = 0; i < AGENT_COUNT; i++) {
      const color = AGENT_COLORS[i % AGENT_COLORS.length];
      const hasTrail = i % 5 === 0;
      const hasTypeBadge = i % 7 === 1;

      const el = document.createElement("div");
      el.className = "ab-agent-cursor";
      if (hasTrail) el.classList.add("has-ghost-trail");

      let badgeHTML = "";
      if (hasTypeBadge) {
        badgeHTML = `<span class="ab-cursor-badge" style="color:${color}">AAA</span>`;
      } else if (i % 6 === 2) {
        badgeHTML = `<span class="ab-cursor-crosshair">+</span>`;
      } else if (i % 8 === 3) {
        badgeHTML = `<span class="ab-cursor-ibeam">I</span>`;
      }

      el.innerHTML = `
        ${
          hasTrail
            ? `<svg class="ab-cursor-ghost g2" viewBox="0 0 24 24" width="18" height="18"><path d="M3 2L10.5 20.5L13.8 13.8L20.5 10.5L3 2Z" fill="${color}" stroke="#000" stroke-width="1.5"/></svg>
               <svg class="ab-cursor-ghost g1" viewBox="0 0 24 24" width="18" height="18"><path d="M3 2L10.5 20.5L13.8 13.8L20.5 10.5L3 2Z" fill="${color}" stroke="#000" stroke-width="1.5"/></svg>`
            : ""
        }
        <svg class="ab-cursor-svg" viewBox="0 0 24 24" width="18" height="18">
          <path d="M3 2L10.5 20.5L13.8 13.8L20.5 10.5L3 2Z" fill="${color}" stroke="#090a0f" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>
        ${badgeHTML}
      `;

      cursorsContainer.appendChild(el);

      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight;

      agents.push({
        id: i,
        el,
        color,
        x: startX,
        y: startY,
        targetX: startX,
        targetY: startY,
        cornerIndex: i % 4,
        phaseOffset: Math.random() * Math.PI * 2,
        speed: 0.09 + Math.random() * 0.09,
        retargetTimer: 0,
      });
    }
  }

  function createWireframeBox(item) {
    const box = document.createElement("div");
    box.className = `ab-wireframe-box ${item.isCard ? "is-card-box" : "is-elem-box"} ${
      item.isText ? "is-text-box" : ""
    }`;

    let nestedHTML = "";
    if (item.isCard) {
      nestedHTML = `
        <div class="ab-nested-frame nf-2">
          <span class="ab-dim-pill ab-dim-sub"></span>
          <span class="ab-corner-plus">+</span>
        </div>
        <div class="ab-nested-frame nf-1">
          <span class="ab-dim-pill ab-dim-sub"></span>
          <span class="ab-corner-plus">+</span>
        </div>
      `;
    }

    box.innerHTML = `
      ${nestedHTML}
      <div class="ab-main-frame">
        <span class="ab-handle tl"></span>
        <span class="ab-handle tr"></span>
        <span class="ab-handle bl"></span>
        <span class="ab-handle br"></span>
        <span class="ab-dim-pill ab-dim-main">0 × 0</span>
        ${item.isText ? `<span class="ab-text-caret">I</span>` : `<span class="ab-corner-plus">+</span>`}
      </div>
    `;

    boxesContainer.appendChild(box);
    item.boxEl = box;
  }

  function startConstruction(withAutoTour) {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    isBuilding = true;
    isFinished = false;
    autoTourActive = !!withAutoTour;
    elapsedBuildTime = 0;
    lastFrameTime = performance.now();

    document.body.classList.add("agent-building");
    overlayRoot.classList.remove("ab-overlay-hidden");
    hudBar.classList.remove("ab-hud-minimized");
    if (hudTourBtn) {
      hudTourBtn.textContent = "Tour";
      hudTourBtn.classList.toggle("active", autoTourActive);
    }

    boxesContainer.innerHTML = "";

    buildItems.forEach((item) => {
      item.state = "pending";
      item.localProgress = 0;
      item.boxEl = null;
      item.el.classList.add("ab-target-unbuilt", "pixel-constructed");
      item.el.classList.remove("ab-target-building", "ab-target-built");
      item.el.style.clipPath = "";
      item.el.style.opacity = "";
      item.el.style.transform = "";
    });

    animFrameId = requestAnimationFrame(tick);
  }

  function completeAllImmediately() {
    isBuilding = false;
    isFinished = true;
    autoTourActive = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);

    document.body.classList.remove("agent-building");
    overlayRoot.classList.add("ab-overlay-hidden");
    boxesContainer.innerHTML = "";
    if (guideCtx) {
      guideCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    buildItems.forEach((item) => {
      item.state = "done";
      item.localProgress = 1;
      item.boxEl = null;
      item.el.classList.remove("ab-target-unbuilt", "ab-target-building");
      item.el.classList.add("ab-target-built", "pixel-constructed");
      item.el.style.clipPath = "";
      item.el.style.opacity = "";
      item.el.style.transform = "";
    });

    if (hudLayerText) {
      hudLayerText.textContent = `${TOTAL_VIRTUAL_LAYERS} / ${TOTAL_VIRTUAL_LAYERS} layers`;
    }
    if (hudProgressFill) {
      hudProgressFill.style.width = "100%";
    }
    if (hudTourBtn) {
      hudTourBtn.textContent = "Replay";
      hudTourBtn.classList.remove("active");
    }
  }

  function tick(now) {
    if (!isBuilding) return;

    const dt = Math.min(64, now - lastFrameTime);
    lastFrameTime = now;

    elapsedBuildTime += dt * speedMultiplier;
    const globalProgress = Math.min(1, elapsedBuildTime / totalBuildDuration);

    const activeRects = updateBuildItems(globalProgress, dt);
    updateHUD(globalProgress);
    updateAutoTour(activeRects, globalProgress);
    updateAgents(activeRects, now, dt);
    renderGuidesAndRulers(activeRects);

    if (globalProgress >= 1 && activeRects.length === 0) {
      setTimeout(() => {
        if (isBuilding && elapsedBuildTime >= totalBuildDuration) {
          completeAllImmediately();
        }
      }, 350);
      return;
    }

    animFrameId = requestAnimationFrame(tick);
  }

  function updateHUD(progress) {
    const currentLayer = Math.max(
      1,
      Math.min(
        TOTAL_VIRTUAL_LAYERS,
        Math.round(progress * TOTAL_VIRTUAL_LAYERS)
      )
    );
    if (hudLayerText) {
      hudLayerText.textContent = `${currentLayer} / ${TOTAL_VIRTUAL_LAYERS} layers`;
    }
    if (hudProgressFill) {
      hudProgressFill.style.width = `${(progress * 100).toFixed(1)}%`;
    }
  }

  function updateBuildItems(globalProgress, dt) {
    const activeRects = [];
    const vh = window.innerHeight;

    // Count how many visible items are currently active so we can wake up viewport items if the user scrolls manually!
    let visibleActiveCount = 0;

    for (let i = 0; i < buildItems.length; i++) {
      const item = buildItems[i];
      if (item.state === "done") continue;

      const rect = item.el.getBoundingClientRect();
      const inViewport = rect.bottom > -40 && rect.top < vh + 40;

      // Start building if global timeline reached startProgress OR if element is currently in viewport and we need active targets
      const shouldStartByTimeline = globalProgress >= item.startProgress;
      const shouldStartByViewport =
        inViewport && visibleActiveCount < 8 && globalProgress > 0.02;

      if (item.state === "pending" && (shouldStartByTimeline || shouldStartByViewport)) {
        item.state = "wireframe";
        item.localProgress = 0.01;
        if (!item.boxEl) {
          createWireframeBox(item);
        }
      }

      if (item.state === "wireframe" || item.state === "tweaking") {
        if (inViewport) visibleActiveCount++;

        // Advance item's local construction progress
        const itemDurationMs = item.isCard ? 2100 : 1550;
        item.localProgress += (dt * speedMultiplier) / itemDurationMs;

        if (item.localProgress >= 1) {
          item.state = "done";
          item.localProgress = 1;
          item.el.classList.remove("ab-target-unbuilt", "ab-target-building");
          item.el.classList.add("ab-target-built", "pixel-constructed");
          item.el.style.clipPath = "";
          item.el.style.opacity = "";
          item.el.style.transform = "";
          if (item.boxEl) {
            item.boxEl.classList.add("ab-box-fading");
            const boxToRemove = item.boxEl;
            item.boxEl = null;
            setTimeout(() => boxToRemove.remove(), 250);
          }
          continue;
        }

        const localP = Math.min(1, item.localProgress);
        item.state = localP < 0.45 ? "wireframe" : "tweaking";
        item.el.classList.remove("ab-target-unbuilt");
        item.el.classList.add("ab-target-building");

        // Progressive DOM reveal while agents build it
        if (item.isText) {
          const revealPct = Math.min(100, Math.max(6, localP * 112));
          item.el.style.opacity = String(Math.min(1, 0.3 + localP * 0.85));
          item.el.style.clipPath = `polygon(0 0, ${revealPct.toFixed(1)}% 0, ${revealPct.toFixed(1)}% 100%, 0 100%)`;
        } else {
          const easeP = 1 - Math.pow(1 - localP, 3);
          item.el.style.opacity = String(Math.max(0.14, easeP));
          const shiftY = (1 - easeP) * 12;
          const scale = 0.96 + easeP * 0.04;
          item.el.style.transform = `translate3d(0, ${shiftY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        }

        if (inViewport && rect.width > 4 && rect.height > 4 && item.boxEl) {
          item.boxEl.style.display = "block";

          const boxGrow = Math.min(1, 0.62 + localP * 0.55);
          const w = Math.round(rect.width * (item.isCard ? boxGrow : 1));
          const h = Math.round(rect.height * (item.isCard ? boxGrow : 1));

          item.boxEl.style.transform = `translate3d(${rect.left.toFixed(1)}px, ${rect.top.toFixed(1)}px, 0)`;
          item.boxEl.style.width = `${w}px`;
          item.boxEl.style.height = `${h}px`;
          item.boxEl.classList.toggle("is-solidifying", localP > 0.52);

          const mainDim = item.boxEl.querySelector(".ab-dim-main");
          if (mainDim) {
            mainDim.textContent = `${w} × ${h}`;
          }

          if (item.isCard) {
            const subDims = item.boxEl.querySelectorAll(".ab-dim-sub");
            if (subDims[0])
              subDims[0].textContent = `${Math.max(20, w - 24)} × ${Math.max(20, h - 18)}`;
            if (subDims[1])
              subDims[1].textContent = `${Math.max(20, w - 48)} × ${Math.max(20, h - 36)}`;
          }

          activeRects.push({
            item,
            left: rect.left,
            top: rect.top,
            width: w,
            height: h,
            right: rect.left + w,
            bottom: rect.top + h,
            localP,
          });
        } else if (item.boxEl) {
          item.boxEl.style.display = "none";
        }
      }
    }

    return activeRects;
  }

  function updateAutoTour(activeRects, progress) {
    if (!autoTourActive) return;

    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const desiredScroll = progress * maxScroll;
    const diff = desiredScroll - window.scrollY;

    if (Math.abs(diff) > 4) {
      window.scrollBy({
        top: diff * 0.08 * speedMultiplier,
        behavior: "instant",
      });
    }
  }

  function updateAgents(activeRects, now, dt) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    agents.forEach((agent, idx) => {
      agent.retargetTimer -= dt;

      if (activeRects.length > 0) {
        const assignedRect = activeRects[idx % activeRects.length];

        if (agent.retargetTimer <= 0) {
          agent.retargetTimer = 160 + Math.random() * 320;
          agent.cornerIndex = (agent.cornerIndex + 1) % 5;
        }

        let tx = assignedRect.left;
        let ty = assignedRect.top;

        if (assignedRect.item.isText) {
          const caretX =
            assignedRect.left +
            assignedRect.width * Math.min(1, assignedRect.localP * 1.08);
          if (idx % 2 === 0) {
            tx = caretX + Math.sin(now * 0.015 + agent.phaseOffset) * 10;
            ty = assignedRect.top + assignedRect.height * 0.55;
          } else {
            tx = assignedRect.left + (idx % 3) * (assignedRect.width * 0.45);
            ty = assignedRect.bottom;
          }
        } else {
          switch (agent.cornerIndex) {
            case 0:
              tx = assignedRect.left;
              ty = assignedRect.top;
              break;
            case 1:
              tx = assignedRect.right;
              ty = assignedRect.top;
              break;
            case 2:
              tx = assignedRect.right;
              ty = assignedRect.bottom;
              break;
            case 3:
              tx = assignedRect.left;
              ty = assignedRect.bottom;
              break;
            default:
              tx = assignedRect.left + assignedRect.width * 0.5;
              ty = assignedRect.top + assignedRect.height * 0.5;
              break;
          }

          tx += Math.cos(now * 0.009 + agent.phaseOffset) * 14;
          ty += Math.sin(now * 0.011 + agent.phaseOffset) * 14;
        }

        agent.targetX = Math.max(16, Math.min(vw - 24, tx));
        agent.targetY = Math.max(26, Math.min(vh - 24, ty));
      } else {
        if (agent.retargetTimer <= 0) {
          agent.retargetTimer = 350 + Math.random() * 450;
          agent.targetX = 60 + Math.random() * (vw - 120);
          agent.targetY = 60 + Math.random() * (vh - 120);
        }
      }

      const lerp = Math.min(0.36, agent.speed * speedMultiplier);
      agent.x += (agent.targetX - agent.x) * lerp;
      agent.y += (agent.targetY - agent.y) * lerp;

      agent.el.style.transform = `translate3d(${agent.x.toFixed(1)}px, ${agent.y.toFixed(1)}px, 0)`;
    });
  }

  function renderGuidesAndRulers(activeRects) {
    if (!guideCtx) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    guideCtx.clearRect(0, 0, vw, vh);

    // 1. Master Left Alignment Red Snap Line (matches the red vertical line in all 4 screenshots)
    const firstContainer = document.querySelector(".hero-section, .content-section");
    let redLineX = vw * 0.06;
    if (firstContainer) {
      const cRect = firstContainer.getBoundingClientRect();
      const padLeft = parseFloat(window.getComputedStyle(firstContainer).paddingLeft) || 0;
      redLineX = Math.max(24, cRect.left + padLeft);
    }

    guideCtx.save();
    guideCtx.strokeStyle = "rgba(239, 68, 68, 0.9)";
    guideCtx.lineWidth = 1.5;
    guideCtx.shadowColor = "rgba(239, 68, 68, 0.7)";
    guideCtx.shadowBlur = 6;
    guideCtx.beginPath();
    guideCtx.moveTo(redLineX, 0);
    guideCtx.lineTo(redLineX, vh);
    guideCtx.stroke();
    guideCtx.restore();

    drawCrosshair(guideCtx, redLineX, vh - 42, "#ffffff");

    // 2. Blue Layout Guides & Ruler Projections for Active Rects
    const maxGuides = Math.min(activeRects.length, 8);
    for (let i = 0; i < maxGuides; i++) {
      const r = activeRects[i];

      // Top ruler blue projection bar highlight
      guideCtx.fillStyle = "rgba(24, 160, 251, 0.42)";
      guideCtx.fillRect(r.left, 0, r.width, 20);
      guideCtx.strokeStyle = "#38bdf8";
      guideCtx.lineWidth = 1;
      guideCtx.strokeRect(r.left, 0.5, r.width, 19);

      // Extended vertical & horizontal Figma-blue guide lines
      guideCtx.strokeStyle = "rgba(24, 160, 251, 0.52)";
      guideCtx.lineWidth = 1;

      guideCtx.beginPath();
      guideCtx.moveTo(r.left, 20);
      guideCtx.lineTo(r.left, Math.min(vh, r.bottom + 90));

      guideCtx.moveTo(r.right, 20);
      guideCtx.lineTo(r.right, Math.min(vh, r.bottom + 60));

      guideCtx.moveTo(0, r.top);
      guideCtx.lineTo(Math.min(vw, r.right + 80), r.top);

      guideCtx.moveTo(0, r.bottom);
      guideCtx.lineTo(Math.min(vw, r.right + 80), r.bottom);
      guideCtx.stroke();

      drawCrosshair(guideCtx, redLineX, r.top, "#ffffff");
      drawCrosshair(guideCtx, redLineX, r.bottom, "#ffffff");
    }
  }

  function drawCrosshair(ctx, x, y, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 4, y);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.stroke();
    ctx.restore();
  }

  window.addEventListener("DOMContentLoaded", init);

  window.triggerAgentBuilder = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    startConstruction(true);
  };
})();

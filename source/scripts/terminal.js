/**
 * Retro Arcade CRT Developer Terminal (~/arcade)
 * Green Phosphor monitor experience with auto-printing Resume Summary, Stack & Links
 */

(function () {
  let modal, input, output, closeBtn;

  const resumeSummary = `
===================================================================
 [SYS_BOOT] MARTIN MANRIQUEZ (@holasoymalva) — RESUME SUMMARY
===================================================================

[PROFILE]
  Name     : Martin Manriquez (@holasoymalva)
  Role     : Senior Software Engineer & Tech Architect
  Location : Mexico City (CDMX)
  Email    : contact@holasoymalva.com
  LinkedIn : https://www.linkedin.com/in/martin-manriquez/
  GitHub   : https://github.com/holasoymalva

[CAREER & EXPERIENCE HISTORY]
  • Nexcar AI       (Feb 2026 — Present) | Forward Deployed Engineer (FDE)
    - Engineering AI-driven software, process automation & intelligent platform architecture.
  • Ada             (Dec 2025 — May 2026)| Google Prep Interview Instructor
    - Mentoring algorithms, data structures & tech interview prep for engineers.
  • BlackLine       (Jan 2024 — Jan 2026)| Senior Software Engineer
    - Provided technical expertise in the design & delivery of cloud platforms.
  • Amazon          (Feb 2023 — Apr 2023)| Software Engineer (Prime Music)
    - Golang & Node.js internal platform services, framework migrations & AWS deployments.
  • Guros           (2022 — 2023)        | Tech Lead
    - Led core engineering, digital insurance architecture & releases.
  • Globant         (2021 — 2023)        | Sr Software Engineer (Disney / Appetize)
    - Angular, Vue.js, Node.js & Java microservices for Disney and Appetize.
  • Coderhouse      (Sept 2021 — Feb 2023)| Programming Teacher
    - Taught React, Angular, TypeScript & modern web development curriculum.
  • HeyGrows        (2021 — 2022)        | Product Manager & Co-Founder
    - Product strategy, telemetry analysis & technical execution.
  • Grupo Salinas   (Sept 2019 — Feb 2021)| Software Engineer
    - Python Flask & Angular financial assistant, Messenger platform API & Oracle DB.
  • Meta DevC CDMX  (2019 — 2021)        | Co-Dev Lead
    - Community leader, workshops, hackathons & tech ecosystem growth.

[ENGINEERING TOOLKIT]
  • Languages : Python, JavaScript, TypeScript, Golang, Erlang, Java
  • Stack     : React.js, Vue.js, Angular, Django, Flask, Node.js
  • 3D/AI/CLI : Three.js, WebGL, DeepSeek AI, Spark AR, Docker, Xcode, Figma

===================================================================
Type 'help' for command list, or type 'matrix' for CRT rain!
===================================================================
`;

  const commands = {
    help: `
[RETRO ARCADE COMMANDS]
  - resume     : Display full structured CV & summary
  - stack      : Core technical languages & frameworks
  - exp        : Complete career company history
  - contact    : Email, LinkedIn & GitHub profiles
  - matrix     : Trigger 8-bit CRT matrix downfall
  - sudo hire  : Express recruiter intent 🎮
  - clear      : Clear CRT screen
`,
    resume: resumeSummary,
    stack: `
[CORE TECH STACK]
  • Python (Django, Flask, AI Data Services)
  • JavaScript & TypeScript (React, Vue, Angular, Node.js)
  • Golang & Erlang (Distributed Systems)
  • WebGL 3D (Three.js, Canvas Shader, Spark AR)
  • Tools (Docker, Git, Xcode, Figma, Linux)
`,
    exp: `
[CAREER HISTORY]
  1. Nexcar AI (Feb 2026-Present) — Forward Deployed Engineer (FDE)
  2. Ada (Dec 2025-May 2026) — Google Prep Interview Instructor
  3. BlackLine (Jan 2024-Jan 2026) — Senior Software Engineer
  4. Amazon (Feb 2023-Apr 2023) — Software Engineer (Prime Music)
  5. Guros (2022-2023) — Tech Lead
  6. Globant (2021-2023) — Sr Software Engineer (Disney / Appetize)
  7. Coderhouse (Sept 2021-Feb 2023) — Programming Teacher
  8. HeyGrows (2021-2022) — Co-Founder & PM
  9. Grupo Salinas (Sept 2019-Feb 2021) — Software Engineer
  10. Meta DevC CDMX (2019-2021) — Co-Dev Lead
`,
    contact: `
[DIRECT CONTACT FREQUENCY]
  • LinkedIn : https://www.linkedin.com/in/martin-manriquez/
  • GitHub   : https://github.com/holasoymalva
  • Email    : contact@holasoymalva.com
  • X/Twitter: https://twitter.com/holasoymalva
`,
    "sudo hire": `
[INSERT COIN] High Priority Intent Received! 🪙
Martin has been notified directly at contact@holasoymalva.com!
`,
  };

  function init() {
    modal = document.getElementById("terminalModal");
    input = document.getElementById("terminalInput");
    output = document.getElementById("terminalOutput");
    closeBtn = document.getElementById("terminalClose");
    const triggers = document.querySelectorAll(".terminal-trigger");

    if (!modal || !input || !output) return;

    triggers.forEach((trig) => {
      trig.addEventListener("click", openTerminal);
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", closeTerminal);
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeTerminal();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const cmd = input.value.trim().toLowerCase();
        handleCommand(cmd);
        input.value = "";
      }
    });
  }

  function openTerminal() {
    modal.classList.add("active");
    if (output) {
      output.innerHTML = "";
      appendLine(resumeSummary);
    }
    input.focus();
    if (window.playLevelUp) window.playLevelUp();
  }

  function closeTerminal() {
    modal.classList.remove("active");
  }

  function handleCommand(cmd) {
    appendLine(`~/arcade $ ${cmd}`, "terminal-prompt");

    if (cmd === "") return;

    if (cmd === "clear") {
      output.innerHTML = "";
      return;
    }

    if (cmd === "matrix") {
      appendLine("Initiating 8-bit CRT matrix sequence...", "highlight");
      triggerMatrixEffect();
      return;
    }

    if (commands[cmd]) {
      appendLine(commands[cmd]);
    } else if (cmd.startsWith("sudo hire")) {
      appendLine(commands["sudo hire"]);
    } else {
      appendLine(`Command not recognized: '${cmd}'. Type 'help' for options.`, "error");
    }

    output.scrollTop = output.scrollHeight;
  }

  function appendLine(text, className = "") {
    const line = document.createElement("div");
    line.className = className;
    line.textContent = text;
    output.appendChild(line);
  }

  function triggerMatrixEffect() {
    let count = 0;
    const chars = "010101010101010101ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%*<>~";
    const interval = setInterval(() => {
      let str = "";
      for (let i = 0; i < 40; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
      }
      appendLine(str, "matrix-line");
      output.scrollTop = output.scrollHeight;
      count++;
      if (count > 25) clearInterval(interval);
    }, 40);
  }

  window.addEventListener("DOMContentLoaded", init);
})();

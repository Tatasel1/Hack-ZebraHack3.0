document.addEventListener("DOMContentLoaded", () => {
    const title = document.getElementById("welcome-text");
    const enterBtn = document.getElementById("enter-btn");
    const mainPage = document.getElementById("main-page");
    const overlay = document.getElementById("transition-overlay");
    const siteContent = document.getElementById("site-content");
  
    const DROP_BASE_DELAY = 0.8;
    const DROP_STEP = 0.08;
    const DROP_DUR = 1.8;
    const HOLD_AFTER_DROP = 0.4;
    const SPLIT_DUR = 1.8;
  
    //pentru delay-uri
    function wrapLetters(el) {
      let idx = 0;
      const frag = document.createDocumentFragment();
      const nodes = [...el.childNodes];
  
      nodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.nodeValue || "";
          for (const ch of text) {
            if (ch === " ") {
              frag.appendChild(document.createTextNode(" "));
            } else if (ch === "\n") {
              frag.appendChild(document.createElement("br"));
            } else {
              const sp = document.createElement("span");
              sp.textContent = ch;
              sp.style.setProperty("--i", idx++);
              frag.appendChild(sp);
            }
          }
          return;
        }
  
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
          frag.appendChild(document.createElement("br"));
          return;
        }
  
        if (node.nodeType === Node.ELEMENT_NODE) {
          const fallbackText = node.textContent || "";
          for (const ch of fallbackText) {
            if (ch === " ") {
              frag.appendChild(document.createTextNode(" "));
            } else {
              const sp = document.createElement("span");
              sp.textContent = ch;
              sp.style.setProperty("--i", idx++);
              frag.appendChild(sp);
            }
          }
        }
      });
  
      el.innerHTML = "";
      el.appendChild(frag);
      return idx; 
    }
  
    function resetIntroState() {
      title.classList.remove("split-active");
  
      enterBtn.classList.remove("btn-visible");
      enterBtn.classList.add("btn-hidden");
      enterBtn.disabled = true;
  
      overlay.classList.remove("overlay-on");
      mainPage.classList.remove("intro-hidden");
  
      siteContent.classList.remove("intro-visible");
    }
  
    function runAnim() {
      resetIntroState();
  
      const n = wrapLetters(title);
  
      const dropEnd =
        DROP_BASE_DELAY + Math.max(0, n - 1) * DROP_STEP + DROP_DUR;
  
      window.setTimeout(() => {
        title.classList.add("split-active");
      }, (dropEnd + HOLD_AFTER_DROP) * 1000);
  
      window.setTimeout(() => {
        enterBtn.disabled = false;
        enterBtn.classList.remove("btn-hidden");
        enterBtn.classList.add("btn-visible");
      }, (dropEnd + HOLD_AFTER_DROP + SPLIT_DUR) * 1000);
    }
  
    function enterSite() {
      overlay.classList.add("overlay-on");
  
      setTimeout(() => {
        mainPage.classList.add("intro-hidden");
  
        siteContent.classList.remove("intro-hidden");
        siteContent.classList.add("intro-visible");
      }, 250);
    }
  
    runAnim();
  
    enterBtn.addEventListener("click", enterSite);
  });
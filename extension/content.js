(() => {
  if (window.__magneticCursorLoaded) return;
  window.__magneticCursorLoaded = true;

  const state = {
    enabled: true,
    rawPoint: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    snappedPoint: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    target: null,
    lastToastAt: 0,
    settings: {
      snapRadius: 180,
      releaseRadius: 220,
      hysteresisMargin: 40,
    },
  };

  const overlay = document.createElement("div");
  overlay.className = "magnetic-cursor-overlay";

  const dot = document.createElement("div");
  dot.className = "magnetic-cursor-dot";

  const ring = document.createElement("div");
  ring.className = "magnetic-cursor-ring";

  overlay.appendChild(ring);
  overlay.appendChild(dot);
  document.documentElement.appendChild(overlay);

  const toast = document.createElement("div");
  toast.className = "magnetic-cursor-toast";
  toast.textContent = "Magnetic Cursor: On";
  document.documentElement.appendChild(toast);

  const candidatesSelector = [
    "button",
    "a[href]",
    "input",
    "select",
    "textarea",
    "[role='button']",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  const isVisible = (el) => {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const isDisabled = (el) => {
    if (!el) return true;
    if (el.hasAttribute("disabled")) return true;
    if (el.getAttribute("aria-disabled") === "true") return true;
    return false;
  };

  const distance = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  };

  const centerOf = (el) => {
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  const findBestTarget = (point, currentTarget) => {
    const elements = Array.from(document.querySelectorAll(candidatesSelector));
    let best = null;
    let bestScore = Infinity;

    for (const el of elements) {
      if (!isVisible(el) || isDisabled(el)) continue;
      const center = centerOf(el);
      const d = distance(point, center);
      if (d < bestScore) {
        bestScore = d;
        best = el;
      }
    }

    const { snapRadius, releaseRadius, hysteresisMargin } = state.settings;

    const currentIsValid =
      currentTarget && isVisible(currentTarget) && !isDisabled(currentTarget);
    const currentCenter = currentIsValid ? centerOf(currentTarget) : null;
    const currentDistance = currentCenter ? distance(point, currentCenter) : Infinity;

    if (currentIsValid && currentDistance <= releaseRadius) {
      if (!best || bestScore + hysteresisMargin >= currentDistance) {
        return { element: currentTarget, point: currentCenter };
      }
    }

    if (best && bestScore <= snapRadius) {
      return { element: best, point: centerOf(best) };
    }

    return { element: null, point };
  };

  const updateOverlay = () => {
    dot.style.left = `${state.snappedPoint.x}px`;
    dot.style.top = `${state.snappedPoint.y}px`;
    ring.style.left = `${state.snappedPoint.x}px`;
    ring.style.top = `${state.snappedPoint.y}px`;
  };

  const setTarget = (nextTarget) => {
    if (state.target === nextTarget) return;
    if (state.target) {
      state.target.classList.remove("magnetic-cursor-target");
    }
    state.target = nextTarget;
    if (state.target) {
      state.target.classList.add("magnetic-cursor-target");
    }
  };

  const maybeToast = (message) => {
    const now = Date.now();
    if (now - state.lastToastAt < 800) return;
    state.lastToastAt = now;
    toast.textContent = message;
    toast.style.opacity = "1";
    setTimeout(() => {
      toast.style.opacity = "0";
    }, 800);
  };

  const tick = () => {
    if (!state.enabled) {
      overlay.style.display = "none";
      setTarget(null);
      return;
    }

    overlay.style.display = "block";
    const result = findBestTarget(state.rawPoint, state.target);
    setTarget(result.element);
    state.snappedPoint = result.point;
    updateOverlay();
  };

  const scheduleTick = (() => {
    let scheduled = false;
    return () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        tick();
      });
    };
  })();

  window.addEventListener("mousemove", (event) => {
    if (!state.enabled) return;
    state.rawPoint = { x: event.clientX, y: event.clientY };
    scheduleTick();
  });

  window.addEventListener("scroll", scheduleTick, { passive: true });
  window.addEventListener("resize", scheduleTick);

  const isEditableTarget = (el) => {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    if (["input", "textarea", "select"].includes(tag)) return true;
    return el.isContentEditable;
  };

  const triggerClick = () => {
    if (!state.enabled || !state.target) return;
    if (isDisabled(state.target)) return;
    state.target.click();
    maybeToast("Magnetic Cursor: Click");
  };

  window.addEventListener("keydown", (event) => {
    const activeElement = document.activeElement;
    if (isEditableTarget(activeElement)) return;

    if (event.ctrlKey && event.shiftKey && event.code === "KeyM") {
      state.enabled = !state.enabled;
      toast.textContent = `Magnetic Cursor: ${state.enabled ? "On" : "Off"}`;
      toast.style.opacity = "1";
      setTimeout(() => {
        toast.style.opacity = "0";
      }, 1200);
      event.preventDefault();
      scheduleTick();
      return;
    }

    if (event.code === "Space") {
      triggerClick();
      event.preventDefault();
    }
  });

  const defaults = {
    snapRadius: 180,
    releaseRadius: 220,
    hysteresisMargin: 40,
  };

  const loadSettings = () => {
    if (!chrome?.storage?.sync) return;
    chrome.storage.sync.get(defaults, (settings) => {
      state.settings = { ...defaults, ...settings };
      scheduleTick();
    });
  };

  const handleSettingsChange = (changes, area) => {
    if (area !== "sync") return;
    const next = { ...state.settings };
    Object.keys(changes).forEach((key) => {
      next[key] = changes[key].newValue;
    });
    state.settings = { ...next };
    scheduleTick();
  };

  if (chrome?.storage?.sync) {
    chrome.storage.onChanged.addListener(handleSettingsChange);
  }

  loadSettings();
  scheduleTick();
})();

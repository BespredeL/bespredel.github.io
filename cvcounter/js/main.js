(() => {
    "use strict";

    function initNav() {
        const toggle = document.querySelector("[data-nav-toggle]");
        const menu = document.getElementById("nav-menu");
        if (!toggle || !menu) return;

        toggle.addEventListener("click", () => {
            const open = menu.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", String(open));
        });

        menu.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                menu.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    function initReveal() {
        const nodes = document.querySelectorAll(".reveal");
        if (!nodes.length) return;

        if (!("IntersectionObserver" in window)) {
            nodes.forEach((n) => n.classList.add("is-visible"));
            return;
        }

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        io.unobserve(entry.target);
                    }
                });
            },
            {rootMargin: "0px 0px -8% 0px", threshold: 0.12}
        );

        nodes.forEach((n) => io.observe(n));
    }

    function initLightbox() {
        const targets = document.querySelectorAll(
            ".shot__frame img, .shot > img, .gallery-board img"
        );
        if (!targets.length) return;

        const overlay = document.createElement("div");
        overlay.className = "lightbox";
        overlay.hidden = true;
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-label", "Image preview");
        overlay.innerHTML =
            '<button type="button" class="lightbox__close" aria-label="Close">&times;</button>' +
            '<figure class="lightbox__figure">' +
            '<img class="lightbox__img" alt="">' +
            '<figcaption class="lightbox__cap"></figcaption>' +
            "</figure>";
        document.body.appendChild(overlay);

        const imgEl = overlay.querySelector(".lightbox__img");
        const capEl = overlay.querySelector(".lightbox__cap");
        const closeBtn = overlay.querySelector(".lightbox__close");
        let lastFocus = null;

        function openLightbox(img) {
            const figure = img.closest(".shot");
            const caption = figure && figure.querySelector("figcaption");
            lastFocus = document.activeElement;
            imgEl.src = img.currentSrc || img.src;
            imgEl.alt = img.alt || "";
            if (caption && caption.textContent.trim()) {
                capEl.textContent = caption.textContent.trim();
                capEl.hidden = false;
            } else {
                capEl.textContent = "";
                capEl.hidden = true;
            }
            overlay.hidden = false;
            document.body.classList.add("lightbox-open");
            closeBtn.focus();
        }

        function closeLightbox() {
            if (overlay.hidden) return;
            overlay.hidden = true;
            document.body.classList.remove("lightbox-open");
            imgEl.removeAttribute("src");
            if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
        }

        targets.forEach((img) => {
            img.style.cursor = "zoom-in";
            img.setAttribute("tabindex", "0");
            img.setAttribute("role", "button");
            img.setAttribute("aria-label", (img.alt || "Image") + " — open full view");
            const open = () => openLightbox(img);
            img.addEventListener("click", open);
            img.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open();
                }
            });
        });

        closeBtn.addEventListener("click", closeLightbox);
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeLightbox();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeLightbox();
        });
    }

    async function initVersionFetcher() {
        const targets = document.querySelectorAll("[data-cvcounter-version]");
        if (!targets.length) return;

        const CACHE_KEY = "cvcounter_latest_version";
        const CACHE_TTL = 60 * 60 * 1000; // 1 hour

        function applyVersion(ver) {
            if (!ver) return;
            targets.forEach((el) => {
                el.textContent = ver;
            });
        }

        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const {version, timestamp} = JSON.parse(cached);
                if (version) {
                    applyVersion(version);
                    if (Date.now() - timestamp < CACHE_TTL) {
                        return;
                    }
                }
            }
        } catch (_) {
        }

        try {
            let res = await fetch("https://api.github.com/repos/BespredeL/CVCounter/releases/latest", {
                headers: {Accept: "application/vnd.github.v3+json"}
            });

            let version = null;
            if (res.ok) {
                const data = await res.json();
                if (data && data.tag_name) {
                    version = data.tag_name.replace(/^v/i, "").trim();
                }
            } else if (res.status === 404) {
                const tagRes = await fetch("https://api.github.com/repos/BespredeL/CVCounter/tags?per_page=1", {
                    headers: {Accept: "application/vnd.github.v3+json"}
                });
                if (tagRes.ok) {
                    const tags = await tagRes.json();
                    if (Array.isArray(tags) && tags.length > 0 && tags[0].name) {
                        version = tags[0].name.replace(/^v/i, "").trim();
                    }
                }
            }

            if (version) {
                applyVersion(version);
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({version, timestamp: Date.now()}));
                } catch (_) {
                }
            }
        } catch (err) {
            console.warn("Could not fetch latest CVCounter version:", err);
        }
    }

    function initHeroHud() {
        const hud = document.getElementById("hero-hud");
        if (!hud) return;

        const clockEl = document.getElementById("hud-clock");
        const fpsEl = document.getElementById("hud-fps-val");
        const countInEl = document.getElementById("hud-count-in");
        const countOutEl = document.getElementById("hud-count-out");
        const countCurEl = document.getElementById("hud-count-cur");
        const viewport = document.getElementById("hud-viewport");
        const tripwire = document.getElementById("hud-tripwire");
        const eventsLayer = document.getElementById("hud-events");
        const simBtn = document.getElementById("hud-sim-btn");
        const trackEl = document.getElementById("hud-track");

        let countIn = 164;
        let countOut = 62;
        let nextId = 1044;
        const items = [];

        // Clock
        function updateClock() {
            if (!clockEl) return;
            const now = new Date();
            clockEl.textContent = now.toTimeString().split(" ")[0];
        }

        updateClock();
        setInterval(updateClock, 1000);

        // Realistic FPS Jitter
        if (fpsEl) {
            setInterval(() => {
                if (document.hidden) return;
                const jitter = (29.7 + Math.random() * 0.7).toFixed(1);
                fpsEl.textContent = jitter;
            }, 1800);
        }

        // Spawn package onto conveyor
        function spawnItem(customX = -12, customId = null) {
            if (!trackEl) return;
            const id = customId || nextId++;
            const el = document.createElement("div");
            el.className = "hud-item";
            el.innerHTML = `
                <div class="hud-item__tag">ID #${id} box 0.97</div>
                <div class="hud-item__bbox">
                    <div class="hud-item__reticle"></div>
                </div>
                <div class="hud-item__box"></div>
            `;
            trackEl.appendChild(el);

            const itemObj = {
                id,
                x: customX,
                speed: 0.16 + Math.random() * 0.03, // smooth realistic conveyor velocity
                el,
                tagEl: el.querySelector(".hud-item__tag"),
                isInZone: false,
                isCounted: false
            };
            items.push(itemObj);
        }

        // Prepopulate with 2 items on screen so it's active immediately
        spawnItem(18, 1042);
        spawnItem(58, 1043);

        let lastSpawnTime = performance.now();
        const spawnInterval = 3400; // spawn every 3.4 seconds
        let lastTime = performance.now();

        function animate(currentTime) {
            const delta = Math.min(64, currentTime - lastTime);
            lastTime = currentTime;

            if (!document.hidden) {
                // Auto-feed packages onto the conveyor
                if (currentTime - lastSpawnTime > spawnInterval) {
                    lastSpawnTime = currentTime;
                    spawnItem(-12);
                }

                // Conveyor zone bounds: Zone is ~28% to 72%, Central Sensor Line is at 50%
                const ZONE_START = 28;
                const ZONE_SENSOR = 50;
                const ZONE_END = 72;

                let inZoneCount = 0;

                for (let i = items.length - 1; i >= 0; i--) {
                    const item = items[i];
                    item.x += item.speed * (delta / 16.67);
                    item.el.style.left = `${item.x}%`;

                    // Check if inside the designated detection zone
                    if (item.x >= ZONE_START && item.x <= ZONE_END) {
                        inZoneCount++;
                        if (!item.isInZone) {
                            item.isInZone = true;
                            item.el.classList.add("is-in-zone");
                            if (item.tagEl) item.tagEl.textContent = `ID #${item.id} [ЗОНА] 0.98`;
                        }
                    } else if (item.x > ZONE_END && item.isInZone) {
                        item.isInZone = false;
                        item.el.classList.remove("is-in-zone");
                        if (item.tagEl) item.tagEl.textContent = `ID #${item.id} pass 0.99`;
                    }

                    // Check laser sensor crossing moment
                    if (item.x >= ZONE_SENSOR && !item.isCounted) {
                        item.isCounted = true;
                        item.el.classList.add("is-counted");
                        if (item.tagEl) item.tagEl.textContent = `ID #${item.id} [СЧЁТ] 0.99`;

                        // Increment live counter
                        countIn++;
                        if (countInEl) {
                            countInEl.textContent = countIn;
                            countInEl.classList.add("is-bumping");
                            setTimeout(() => countInEl.classList.remove("is-bumping"), 250);
                        }

                        // Laser beam pulse
                        if (tripwire) {
                            tripwire.classList.add("is-triggered");
                            setTimeout(() => tripwire.classList.remove("is-triggered"), 350);
                        }

                        // Floating +1 particle badge
                        if (eventsLayer) {
                            const pill = document.createElement("div");
                            pill.className = "hud-event-pill is-in";
                            pill.textContent = "+1 ПОДСЧЁТ";
                            pill.style.left = `${Math.min(78, Math.max(18, item.x))}%`;
                            pill.style.top = "40%";
                            eventsLayer.appendChild(pill);
                            setTimeout(() => pill.remove(), 1200);
                        }
                    }

                    // Remove item when it rolls off the right edge
                    if (item.x > 115) {
                        item.el.remove();
                        items.splice(i, 1);
                    }
                }

                // Update real-time "В ЗОНЕ" counter
                if (countCurEl) {
                    countCurEl.textContent = inZoneCount;
                }
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);

        // Click on simulate button drops a new package onto the conveyor
        if (simBtn) {
            simBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                spawnItem(5, nextId++);
            });
        }

        // Click anywhere on viewport drops a package with a visual ripple
        if (viewport) {
            viewport.addEventListener("click", (e) => {
                const rect = viewport.getBoundingClientRect();
                const xPercent = ((e.clientX - rect.left) / rect.width) * 100;

                const ripple = document.createElement("div");
                ripple.className = "hud-click-ripple";
                ripple.style.left = `${e.clientX - rect.left}px`;
                ripple.style.top = `${e.clientY - rect.top}px`;
                viewport.appendChild(ripple);
                setTimeout(() => ripple.remove(), 700);

                spawnItem(Math.min(25, Math.max(-8, xPercent - 10)), nextId++);
            });
        }
    }

    function initSpotlightCards() {
        const cards = document.querySelectorAll(".glow-card");
        if (!cards.length) return;

        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
            cards.forEach((card) => {
                card.addEventListener("pointermove", (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    card.style.setProperty("--mouse-x", `${x}px`);
                    card.style.setProperty("--mouse-y", `${y}px`);
                }, {passive: true});
            });
        }
    }

    initNav();
    initReveal();
    initLightbox();
    initVersionFetcher();
    initHeroHud();
    initSpotlightCards();
})();


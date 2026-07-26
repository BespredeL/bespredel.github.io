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

    initNav();
    initReveal();
    initLightbox();
})();

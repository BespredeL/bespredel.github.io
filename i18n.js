const translations = {
    ru: {
        page_title: "BespredeL (Aleksandr Kireev) | Backend Developer",
        nav_about: "Обо мне",
        nav_projects: "Проекты",
        nav_github: "GitHub",
        nav_contact: "Контакты",
        hero_badge: "Backend Developer • Open Source",
        hero_title: "PHP / Laravel Разработчик",
        hero_description: "Создаю веб-приложения, API, системы автоматизации и open-source решения.",
        hero_github: "GitHub",
        hero_projects: "Проекты",
        about_title: "Обо мне",
        about_text_1: "Backend-разработчик, специализирующийся на PHP и Laravel. Создаю веб-приложения, API, инструменты автоматизации и open-source проекты.",
        about_text_2: "Также работаю с Python, JavaScript, Arduino, MS Dynamics NAV и системами Computer Vision.",
        projects_title: "Проекты",
        github_title: "GitHub",
        contact_title: "Контакты",
        contact_text: "Открыт для сотрудничества, open-source проектов и интересных задач.",
        repositories: "Репозиториев",
        followers: "Подписчиков",
        following: "Подписок",
        open_project: "Открыть →",
        loading_profile: "Загрузка профиля...",
        loading_repositories: "Загрузка репозиториев...",
        no_description: "Описание отсутствует"
    },

    en: {
        page_title: "BespredeL (Aleksandr Kireev) | Backend Developer",
        nav_about: "About",
        nav_projects: "Projects",
        nav_github: "GitHub",
        nav_contact: "Contact",
        hero_badge: "Backend Developer • Open Source",
        hero_title: "PHP / Laravel Developer",
        hero_description: "Building web applications, APIs, automation systems and open-source solutions.",
        hero_github: "GitHub",
        hero_projects: "Projects",
        about_title: "About Me",
        about_text_1: "Backend developer specializing in PHP and Laravel. Building web applications, APIs, automation tools and open-source projects.",
        about_text_2: "Also working with Python, JavaScript, Arduino, MS Dynamics NAV and Computer Vision systems.",
        projects_title: "Projects",
        github_title: "GitHub",
        contact_title: "Contact",
        contact_text: "Open to collaboration, open-source projects and interesting challenges.",
        repositories: "Repositories",
        followers: "Followers",
        following: "Following",
        open_project: "Open →",
        loading_profile: "Loading profile...",
        loading_repositories: "Loading repositories...",
        no_description: "No description available"
    }
};

/**
 * Update text on page
 */
function updateTexts(lang) {
    document.documentElement.lang = lang;
    document.title = translations[lang].page_title;
    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.dataset.i18n;
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    document.querySelectorAll(".lang-btn").forEach(button => {
        button.classList.remove("active");
    });

    const activeButton = document.querySelector(`[data-lang="${lang}"]`);
    if (activeButton) {
        activeButton.classList.add("active");
    }

    localStorage.setItem("language", lang);

    window.dispatchEvent(
        new CustomEvent("languageChanged", {
            detail: {lang}
        })
    );
}


function getCurrentLanguage() {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage && translations[savedLanguage]) {
        return savedLanguage;
    }

    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith("ru")) {
        return "ru";
    }

    return "en";
}

document.addEventListener("DOMContentLoaded", () => {
    const currentLanguage = getCurrentLanguage();

    updateTexts(currentLanguage);

    document
    .querySelectorAll(".lang-btn")
    .forEach(button => {
        button.addEventListener("click", () => {
            const lang = button.dataset.lang;
            updateTexts(lang);
        });
    });
});

window.i18n = {
    translations,
    getCurrentLanguage,
    updateTexts
};
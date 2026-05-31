const GITHUB_USERNAME = "BespredeL";
const FEATURED_REPOSITORIES = [
    "MacroDroid",
    "CVCounter",
    "geo-restrict",
    "encryption-form",
    "woo-category-ordering"
];
const EXCLUDED_REPOSITORIES = [
    "BespredeL",
    "bespredel.github.io"
];
const CACHE_TIME = 30 * 60 * 1000; // 30 minutes

let githubUser = null;
let githubRepositories = [];

/**
 * Fetches data from GitHub API with localStorage caching.
 *
 * @param {string} url - GitHub API URL.
 * @param {string} cacheKey - Cache storage key.
 *
 * @returns {Promise<any>}
 */
async function fetchGitHubData(url, cacheKey) {
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        try {
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < CACHE_TIME) {
                return data.value;
            }
        } catch (error) {
            console.warn(
                "Cache parse error:",
                error
            );
        }
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `GitHub API error: ${response.status}`
        );
    }

    const result = await response.json();
    if (result.message) {
        throw new Error(result.message);
    }

    localStorage.setItem(
        cacheKey,
        JSON.stringify({
            timestamp: Date.now(),
            value: result
        })
    );

    return result;
}

/**
 * Loads GitHub profile and repositories.
 *
 * Uses cache when available.
 *
 * @returns {Promise<void>}
 */
async function loadGitHubData() {
    const [user, repositories] =
        await Promise.all([
            fetchGitHubData(
                `https://api.github.com/users/${GITHUB_USERNAME}`,
                "github-user"
            ),
            fetchGitHubData(
                `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`,
                "github-repositories"
            )
        ]);

    githubUser = user;
    githubRepositories = repositories;
}

/**
 * Renders GitHub profile card.
 *
 * @param {Object} user - GitHub user object.
 *
 * @returns {void}
 */
function renderProfile(user) {
    const profileContainer = document.getElementById("profile");
    const lang = window.i18n.getCurrentLanguage();
    const t = window.i18n.translations[lang];

    profileContainer.innerHTML = `
        <div class="profile-card">
            <img src="${user.avatar_url}" alt="${user.login}">
            <div class="profile-info">
                <h3>
                    ${user.name || user.login}
                </h3>
                <p>
                    ${user.bio || ""}
                </p>
                <div class="profile-stats">
                    <div class="profile-stat">
                        📦 ${t.repositories}: ${user.public_repos}
                    </div>
                    <div class="profile-stat">
                        👥 ${t.followers}: ${user.followers}
                    </div>
                    <div class="profile-stat">
                        ➡️ ${t.following}: ${user.following}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders GitHub statistics cards.
 *
 * @param {Object} user - GitHub user object.
 * @param {Array} repositories - Repository list.
 *
 * @returns {void}
 */
function renderGitHubStats(user, repositories) {
    const container = document.getElementById("github-stats");
    if (!container) {
        return;
    }
    const lang = window.i18n.getCurrentLanguage();
    const t = window.i18n.translations[lang];
    const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0);
    const languages = {};

    repositories.forEach(repo => {
        if (!repo.language) {
            return;
        }

        languages[repo.language] = (languages[repo.language] || 0) + 1;
    });

    const topLanguage =
        Object.entries(languages)
        .sort(
            (a, b) => b[1] - a[1]
        )[0]?.[0] || "-";

    container.innerHTML = `
        <div class="stat-card">
            <span>📦</span>
            <h3>${user.public_repos}</h3>
            <p>${t.stats_repositories}</p>
        </div>

        <div class="stat-card">
            <span>⭐</span>
            <h3>${totalStars}</h3>
            <p>${t.stats_stars}</p>
        </div>

        <div class="stat-card">
            <span>🍴</span>
            <h3>${totalForks}</h3>
            <p>${t.stats_forks}</p>
        </div>

        <div class="stat-card">
            <span>💻</span>
            <h3>${topLanguage}</h3>
            <p>${t.stats_main_language}</p>
        </div>
    `;
}

/**
 * Renders repository cards.
 *
 * @param {Array} repositories - Repository list.
 *
 * @returns {void}
 */
function renderRepositories(repositories) {
    const reposContainer = document.getElementById("repos");
    const lang = window.i18n.getCurrentLanguage();
    const t = window.i18n.translations[lang];

    reposContainer.innerHTML = "";

    repositories.forEach(repo => {
        const card = document.createElement("div");

        card.className = "repo-card";
        card.innerHTML = `
            <h3>${repo.name}</h3>
            <p>
                ${repo.description || t.no_description}
            </p>
            <div class="repo-footer">
                <span class="repo-language">
                    ${repo.language || "-"}
                </span>
                <a class="repo-link" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">
                    ${t.open_project}
                </a>
            </div>
            <div style="margin-top:15px;color:#94a3b8;font-size:14px;">
                ⭐ ${repo.stargazers_count}&nbsp;&nbsp;🍴 ${repo.forks_count}
            </div>
        `;

        reposContainer.appendChild(card);
    });
}

/**
 * Loads featured repositories and
 * appends additional popular projects.
 *
 * @returns {void}
 */
function loadFeaturedRepositories() {
    const repos = githubRepositories;

    const featured =
        repos
        .filter(repo =>
            FEATURED_REPOSITORIES.includes(repo.name)
        )
        .sort((a, b) =>
            FEATURED_REPOSITORIES.indexOf(a.name) -
            FEATURED_REPOSITORIES.indexOf(b.name)
        );

    const others =
        repos
        .filter(repo =>
            !repo.fork &&
            !FEATURED_REPOSITORIES.includes(repo.name) &&
            !EXCLUDED_REPOSITORIES.includes(repo.name)
        )
        .sort((a, b) => {
            const scoreA =
                a.stargazers_count * 100 +
                a.forks_count * 20;

            const scoreB =
                b.stargazers_count * 100 +
                b.forks_count * 20;

            return scoreB - scoreA;
        })
        .slice(0, 6);

    renderRepositories([
        ...featured,
        ...others
    ]);
}

/**
 * Updates copyright text.
 *
 * @returns {void}
 */
function updateCopyright() {
    const currentYear = new Date().getFullYear();
    const element = document.getElementById("copyright");
    if (element) {
        element.textContent = `© 2009–${currentYear} BespredeL (Aleksandr Kireev)`;
    }
}

/**
 * Initializes section reveal animations.
 *
 * @returns {void}
 */
function initSectionAnimations() {
    const sections = document.querySelectorAll("section");
    sections.forEach(section => {
        section.classList.add("section-hidden");
    });

    const observer =
        new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(
                            "section-visible"
                        );
                    }
                });
            },
            {
                threshold: 0.15
            }
        );

    sections.forEach(section => {
        observer.observe(section);
    });
}

/**
 * Renders all dynamic content.
 *
 * @returns {void}
 */
function renderPage() {
    if (!githubUser || !githubRepositories.length) {
        return;
    }

    renderProfile(
        githubUser
    );

    renderGitHubStats(
        githubUser,
        githubRepositories
    );

    loadFeaturedRepositories();
}

/**
 * Initializes the page.
 *
 * @returns {Promise<void>}
 */
async function initialize() {
    try {
        await loadGitHubData();
        renderPage();
        initSectionAnimations();
    } catch (error) {
        console.error(
            "Initialization error:",
            error
        );

        const t = window.i18n.translations[window.i18n.getCurrentLanguage()];

        document
        .getElementById("profile")
            .innerHTML = `
                <div class="loading-card">
                    ${t.profile_load_error}
                </div>
            `;

        document
        .getElementById("repos")
            .innerHTML = `
                <div class="loading-card">
                    ${t.repositories_load_error}
                </div>
            `;
    }
}

/**
 * Re-renders page when language changes.
 */
window.addEventListener("languageChanged", () => {
        renderPage();
    }
);

document.addEventListener("DOMContentLoaded", () => {
        updateCopyright();
        initialize();
    }
);
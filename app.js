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

/**
 * Load user profile from GitHub API.
 */
async function loadProfile() {
    const profileContainer = document.getElementById("profile");
    const t = window.i18n.translations[window.i18n.getCurrentLanguage()];

    try {
        const [
            userResponse,
            reposResponse
        ] = await Promise.all([
            fetch(
                `https://api.github.com/users/${GITHUB_USERNAME}`
            ),
            fetch(
                `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`
            )
        ]);

        const user = await userResponse.json();
        const repositories = await reposResponse.json();

        renderProfile(user);
        renderGitHubStats(user, repositories);
    } catch (error) {
        profileContainer.innerHTML = `
            <div class="loading-card">
                ${t.profile_load_error}
            </div>
        `;
        console.error(error);
    }
}

/**
 * Render user profile.
 * @param {Object} user - User data from GitHub API.
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
 * Render GitHub statistics.
 * @param {Object} user - User data from GitHub API.
 * @param {Array} repositories - Array of repository objects.
 */
function renderGitHubStats(user, repositories) {
    const container = document.getElementById("github-stats");
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
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

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
 * Load user repositories from GitHub API.
 */
async function loadRepositories() {
    const reposContainer = document.getElementById("repos");
    const t = window.i18n.translations[window.i18n.getCurrentLanguage()];

    try {
        const response = await fetch(
            `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`
        );

        if (!response.ok) {
            throw new Error("GitHub API error");
        }

        const repositories = await response.json();
        const filteredRepositories =
            repositories
            .filter(repo => !repo.fork)
            .sort((a, b) => {
                const scoreA =
                    a.stargazers_count * 100 +
                    a.forks_count * 20;

                const scoreB =
                    b.stargazers_count * 100 +
                    b.forks_count * 20;

                return scoreB - scoreA;
            })
            .slice(0, 12);

        renderRepositories(filteredRepositories);
    } catch (error) {
        reposContainer.innerHTML = `
            <div class="loading-card">
                ${t.repositories_load_error}
            </div>
        `;
        console.error(error);
    }
}

/**
 * Render user repositories.
 * @param {Array} repositories - Array of repository objects.
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
                    ${repo.language || "—"}
                </span>
                <a class="repo-link"
                    href="${repo.html_url}"
                    target="_blank"
                    rel="noopener noreferrer">
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
 * Load featured projects from GitHub API.
 */
async function loadFeaturedRepositories() {
    const featuredRepositories = [
        "MacroDroid",
        "CVCounter",
        "geo-restrict",
        "encryption-form",
        "woo-category-ordering"
    ];

    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`);
        if (!response.ok) {
            throw new Error("GitHub API error");
        }

        const repos = await response.json();

        const featured = repos
        .filter(repo =>
            FEATURED_REPOSITORIES.includes(repo.name)
        )
        .sort((a, b) => {
            return (
                FEATURED_REPOSITORIES.indexOf(a.name) -
                FEATURED_REPOSITORIES.indexOf(b.name)
            );
        });

        const otherRepositories = repos
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
            ...otherRepositories
        ]);

    } catch (error) {
        console.error(error);
        loadRepositories();
    }
}

/**
 * Updates copyright year in footer.
 */
function updateCopyright() {
    const currentYear = new Date().getFullYear();
    const element = document.getElementById("copyright");
    if (element) {
        element.textContent = `© 2009 - ${currentYear} BespredeL (Aleksandr Kireev)`;
    }
}

/**
 * Initialize the page.
 */
async function initialize() {
    await loadProfile();
    await loadFeaturedRepositories();
}

/**
 * Handle language change.
 */
window.addEventListener("languageChanged", () => {
        loadProfile();
        loadFeaturedRepositories();
    }
);

document.addEventListener(
    "DOMContentLoaded",
    () => {
        updateCopyright();
        initialize();
    }
);
const GITHUB_USERNAME = "BespredeL";

/**
 * Load user profile from GitHub API.
 */
async function loadProfile() {
    const profileContainer = document.getElementById("profile");

    try {
        const response = await fetch(
            `https://api.github.com/users/${GITHUB_USERNAME}`
        );

        if (!response.ok) {
            throw new Error("GitHub API error");
        }

        const user = await response.json();

        renderProfile(user);
    } catch (error) {
        profileContainer.innerHTML = `
            <div class="loading-card">
                Failed to load GitHub profile.
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
 * Load user repositories from GitHub API.
 */
async function loadRepositories() {
    const reposContainer = document.getElementById("repos");

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
                Failed to load repositories.
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
 * Load pinned projects from GitHub API.
 */
async function loadPinnedProjects() {
    const preferredProjects = [
        "MacroDroid",
        "CVCounter",
        "geo-restrict",
        "encryption-form",
        "woo-category-ordering",
    ];

    try {
        const response = await fetch(
            `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`
        );

        if (!response.ok) {
            return;
        }

        const repos = await response.json();

        const preferred = repos.filter(repo =>
            preferredProjects.includes(repo.name)
        );

        if (preferred.length > 0) {
            preferred.sort((a, b) => {
                const indexA = preferredProjects.indexOf(a.name);
                const indexB = preferredProjects.indexOf(b.name);
                return indexA - indexB;
            });

            renderRepositories(preferred);

            return true;
        }

    } catch (error) {
        console.error(error);
    }

    return false;
}

/**
 * Initialize the page.
 */
async function initialize() {
    await loadProfile();

    const pinnedLoaded = await loadPinnedProjects();
    if (!pinnedLoaded) {
        await loadRepositories();
    }
}

/**
 * Handle language change.
 */
window.addEventListener(
    "languageChanged",
    () => {

        loadProfile();

        loadPinnedProjects().then(result => {
            if (!result) {
                loadRepositories();
            }
        });
    }
);

document.addEventListener(
    "DOMContentLoaded",
    initialize
);
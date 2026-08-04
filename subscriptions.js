console.log("subscriptions.js загружен");

const AVATAR_OPTIONS = [
    { id: 1, emoji: "🔥", gradient: "linear-gradient(135deg, #ff304f, #a91431)" },
    { id: 2, emoji: "🎮", gradient: "linear-gradient(135deg, #ff304f, #7d1fff)" },
    { id: 3, emoji: "🎬", gradient: "linear-gradient(135deg, #ff304f, #ff6fa0)" },
    { id: 4, emoji: "😎", gradient: "linear-gradient(135deg, #ff304f, #1f6bff)" },
    { id: 5, emoji: "⚡", gradient: "linear-gradient(135deg, #ff304f, #ff9d1f)" },
    { id: 6, emoji: "👾", gradient: "linear-gradient(135deg, #ff304f, #1fd8c0)" },
    { id: 7, emoji: "🌟", gradient: "linear-gradient(135deg, #ff304f, #ffd21f)" },
    { id: 8, emoji: "💀", gradient: "linear-gradient(135deg, #52525c, #17171b)" }
];

function getAvatarOption(avatarId) {

    return (
        AVATAR_OPTIONS.find(option => option.id === avatarId) ||
        AVATAR_OPTIONS[0]
    );

}

function applyAvatar(element, avatarId) {

    if (!element) {
        return;
    }

    const option =
        getAvatarOption(avatarId);

    element.textContent = option.emoji;

    element.style.background = option.gradient;

}

const subscriptionsList =
    document.getElementById("subscriptionsList");

const subscriptionsEmptyState =
    document.getElementById("subscriptionsEmptyState");


async function initSubscriptionsPage() {

    const {
        data,
        error
    } =
        await window.supabaseClient.auth.getUser();

    if (error || !data.user) {

        window.location.replace(
            "login.html"
        );

        return;

    }

    const user = data.user;

    const {
        data: subs,
        error: subsError
    } =
        await window.supabaseClient
            .from("subscriptions")
            .select("following_id, created_at")
            .eq("follower_id", user.id)
            .order("created_at", { ascending: false });

    if (subsError) {

        console.error("Ошибка загрузки подписок:", subsError);

        showEmptyState();

        return;

    }

    if (!subs || subs.length === 0) {

        showEmptyState();

        return;

    }

    const followingIds =
        subs.map(sub => sub.following_id);

    const {
        data: profiles,
        error: profilesError
    } =
        await window.supabaseClient
            .from("public_profiles")
            .select("user_id, username, avatar_id")
            .in("user_id", followingIds);

    if (profilesError) {

        console.error("Ошибка загрузки профилей:", profilesError);

    }

    const usernameById = {};

    const avatarById = {};

    (profiles || []).forEach(profile => {

        usernameById[profile.user_id] =
            profile.username || "user";

        avatarById[profile.user_id] =
            profile.avatar_id || 1;

    });

    renderSubscriptions(subs, usernameById, avatarById);

}


function showEmptyState() {

    subscriptionsList.hidden = true;

    subscriptionsEmptyState.hidden = false;

}


function renderSubscriptions(subs, usernameById, avatarById) {

    subscriptionsList.hidden = false;

    subscriptionsEmptyState.hidden = true;

    subscriptionsList.innerHTML = "";

    subs.forEach(sub => {

        const username =
            usernameById[sub.following_id] || "user";

        const row =
            document.createElement("div");

        row.className = "subscription-row";

        row.innerHTML = `

            <div class="author-avatar"></div>

            <div class="subscription-row-info">

                <strong></strong>

                <span>
                    Автор на SasaClips
                </span>

            </div>

            <a class="login-button">
                Открыть профиль
            </a>

        `;

        applyAvatar(
            row.querySelector(".author-avatar"),
            avatarById[sub.following_id] || 1
        );

        row.querySelector("strong").textContent =
            "@" + username;

        row.querySelector("a").href =
            `profile.html?id=${sub.following_id}`;

        subscriptionsList.appendChild(row);

    });

}


initSubscriptionsPage();

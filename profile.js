console.log("profile.js запущен");

const CATEGORY_LABELS = {
    creativity: "🎨 Творчество",
    irl: "🌍 IRL зрителей",
    memes: "💀 Мемы",
    tiktok: "🎵 TikTok"
};

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

let currentUser = null;

let profileUserId = null;

let isOwnProfile = true;


async function loadProfile() {

    console.log("loadProfile старт");

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

    currentUser = user;


    // =========================
    // СВОЙ ПРОФИЛЬ ИЛИ ЧУЖОЙ (?id=...)
    // =========================

    const urlParams =
        new URLSearchParams(window.location.search);

    const targetUserId =
        urlParams.get("id");

    isOwnProfile =
        !targetUserId || targetUserId === user.id;

    profileUserId =
        isOwnProfile
        ? user.id
        : targetUserId;


    // =========================
    // ДАННЫЕ ПРОФИЛЯ
    // =========================

    const emailEl =
        document.getElementById("profileEmail");

    const headerLogoutButton =
        document.getElementById("headerLogoutButton");

    const mySubscriptionsLink =
        document.getElementById("mySubscriptionsLink");

    const myClipsHeading =
        document.getElementById("myClipsHeading");

    if (isOwnProfile) {

        const username =
            user.user_metadata.username || "user";

        document.getElementById("profileUsername").textContent =
            "@" + username;

        emailEl.hidden = false;

        emailEl.textContent =
            user.email;

        document.getElementById("profileAvatar").textContent =
            username.charAt(0).toUpperCase();

        document.getElementById("profileDate").textContent =
            "На SasaClips с " +
            new Date(user.created_at).toLocaleDateString("ru-RU");

        if (myClipsHeading) {
            myClipsHeading.textContent = "Мои клипы";
        }

        if (mySubscriptionsLink) {
            mySubscriptionsLink.hidden = false;
        }

        const mySecurityLink =
            document.getElementById("mySecurityLink");

        if (mySecurityLink) {
            mySecurityLink.hidden = false;
        }

        const {
            data: ownProfile
        } =
            await window.supabaseClient
                .from("public_profiles")
                .select("avatar_id")
                .eq("user_id", user.id)
                .maybeSingle();

        const currentAvatarId =
            (ownProfile && ownProfile.avatar_id) || 1;

        applyAvatar(
            document.getElementById("profileAvatar"),
            currentAvatarId
        );

        setupAvatarPicker(currentAvatarId);

        if (headerLogoutButton) {

            headerLogoutButton.hidden = false;

            headerLogoutButton.addEventListener(
                "click",
                async function () {

                    await window.supabaseClient.auth.signOut();

                    window.location.replace(
                        "login.html"
                    );

                }
            );

        }

    } else {

        if (headerLogoutButton) {
            headerLogoutButton.hidden = true;
        }

        if (mySubscriptionsLink) {
            mySubscriptionsLink.hidden = true;
        }

        emailEl.hidden = true;

        const {
            data: publicProfile
        } =
            await window.supabaseClient
                .from("public_profiles")
                .select("username, created_at, avatar_id")
                .eq("user_id", profileUserId)
                .maybeSingle();

        const username =
            (publicProfile && publicProfile.username) || "user";

        document.getElementById("profileUsername").textContent =
            "@" + username;

        applyAvatar(
            document.getElementById("profileAvatar"),
            (publicProfile && publicProfile.avatar_id) || 1
        );

        const joinDate =
            publicProfile && publicProfile.created_at
            ? new Date(publicProfile.created_at).toLocaleDateString("ru-RU")
            : "—";

        document.getElementById("profileDate").textContent =
            "На SasaClips с " + joinDate;

        if (myClipsHeading) {
            myClipsHeading.textContent = "Клипы @" + username;
        }

        await setupSubscribeButton();

    }


    // =========================
    // МОИ КЛИПЫ + СТАТИСТИКА
    // =========================

    await loadProfileClips();

    await loadSubscriptionCounts();

}


function setupAvatarPicker(currentAvatarId) {

    const picker =
        document.getElementById("avatarPicker");

    const optionsContainer =
        document.getElementById("avatarPickerOptions");

    if (!picker || !optionsContainer) {
        return;
    }

    picker.hidden = false;

    optionsContainer.innerHTML = "";

    AVATAR_OPTIONS.forEach(option => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className = "avatar-picker-option";

        button.classList.toggle(
            "active",
            option.id === currentAvatarId
        );

        button.textContent = option.emoji;

        button.style.background = option.gradient;

        button.addEventListener("click", async () => {

            const { error } =
                await window.supabaseClient
                    .from("public_profiles")
                    .update({ avatar_id: option.id })
                    .eq("user_id", currentUser.id);

            if (error) {

                console.error("Ошибка сохранения аватарки:", error);

                alert("Не удалось сохранить аватарку.");

                return;

            }

            applyAvatar(
                document.getElementById("profileAvatar"),
                option.id
            );

            optionsContainer
                .querySelectorAll(".avatar-picker-option")
                .forEach(btn => btn.classList.remove("active"));

            button.classList.add("active");

        });

        optionsContainer.appendChild(button);

    });

}


async function loadProfileClips() {

    const grid =
        document.getElementById("myClipsGrid");

    const emptyState =
        document.getElementById("myClipsEmptyState");

    const {
        data: clips,
        error
    } =
        await window.supabaseClient
            .from("clips")
            .select("*")
            .eq("user_id", profileUserId)
            .order("created_at", { ascending: false });

    if (error) {

        console.error("Ошибка загрузки клипов профиля:", error);

        return;

    }

    let visibleClips =
        clips || [];

    if (!isOwnProfile) {

        visibleClips =
            visibleClips.filter(clip => clip.status === "approved");

    }


    // Статистика

    document.getElementById("statTotalClips").textContent =
        visibleClips.length;

    document.getElementById("statTotalLikes").textContent =
        visibleClips.reduce((sum, clip) => sum + (clip.likes || 0), 0);

    document.getElementById("statTotalViews").textContent =
        visibleClips.reduce((sum, clip) => sum + (clip.views || 0), 0);


    if (visibleClips.length === 0) {

        grid.hidden = true;

        emptyState.hidden = false;

        return;

    }

    grid.hidden = false;

    emptyState.hidden = true;

    renderMyClips(visibleClips);

}


// =========================
// ПОДПИСЧИКИ / ПОДПИСКИ
// =========================

async function loadSubscriptionCounts() {

    const {
        count: followersCount
    } =
        await window.supabaseClient
            .from("subscriptions")
            .select("id", { count: "exact", head: true })
            .eq("following_id", profileUserId);

    const {
        count: followingCount
    } =
        await window.supabaseClient
            .from("subscriptions")
            .select("id", { count: "exact", head: true })
            .eq("follower_id", profileUserId);

    document.getElementById("statFollowers").textContent =
        followersCount || 0;

    document.getElementById("statFollowing").textContent =
        followingCount || 0;

}


async function setupSubscribeButton() {

    const subscribeButton =
        document.getElementById("profileSubscribeButton");

    if (!subscribeButton) {
        return;
    }

    subscribeButton.hidden = false;

    const {
        data: existingSub
    } =
        await window.supabaseClient
            .from("subscriptions")
            .select("id")
            .eq("follower_id", currentUser.id)
            .eq("following_id", profileUserId)
            .maybeSingle();

    let isSubscribed = !!existingSub;

    renderSubscribeButtonState(subscribeButton, isSubscribed);

    subscribeButton.addEventListener("click", async () => {

        subscribeButton.disabled = true;

        if (isSubscribed) {

            const { error: deleteError } =
                await window.supabaseClient
                    .from("subscriptions")
                    .delete()
                    .eq("follower_id", currentUser.id)
                    .eq("following_id", profileUserId);

            if (!deleteError) {
                isSubscribed = false;
            }

        } else {

            const { error: insertError } =
                await window.supabaseClient
                    .from("subscriptions")
                    .insert({
                        follower_id: currentUser.id,
                        following_id: profileUserId
                    });

            if (!insertError) {
                isSubscribed = true;
            }

        }

        renderSubscribeButtonState(subscribeButton, isSubscribed);

        subscribeButton.disabled = false;

        await loadSubscriptionCounts();

    });

}


function renderSubscribeButtonState(button, isSubscribed) {

    button.textContent =

        isSubscribed

        ? "✔ Вы подписаны"

        : "➕ Подписаться";

    button.classList.toggle("subscribed", isSubscribed);

}


const STATUS_LABELS = {
    pending: "🕓 На модерации",
    approved: "✅ Опубликован",
    rejected: "❌ Отклонён"
};


function primeThumbnailFrame(container) {

    const video =
        container.querySelector("video");

    if (!video) {
        return;
    }

    video.addEventListener("loadedmetadata", () => {

        try {

            video.currentTime =
                Math.min(1, (video.duration || 2) / 4);

        } catch (e) {}

    });

}


function renderMyClips(myClips) {

    const grid =
        document.getElementById("myClipsGrid");

    grid.innerHTML = "";

    myClips.forEach(clip => {

        const card = document.createElement("article");

        card.className = "community-clip";

        card.innerHTML = `

            <div class="clip-thumbnail">
                <video muted preload="metadata" playsinline src="${clip.video_url || ""}"></video>
                <span class="thumb-play-icon">▶</span>
            </div>

            <span class="clip-tag">
                ${CATEGORY_LABELS[clip.category] || ""}
            </span>

            <h3>
                ${clip.title}
            </h3>

            <p>
                ${STATUS_LABELS[clip.status] || "🕓 На модерации"} • ❤️ ${clip.likes || 0} • 👁 ${clip.views || 0}
            </p>

            ${
                clip.status === "rejected" && clip.reject_reason
                ? `<p class="reject-reason-text">Причина: ${clip.reject_reason}</p>`
                : ""
            }

            ${
                isOwnProfile
                ? `
                    <div class="my-clip-actions">

                        <button class="edit-clip-button" data-id="${clip.id}">
                            Редактировать
                        </button>

                        <button class="delete-clip-button" data-id="${clip.id}">
                            Удалить
                        </button>

                    </div>
                `
                : ""
            }

        `;

        primeThumbnailFrame(card);

        card.querySelector("h3").addEventListener("click", () => {

            window.location.href = `video.html?id=${clip.id}`;

        });

        if (isOwnProfile) {

            card.querySelector(".edit-clip-button").addEventListener(
                "click",
                (event) => {

                    event.stopPropagation();

                    editClip(clip);

                }
            );

            card.querySelector(".delete-clip-button").addEventListener(
                "click",
                (event) => {

                    event.stopPropagation();

                    deleteClip(clip);

                }
            );

        }

        grid.appendChild(card);

    });

}


async function editClip(clip) {

    const newTitle =
        prompt("Название клипа:", clip.title);

    if (newTitle === null) {
        return;
    }

    const trimmedTitle =
        newTitle.trim();

    if (!trimmedTitle) {

        alert("Название не может быть пустым.");

        return;

    }

    const newDescription =
        prompt("Описание клипа:", clip.description || "");

    if (newDescription === null) {
        return;
    }

    const { error } =
        await window.supabaseClient
            .from("clips")
            .update({
                title: trimmedTitle,
                description: newDescription.trim()
            })
            .eq("id", clip.id)
            .eq("user_id", currentUser.id);

    if (error) {

        alert("Не удалось обновить клип.");

        return;

    }

    await loadProfileClips();

}


async function deleteClip(clip) {

    const confirmed =
        confirm(`Удалить клип "${clip.title}"? Это действие нельзя отменить.`);

    if (!confirmed) {
        return;
    }

    const { error } =
        await window.supabaseClient
            .from("clips")
            .delete()
            .eq("id", clip.id)
            .eq("user_id", currentUser.id);

    if (error) {

        alert("Не удалось удалить клип.");

        return;

    }

    await loadProfileClips();

}


loadProfile();

console.log("video.js загружен");

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

const urlParams = new URLSearchParams(
    window.location.search
);

const videoId = urlParams.get("id");

let currentUser = null;

let currentClip = null;


async function getCurrentUser() {

    if (!window.supabaseClient) {
        return null;
    }

    const {
        data,
        error
    } =
        await window.supabaseClient.auth.getUser();

    if (error || !data.user) {
        return null;
    }

    return data.user;

}


async function loadClip() {

    if (!videoId || !window.supabaseClient) {

        document.getElementById("videoTitle").textContent =
            "Видео не найдено";

        return;

    }

    currentUser =
        await getCurrentUser();

    const {
        data: clip,
        error
    } =
        await window.supabaseClient
            .from("clips")
            .select("*")
            .eq("id", videoId)
            .single();

    if (error || !clip) {

        document.getElementById("videoTitle").textContent =
            "Видео не найдено";

        return;

    }

    currentClip = clip;


    // =========================
    // СТАТУС МОДЕРАЦИИ
    // =========================

    const isOwner =
        currentUser && currentUser.id === clip.user_id;

    let isStaff = false;

    if (currentUser && typeof getUserRole === "function") {

        const role =
            await getUserRole(currentUser.id);

        isStaff =
            role === "moderator" || role === "admin";

    }

    if (clip.status !== "approved" && !isOwner && !isStaff) {

        document.getElementById("videoTitle").textContent =
            "Клип на модерации";

        document.querySelector(".video-container").innerHTML =
            `<div class="video-description">Этот клип ещё не прошёл модерацию и пока недоступен для просмотра.</div>`;

        return;

    }

    if (clip.status !== "approved" && (isOwner || isStaff)) {

        const notice =
            document.createElement("div");

        notice.className = "moderation-notice";

        notice.textContent =

            isOwner

            ? (
                clip.status === "rejected"

                ? "❌ Клип отклонён модератором."
                    + (clip.reject_reason ? ` Причина: ${clip.reject_reason}` : " Виден только вам.")

                : "🕓 Клип на модерации. Виден только вам."
            )

            : "🛡 Просмотр в режиме модератора. Этот клип ещё не опубликован.";

        document.querySelector(".video-container").prepend(notice);

    }


    // =========================
    // НАЗВАНИЕ / ВИДЕО / ОПИСАНИЕ
    // =========================

    document.getElementById("videoTitle").textContent =
        clip.title;

    document.getElementById("videoDescription").textContent =
        clip.description || "";

    const videoSource =
        document.querySelector("#mainVideo source");

    if (videoSource && clip.video_url) {

        videoSource.src = clip.video_url;

        document.getElementById("mainVideo").load();

    }


    // =========================
    // АВТОР
    // =========================

    const username =
        clip.username || "user";

    document.getElementById("videoAuthor").textContent =
        "Автор: " + username;

    document.getElementById("authorName").textContent =
        "@" + username;

    document.getElementById("authorAvatar").textContent =
        username.charAt(0).toUpperCase();

    const {
        data: authorProfile
    } =
        await window.supabaseClient
            .from("public_profiles")
            .select("avatar_id")
            .eq("user_id", clip.user_id)
            .maybeSingle();

    applyAvatar(
        document.getElementById("authorAvatar"),
        (authorProfile && authorProfile.avatar_id) || 1
    );


    // =========================
    // ДАТА ПУБЛИКАЦИИ
    // =========================

    const dateEl =
        document.getElementById("videoDate");

    if (clip.created_at) {

        dateEl.textContent =
            new Date(clip.created_at).toLocaleDateString("ru-RU");

    } else {

        dateEl.textContent = "—";

    }


    // =========================
    // КАТЕГОРИЯ
    // =========================

    const categoryTag =
        document.getElementById("videoCategory");

    if (clip.category && CATEGORY_LABELS[clip.category]) {

        categoryTag.textContent =
            CATEGORY_LABELS[clip.category];

        categoryTag.hidden = false;

    }


    // =========================
    // СОЦИАЛЬНЫЕ СЕТИ
    // =========================

    const socialBlock =
        document.getElementById("videoSocialBlock");

    const socialList =
        document.getElementById("videoSocialLinks");

    if (clip.social_links && clip.social_links.trim()) {

        const lines =
            clip.social_links
                .split("\n")
                .map(line => line.trim())
                .filter(line => line.length > 0);

        lines.forEach(line => {

            const isLink =
                line.startsWith("http://") ||
                line.startsWith("https://");

            if (isLink) {

                const link = document.createElement("a");

                link.href = line;

                link.target = "_blank";

                link.textContent = line;

                socialList.appendChild(link);

            } else {

                const text = document.createElement("span");

                text.textContent = line;

                socialList.appendChild(text);

            }

        });

        socialBlock.hidden = false;

    }


    // =========================
    // ПРОСМОТРЫ / ЛАЙКИ / КОММЕНТАРИИ
    // =========================

    document.getElementById("videoViews").textContent =
        `👁 ${clip.views || 0}`;

    await trackView(clip);

    await setupLikes(clip);

    await setupSubscribeButton(clip);

    await loadComments(clip);

    setupCommentForm(clip);

}


// =========================
// ПРОСМОТРЫ (один раз с одного пользователя/браузера)
// =========================

async function trackView(clip) {

    const viewedKey =
        `viewed_video_${clip.id}`;

    if (localStorage.getItem(viewedKey)) {
        return;
    }

    localStorage.setItem(viewedKey, "true");

    if (currentUser) {

        const { error: viewInsertError } =
            await window.supabaseClient
                .from("views")
                .insert({
                    clip_id: clip.id,
                    user_id: currentUser.id
                });

        if (viewInsertError) {

            // 23505 = запись уже существует (пользователь уже смотрел)
            if (viewInsertError.code !== "23505") {
                console.error("Ошибка записи просмотра:", viewInsertError);
            }

            return;

        }

    }

    const newViews =
        (clip.views || 0) + 1;

    const { error: updateError } =
        await window.supabaseClient
            .from("clips")
            .update({ views: newViews })
            .eq("id", clip.id);

    if (!updateError) {

        clip.views = newViews;

        document.getElementById("videoViews").textContent =
            `👁 ${newViews}`;

    }

}


// =========================
// ЛАЙКИ (один лайк на пользователя)
// =========================

async function setupLikes(clip) {

    const likeButton =
        document.getElementById("likeButton");

    const likeCount =
        document.getElementById("likeCount");

    let likes =
        clip.likes || 0;

    let liked = false;

    if (currentUser) {

        const {
            data: existingLike
        } =
            await window.supabaseClient
                .from("likes")
                .select("id")
                .eq("clip_id", clip.id)
                .eq("user_id", currentUser.id)
                .maybeSingle();

        liked = !!existingLike;

    }

    likeCount.textContent = likes;

    likeButton.classList.toggle("liked", liked);

    likeButton.addEventListener("click", async () => {

        if (!currentUser) {

            alert("Сначала войдите в аккаунт, чтобы ставить лайки.");

            window.location.href = "login.html";

            return;

        }

        likeButton.disabled = true;

        if (liked) {

            const { error: deleteError } =
                await window.supabaseClient
                    .from("likes")
                    .delete()
                    .eq("clip_id", clip.id)
                    .eq("user_id", currentUser.id);

            if (!deleteError) {

                likes = Math.max(0, likes - 1);

                liked = false;

            }

        } else {

            const { error: insertError } =
                await window.supabaseClient
                    .from("likes")
                    .insert({
                        clip_id: clip.id,
                        user_id: currentUser.id
                    });

            if (!insertError) {

                likes = likes + 1;

                liked = true;

            }

        }

        await window.supabaseClient
            .from("clips")
            .update({ likes: likes })
            .eq("id", clip.id);

        likeCount.textContent = likes;

        likeButton.classList.toggle("liked", liked);

        likeButton.disabled = false;

    });

}


// =========================
// КОММЕНТАРИИ
// =========================

async function loadComments(clip) {

    const commentsList =
        document.getElementById("commentsList");

    const commentsCount =
        document.getElementById("commentsCount");

    const {
        data: comments,
        error
    } =
        await window.supabaseClient
            .from("comments")
            .select("*")
            .eq("clip_id", clip.id)
            .order("created_at", { ascending: false });

    if (error) {

        console.error("Ошибка загрузки комментариев:", error);

        return;

    }

    commentsCount.textContent =
        `(${comments ? comments.length : 0})`;

    commentsList.innerHTML = "";

    if (!comments || comments.length === 0) {

        commentsList.innerHTML =
            `<div class="empty-comments">Пока нет комментариев. Будь первым! 👀</div>`;

        return;

    }

    const isClipOwner =
        currentUser && currentUser.id === clip.user_id;

    const commenterIds =
        [...new Set(comments.map(comment => comment.user_id).filter(Boolean))];

    let avatarByUserId = {};

    if (commenterIds.length > 0) {

        const {
            data: commenterProfiles
        } =
            await window.supabaseClient
                .from("public_profiles")
                .select("user_id, avatar_id")
                .in("user_id", commenterIds);

        (commenterProfiles || []).forEach(profile => {

            avatarByUserId[profile.user_id] =
                profile.avatar_id || 1;

        });

    }

    comments.forEach(comment => {

        const item = document.createElement("div");

        item.className = "comment-item";

        const author =
            comment.username || "user";

        const date =
            comment.created_at
            ? new Date(comment.created_at).toLocaleDateString("ru-RU")
            : "";

        item.innerHTML = `

            <div class="comment-avatar">
                ${author.charAt(0).toUpperCase()}
            </div>

            <div class="comment-body">

                <div class="comment-header">
                    <strong>@${author}</strong>
                    <span>${date}</span>
                </div>

                <div class="comment-text"></div>

            </div>

            ${
                isClipOwner
                ? `<button class="comment-delete" data-id="${comment.id}" title="Удалить комментарий">×</button>`
                : ""
            }

        `;

        item.querySelector(".comment-text").textContent =
            comment.text;

        applyAvatar(
            item.querySelector(".comment-avatar"),
            avatarByUserId[comment.user_id] || 1
        );

        commentsList.appendChild(item);

    });

    if (isClipOwner) {

        commentsList.querySelectorAll(".comment-delete").forEach(button => {

            button.addEventListener("click", async () => {

                const confirmed =
                    confirm("Удалить этот комментарий?");

                if (!confirmed) {
                    return;
                }

                const commentId =
                    button.dataset.id;

                const { error: deleteError } =
                    await window.supabaseClient
                        .from("comments")
                        .delete()
                        .eq("id", commentId);

                if (deleteError) {

                    alert("Не удалось удалить комментарий.");

                    return;

                }

                await loadComments(clip);

            });

        });

    }

}


function setupCommentForm(clip) {

    const commentInput =
        document.getElementById("commentInput");

    const commentButton =
        document.getElementById("commentButton");

    commentButton.addEventListener("click", async () => {

        if (!currentUser) {

            alert("Сначала войдите в аккаунт, чтобы оставить комментарий.");

            window.location.href = "login.html";

            return;

        }

        const text =
            commentInput.value.trim();

        if (!text) {
            return;
        }

        commentButton.disabled = true;

        const username =
            currentUser.user_metadata.username ||
            currentUser.email;

        const { error: insertError } =
            await window.supabaseClient
                .from("comments")
                .insert({
                    clip_id: clip.id,
                    user_id: currentUser.id,
                    username: username,
                    text: text
                });

        commentButton.disabled = false;

        if (insertError) {

            alert("Не удалось отправить комментарий.");

            return;

        }

        commentInput.value = "";

        await loadComments(clip);

    });

}


// =========================
// ПОДПИСКА НА АВТОРА
// =========================

async function setupSubscribeButton(clip) {

    const subscribeButton =
        document.getElementById("subscribeButton");

    if (!subscribeButton) {
        return;
    }

    const isOwner =
        currentUser && currentUser.id === clip.user_id;

    if (isOwner) {

        subscribeButton.hidden = true;

        return;

    }

    subscribeButton.hidden = false;

    let isSubscribed = false;

    if (currentUser) {

        const {
            data: existingSub
        } =
            await window.supabaseClient
                .from("subscriptions")
                .select("id")
                .eq("follower_id", currentUser.id)
                .eq("following_id", clip.user_id)
                .maybeSingle();

        isSubscribed = !!existingSub;

    }

    renderSubscribeButtonState(subscribeButton, isSubscribed);

    subscribeButton.addEventListener("click", async () => {

        if (!currentUser) {

            alert("Сначала войдите в аккаунт, чтобы подписываться.");

            window.location.href = "login.html";

            return;

        }

        subscribeButton.disabled = true;

        if (isSubscribed) {

            const { error: deleteError } =
                await window.supabaseClient
                    .from("subscriptions")
                    .delete()
                    .eq("follower_id", currentUser.id)
                    .eq("following_id", clip.user_id);

            if (!deleteError) {
                isSubscribed = false;
            }

        } else {

            const { error: insertError } =
                await window.supabaseClient
                    .from("subscriptions")
                    .insert({
                        follower_id: currentUser.id,
                        following_id: clip.user_id
                    });

            if (!insertError) {
                isSubscribed = true;
            }

        }

        renderSubscribeButtonState(subscribeButton, isSubscribed);

        subscribeButton.disabled = false;

    });

}


function renderSubscribeButtonState(button, isSubscribed) {

    button.textContent =

        isSubscribed

        ? "✔ Вы подписаны"

        : "➕ Подписаться";

    button.classList.toggle("subscribed", isSubscribed);

}


loadClip();

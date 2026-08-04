console.log("moderation.js загружен");

const CATEGORY_LABELS = {
    creativity: "🎨 Творчество",
    irl: "🌍 IRL зрителей",
    memes: "💀 Мемы",
    tiktok: "🎵 TikTok"
};

const moderationDenied =
    document.getElementById("moderationDenied");

const moderationContent =
    document.getElementById("moderationContent");

const moderationGrid =
    document.getElementById("moderationGrid");

const moderationEmptyState =
    document.getElementById("moderationEmptyState");


async function initModerationPage() {

    const user =
        await getCurrentAuthUser();

    if (!user) {

        window.location.replace(
            "login.html"
        );

        return;

    }

    const role =
        await getUserRole(user.id);

    if (role !== "moderator" && role !== "admin") {

        moderationContent.hidden = true;

        moderationDenied.hidden = false;

        return;

    }

    moderationDenied.hidden = true;

    moderationContent.hidden = false;

    await loadPendingClips();

}


async function loadPendingClips() {

    const {
        data: clips,
        error
    } =
        await window.supabaseClient
            .from("clips")
            .select("*")
            .eq("status", "pending")
            .order("created_at", { ascending: true });

    if (error) {

        console.error("Ошибка загрузки клипов на модерации:", error);

        showEmptyState();

        return;

    }

    renderClips(clips || []);

}


function showEmptyState() {

    moderationGrid.hidden = true;

    moderationEmptyState.hidden = false;

}


function renderClips(clips) {

    if (!clips || clips.length === 0) {

        moderationGrid.innerHTML = "";

        showEmptyState();

        return;

    }

    moderationGrid.hidden = false;

    moderationEmptyState.hidden = true;

    moderationGrid.innerHTML = "";


    clips.forEach(clip => {

        const card = document.createElement("article");

        card.className = "community-clip";

        card.innerHTML = `

            <div class="moderation-video-preview">

                <video
                    controls
                    preload="metadata"
                    src="${clip.video_url || ""}"
                ></video>

            </div>

            <span class="clip-tag">
                ${CATEGORY_LABELS[clip.category] || ""}
            </span>

            <h3></h3>

            <p class="moderation-clip-meta"></p>

            <div class="moderation-clip-actions">

                <button class="approve-clip-button" data-id="${clip.id}">
                    ✅ Approve
                </button>

                <button class="reject-clip-button" data-id="${clip.id}">
                    ❌ Reject
                </button>

            </div>

        `;

        card.querySelector("h3").textContent =
            clip.title;

        card.querySelector("h3").addEventListener("click", () => {

            window.open(
                `video.html?id=${clip.id}`,
                "_blank"
            );

        });

        const dateLabel =
            clip.created_at
            ? new Date(clip.created_at).toLocaleDateString("ru-RU")
            : "";

        card.querySelector(".moderation-clip-meta").textContent =
            `@${clip.username || "user"} • ${dateLabel}`;

        card.querySelector(".approve-clip-button").addEventListener(
            "click",
            () => moderateClip(clip.id, "approved")
        );

        card.querySelector(".reject-clip-button").addEventListener(
            "click",
            () => moderateClip(clip.id, "rejected")
        );

        moderationGrid.appendChild(card);

    });

}


async function moderateClip(clipId, newStatus) {

    let reason = null;

    if (newStatus === "rejected") {

        reason =
            prompt("Причина отклонения (необязательно):", "");

        if (reason === null) {
            // Нажали "Отмена"
            return;
        }

        reason = reason.trim() || null;

    } else {

        const confirmed =
            confirm("Одобрить этот клип?");

        if (!confirmed) {
            return;
        }

    }

    const { error } =
        await window.supabaseClient
            .from("clips")
            .update({
                status: newStatus,
                reject_reason:
                    newStatus === "rejected"
                    ? reason
                    : null
            })
            .eq("id", clipId);

    if (error) {

        console.error("Ошибка обновления статуса клипа:", error);

        alert("Не удалось обновить статус клипа.");

        return;

    }

    await loadPendingClips();

}


initModerationPage();

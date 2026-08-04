console.log("app.js загружен");

const CATEGORY_LABELS = {
    creativity: "🎨 Творчество",
    irl: "🌍 IRL зрителей",
    memes: "💀 Мемы",
    tiktok: "🎵 TikTok"
};


const clipsGrid = document.getElementById("clipsGrid");

const clipsEmptyState = document.getElementById("clipsEmptyState");

const statClips = document.getElementById("statClips");

const statAuthors = document.getElementById("statAuthors");

const statToday = document.getElementById("statToday");

const topClipSection = document.getElementById("topClipSection");

const topClipTitle = document.getElementById("topClipTitle");

const topClipMeta = document.getElementById("topClipMeta");

const topClipLink = document.getElementById("topClipLink");

const filterButtons =
    document.querySelectorAll(".clip-filters button");

const categoryCards =
    document.querySelectorAll(".category-card");

const clipsSearchInput =
    document.getElementById("clipsSearchInput");

const clipsSortSelect =
    document.getElementById("clipsSortSelect");


let allClips = [];


if (clipsGrid) {
    loadClips();
}


async function loadClips() {

    if (!window.supabaseClient) {

        console.error("Supabase клиент не найден");

        showEmptyState();

        return;

    }

    const {
        data,
        error
    } =
        await window.supabaseClient
            .from("clips")
            .select("*")
            .eq("status", "approved")
            .order("created_at", { ascending: false });

    if (error) {

        console.error("Ошибка загрузки клипов:", error);

        showEmptyState();

        return;

    }

    allClips = data || [];

    updateStats();

    updateTopClip();

    applyActiveFilter();

}


function updateStats() {

    if (!statClips) {
        return;
    }

    statClips.textContent =
        allClips.length;

    const uniqueAuthors =
        new Set(
            allClips.map(clip => clip.username || clip.user_id)
        );

    statAuthors.textContent =
        uniqueAuthors.size;

    const today =
        new Date().toDateString();

    const uploadedToday =
        allClips.filter(clip => {

            if (!clip.created_at) {
                return false;
            }

            return new Date(clip.created_at).toDateString() === today;

        });

    statToday.textContent =
        uploadedToday.length;

}


function updateTopClip() {

    if (!topClipSection || allClips.length === 0) {

        if (topClipSection) {
            topClipSection.hidden = true;
        }

        return;

    }

    const topClip =
        [...allClips].sort(
            (a, b) => (b.likes || 0) - (a.likes || 0)
        )[0];

    topClipTitle.textContent =
        topClip.title;

    topClipMeta.textContent =
        `@${topClip.username || "user"} • ❤️ ${topClip.likes || 0} • 👁 ${topClip.views || 0}`;

    topClipLink.href =
        `video.html?id=${topClip.id}`;

    const topClipPreview =
        document.getElementById("topClipPreview");

    if (topClipPreview && topClip.video_url) {

        topClipPreview.innerHTML = `
            <video muted preload="metadata" playsinline src="${topClip.video_url}"></video>
            <span class="thumb-play-icon">▶</span>
        `;

        primeThumbnailFrame(topClipPreview);

    }

    topClipSection.hidden = false;

}


function applyActiveFilter() {

    const activeButton =
        document.querySelector(".clip-filters button.active");

    const category =
        activeButton
        ? activeButton.dataset.category
        : "all";

    let filteredClips =

        !category || category === "all"

        ? allClips

        : allClips.filter(clip => clip.category === category);

    const searchQuery =
        clipsSearchInput
        ? clipsSearchInput.value.trim().toLowerCase()
        : "";

    if (searchQuery) {

        filteredClips = filteredClips.filter(clip => {

            const title =
                (clip.title || "").toLowerCase();

            const author =
                (clip.username || "").toLowerCase();

            return (
                title.includes(searchQuery) ||
                author.includes(searchQuery)
            );

        });

    }

    filteredClips =
        sortClips(filteredClips);

    renderClips(filteredClips);

}


function sortClips(clips) {

    const sortValue =
        clipsSortSelect
        ? clipsSortSelect.value
        : "newest";

    const sortedClips =
        [...clips];

    if (sortValue === "popular") {

        sortedClips.sort((a, b) => {

            const viewsDiff =
                (b.views || 0) - (a.views || 0);

            if (viewsDiff !== 0) {
                return viewsDiff;
            }

            return (b.likes || 0) - (a.likes || 0);

        });

    } else if (sortValue === "likes") {

        sortedClips.sort(
            (a, b) => (b.likes || 0) - (a.likes || 0)
        );

    } else {

        sortedClips.sort((a, b) => {

            const dateA =
                a.created_at
                ? new Date(a.created_at).getTime()
                : 0;

            const dateB =
                b.created_at
                ? new Date(b.created_at).getTime()
                : 0;

            return dateB - dateA;

        });

    }

    return sortedClips;

}


function setActiveCategory(category) {

    filterButtons.forEach(btn => {

        btn.classList.toggle(
            "active",
            btn.dataset.category === category
        );

    });

    applyActiveFilter();

}


filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        setActiveCategory(button.dataset.category);

    });

});


categoryCards.forEach(card => {

    card.addEventListener("click", () => {

        setActiveCategory(card.dataset.category);

        document.getElementById("clips").scrollIntoView({
            behavior: "smooth"
        });

    });

});


if (clipsSearchInput) {

    clipsSearchInput.addEventListener("input", () => {

        applyActiveFilter();

    });

}


if (clipsSortSelect) {

    clipsSortSelect.addEventListener("change", () => {

        applyActiveFilter();

    });

}


function showEmptyState() {

    if (clipsGrid) {
        clipsGrid.hidden = true;
    }

    if (clipsEmptyState) {
        clipsEmptyState.hidden = false;
    }

}


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


function renderClips(clipsToRender) {

    if (!clipsToRender || clipsToRender.length === 0) {

        clipsGrid.innerHTML = "";

        showEmptyState();

        return;

    }

    clipsGrid.hidden = false;

    clipsEmptyState.hidden = true;

    clipsGrid.innerHTML = "";


    clipsToRender.forEach(clip => {


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
                @${clip.username || "user"} ❤️ ${clip.likes || 0}
            </p>

        `;


        primeThumbnailFrame(card);


        card.addEventListener("click", () => {

            window.location.href = `video.html?id=${clip.id}`;

        });


        clipsGrid.appendChild(card);

    });

}


const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {
            entry.target.classList.add("show");
        }

    });

}, {
    threshold: 0.15
});

document.querySelectorAll(".fade-up,.fade-left,.fade-right").forEach(el => {
    observer.observe(el);
});

console.log("auth.js загружен");


// =========================
// ОБЩИЕ ФУНКЦИИ АВТОРИЗАЦИИ / РОЛЕЙ
// (используются в других *.js файлах: video.js, moderation.js и т.д.)
// =========================

async function getCurrentAuthUser() {

    if (!window.supabaseClient) {

        console.error("Supabase клиент не найден");

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


async function getUserRole(userId) {

    if (!window.supabaseClient || !userId) {
        return "user";
    }

    const {
        data,
        error
    } =
        await window.supabaseClient
            .from("roles")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle();

    if (error || !data) {

        if (error) {
            console.error("Ошибка получения роли пользователя:", error);
        }

        return "user";

    }

    return data.role || "user";

}


// =========================
// СОСТОЯНИЕ ШАПКИ САЙТА
// =========================

(async function initNavAuthState() {

    const navLoginLink =
        document.getElementById("navLoginLink");

    const navModerationLink =
        document.getElementById("navModerationLink");

    const user =
        await getCurrentAuthUser();

    if (!user) {
        // Пользователь не авторизован — кнопка "Войти" остаётся как есть,
        // ссылка на модерацию остаётся скрытой
        return;
    }

    if (navLoginLink) {

        const username =
            user.user_metadata.username || user.email;

        navLoginLink.textContent =
            "@" + username;

        navLoginLink.href =
            "profile.html";

    }

    if (navModerationLink) {

        const role =
            await getUserRole(user.id);

        if (role === "moderator" || role === "admin") {
            navModerationLink.hidden = false;
        }

    }

})();

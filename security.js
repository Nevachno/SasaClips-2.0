console.log("security.js загружен");

let currentUser = null;


async function initSecurityPage() {

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

    currentUser = data.user;

    setupEmailWarning(currentUser);

    setupChangePasswordForm(currentUser);

    setupDeleteAccount(currentUser);

    await loadLoginHistory(currentUser);

}


// =========================
// ПОДТВЕРЖДЕНИЕ ПОЧТЫ
// =========================

function setupEmailWarning(user) {

    const banner =
        document.getElementById("emailWarningBanner");

    const resendButton =
        document.getElementById("resendConfirmationButton");

    if (!banner) {
        return;
    }

    const isConfirmed =
        !!user.email_confirmed_at;

    banner.hidden = isConfirmed;

    if (isConfirmed) {
        return;
    }

    resendButton.addEventListener("click", async () => {

        resendButton.disabled = true;

        resendButton.textContent =
            "Отправляем...";

        const { error } =
            await window.supabaseClient.auth.resend({
                type: "signup",
                email: user.email
            });

        if (error) {

            alert("Не удалось отправить письмо: " + error.message);

        } else {

            alert("Письмо с подтверждением отправлено на " + user.email);

        }

        resendButton.disabled = false;

        resendButton.textContent =
            "Отправить письмо повторно";

    });

}


// =========================
// СМЕНА ПАРОЛЯ
// =========================

function setupChangePasswordForm(user) {

    const form =
        document.getElementById("changePasswordForm");

    const messageEl =
        document.getElementById("passwordMessage");

    const submitButton =
        document.getElementById("changePasswordButton");

    function showMessage(text, success) {

        messageEl.hidden = false;

        messageEl.textContent = text;

        messageEl.className =
            "upload-message " + (success ? "success" : "error");

    }

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const currentPassword =
            document.getElementById("currentPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmNewPassword =
            document.getElementById("confirmNewPassword").value;

        if (newPassword !== confirmNewPassword) {

            showMessage("Новые пароли не совпадают.", false);

            return;

        }

        if (newPassword.length < 8) {

            showMessage("Новый пароль должен быть не короче 8 символов.", false);

            return;

        }

        submitButton.disabled = true;

        submitButton.textContent =
            "Проверяем текущий пароль...";

        const { error: reauthError } =
            await window.supabaseClient.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            });

        if (reauthError) {

            showMessage("Текущий пароль указан неверно.", false);

            submitButton.disabled = false;

            submitButton.textContent =
                "Сменить пароль";

            return;

        }

        submitButton.textContent =
            "Сохраняем новый пароль...";

        const { error: updateError } =
            await window.supabaseClient.auth.updateUser({
                password: newPassword
            });

        submitButton.disabled = false;

        submitButton.textContent =
            "Сменить пароль";

        if (updateError) {

            showMessage(updateError.message, false);

            return;

        }

        showMessage("✅ Пароль успешно изменён!", true);

        form.reset();

    });

}


// =========================
// ИСТОРИЯ ВХОДОВ + УСТРОЙСТВА
// =========================

async function loadLoginHistory(user) {

    const listEl =
        document.getElementById("loginHistoryList");

    const emptyEl =
        document.getElementById("loginHistoryEmptyState");

    const {
        data: history,
        error
    } =
        await window.supabaseClient
            .from("login_history")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);

    if (error) {

        console.error("Ошибка загрузки истории входов:", error);

        emptyEl.hidden = false;

        return;

    }

    const entries =
        history || [];

    if (entries.length === 0) {

        emptyEl.hidden = false;

    } else {

        emptyEl.hidden = true;

        renderLoginHistory(entries);

    }

    renderDevices(entries);

}


function renderLoginHistory(entries) {

    const listEl =
        document.getElementById("loginHistoryList");

    listEl.innerHTML = "";

    const currentMarker =
        typeof getSessionMarker === "function"
        ? getSessionMarker()
        : null;

    entries.forEach(entry => {

        const row =
            document.createElement("div");

        row.className = "security-list-row";

        const isCurrent =
            currentMarker && entry.session_marker === currentMarker;

        const dateLabel =
            entry.created_at
            ? new Date(entry.created_at).toLocaleString("ru-RU")
            : "—";

        row.innerHTML = `

            <span class="security-list-icon">🕓</span>

            <div class="security-list-info">

                <strong></strong>

                <span></span>

            </div>

            ${
                isCurrent
                ? `<span class="security-current-badge">Текущий сеанс</span>`
                : ""
            }

        `;

        row.querySelector("strong").textContent =
            `${entry.browser || "Браузер"} • ${entry.os || "ОС"} • ${entry.device || "Устройство"}`;

        row.querySelector("span:not(.security-current-badge)").textContent =
            dateLabel;

        listEl.appendChild(row);

    });

}


function renderDevices(entries) {

    const listEl =
        document.getElementById("devicesList");

    const emptyEl =
        document.getElementById("devicesEmptyState");

    if (entries.length === 0) {

        listEl.hidden = true;

        emptyEl.hidden = false;

        return;

    }

    const currentMarker =
        typeof getSessionMarker === "function"
        ? getSessionMarker()
        : null;

    const deviceMap = {};

    entries.forEach(entry => {

        const key =
            `${entry.browser || "?"}|${entry.os || "?"}|${entry.device || "?"}`;

        if (
            !deviceMap[key] ||
            new Date(entry.created_at) > new Date(deviceMap[key].created_at)
        ) {

            deviceMap[key] = entry;

        }

    });

    const devices =
        Object.values(deviceMap).sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

    listEl.hidden = false;

    emptyEl.hidden = true;

    listEl.innerHTML = "";

    devices.forEach(entry => {

        const row =
            document.createElement("div");

        row.className = "security-list-row";

        const isCurrent =
            currentMarker && entry.session_marker === currentMarker;

        const dateLabel =
            entry.created_at
            ? new Date(entry.created_at).toLocaleDateString("ru-RU")
            : "—";

        const deviceIcon =

            entry.device === "Телефон"

            ? "📱"

            : entry.device === "Планшет"

            ? "📲"

            : "💻";

        row.innerHTML = `

            <span class="security-list-icon">${deviceIcon}</span>

            <div class="security-list-info">

                <strong></strong>

                <span></span>

            </div>

            ${
                isCurrent
                ? `<span class="security-current-badge">Это устройство</span>`
                : ""
            }

        `;

        row.querySelector("strong").textContent =
            `${entry.browser || "Браузер"} • ${entry.os || "ОС"}`;

        row.querySelector("span:not(.security-current-badge)").textContent =
            "Последний вход: " + dateLabel;

        listEl.appendChild(row);

    });

}


// =========================
// УДАЛЕНИЕ АККАУНТА
// =========================

function setupDeleteAccount(user) {

    const deleteButton =
        document.getElementById("deleteAccountButton");

    const messageEl =
        document.getElementById("deleteAccountMessage");

    deleteButton.addEventListener("click", async () => {

        const firstConfirm =
            confirm(
                "Ты точно хочешь удалить аккаунт? " +
                "Все твои клипы, лайки, комментарии и подписки будут удалены безвозвратно."
            );

        if (!firstConfirm) {
            return;
        }

        const typed =
            prompt(
                'Для подтверждения введи слово УДАЛИТЬ (заглавными буквами):'
            );

        if (typed !== "УДАЛИТЬ") {

            alert("Удаление отменено — слово введено неверно.");

            return;

        }

        deleteButton.disabled = true;

        deleteButton.textContent =
            "Удаляем данные...";

        try {

            await window.supabaseClient
                .from("comments")
                .delete()
                .eq("user_id", user.id);

            await window.supabaseClient
                .from("likes")
                .delete()
                .eq("user_id", user.id);

            await window.supabaseClient
                .from("subscriptions")
                .delete()
                .eq("follower_id", user.id);

            await window.supabaseClient
                .from("subscriptions")
                .delete()
                .eq("following_id", user.id);

            await window.supabaseClient
                .from("clips")
                .delete()
                .eq("user_id", user.id);

            await window.supabaseClient
                .from("login_history")
                .delete()
                .eq("user_id", user.id);

            await window.supabaseClient
                .from("public_profiles")
                .delete()
                .eq("user_id", user.id);

            await window.supabaseClient
                .from("roles")
                .delete()
                .eq("user_id", user.id);

        } catch (deleteError) {

            console.error("Ошибка при удалении данных аккаунта:", deleteError);

        }

        messageEl.hidden = false;

        messageEl.className = "upload-message success";

        messageEl.textContent =
            "✅ Данные аккаунта удалены. Выходим...";

        setTimeout(async () => {

            await window.supabaseClient.auth.signOut();

            window.location.replace("index.html");

        }, 1500);

    });

}


initSecurityPage();

console.log("reset-password.js загружен");

const resetPasswordForm =
    document.getElementById("resetPasswordForm");

const resetPasswordMessage =
    document.getElementById("resetPasswordMessage");

const resetPasswordButton =
    document.getElementById("resetPasswordButton");

const resetInvalidLinkMessage =
    document.getElementById("resetInvalidLinkMessage");


function showMessage(message, type) {

    resetPasswordMessage.textContent =
        message;

    resetPasswordMessage.className =
        `auth-message ${type}`;

    resetPasswordMessage.hidden =
        false;

}


// Supabase сама разбирает токен восстановления из ссылки
// и создаёт временную сессию — просто дожидаемся её.

window.supabaseClient.auth.onAuthStateChange((event) => {

    console.log("Auth event:", event);

    if (event === "PASSWORD_RECOVERY") {

        resetInvalidLinkMessage.hidden = true;

    }

});


(async function checkRecoverySession() {

    // Даём supabase-js время разобрать ссылку из адресной строки
    await new Promise(resolve => setTimeout(resolve, 800));

    const {
        data
    } =
        await window.supabaseClient.auth.getSession();

    if (!data.session) {

        resetInvalidLinkMessage.hidden = false;

        resetPasswordButton.disabled = true;

    }

})();


resetPasswordForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const newPassword =
            document.getElementById(
                "resetNewPassword"
            ).value;

        const confirmPassword =
            document.getElementById(
                "resetConfirmPassword"
            ).value;

        if (newPassword !== confirmPassword) {

            showMessage(
                "Пароли не совпадают.",
                "error"
            );

            return;

        }

        if (newPassword.length < 8) {

            showMessage(
                "Пароль должен быть не короче 8 символов.",
                "error"
            );

            return;

        }

        resetPasswordButton.disabled = true;

        resetPasswordButton.textContent =
            "Сохраняем...";

        try {

            const { error } =
                await window.supabaseClient.auth.updateUser({
                    password: newPassword
                });

            if (error) {

                showMessage(
                    error.message,
                    "error"
                );

                return;

            }

            showMessage(
                "✅ Пароль обновлён! Сейчас перекинем на вход...",
                "success"
            );

            await window.supabaseClient.auth.signOut();

            setTimeout(
                function () {

                    window.location.href =
                        "login.html";

                },
                1800
            );

        } catch (unexpectedError) {

            console.error("Ошибка сохранения нового пароля:", unexpectedError);

            showMessage(
                "Произошла ошибка: " + (unexpectedError.message || unexpectedError),
                "error"
            );

        } finally {

            resetPasswordButton.disabled = false;

            resetPasswordButton.textContent =
                "Сохранить новый пароль";

        }

    }
);

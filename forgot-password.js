console.log("forgot-password.js загружен");

const forgotPasswordForm =
    document.getElementById("forgotPasswordForm");

const forgotPasswordMessage =
    document.getElementById("forgotPasswordMessage");

const forgotPasswordButton =
    document.getElementById("forgotPasswordButton");


function showMessage(message, type) {

    forgotPasswordMessage.textContent =
        message;

    forgotPasswordMessage.className =
        `auth-message ${type}`;

    forgotPasswordMessage.hidden =
        false;

}


forgotPasswordForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const email =
            document.getElementById(
                "forgotEmail"
            ).value.trim();

        if (!email) {

            showMessage(
                "Введите email.",
                "error"
            );

            return;

        }

        forgotPasswordButton.disabled = true;

        forgotPasswordButton.textContent =
            "Отправляем...";

        showMessage(
            "Отправляем письмо...",
            "success"
        );

        try {

            const redirectUrl =
                window.location.origin +
                window.location.pathname.replace("forgot-password.html", "reset-password.html");

            const { error } =
                await window.supabaseClient.auth.resetPasswordForEmail(
                    email,
                    { redirectTo: redirectUrl }
                );

            if (error) {

                showMessage(
                    error.message,
                    "error"
                );

                return;

            }

            showMessage(
                "✅ Если такой email зарегистрирован — письмо со ссылкой для сброса пароля уже отправлено. Проверь почту (и папку «Спам»).",
                "success"
            );

            forgotPasswordForm.reset();

        } catch (unexpectedError) {

            console.error("Ошибка запроса сброса пароля:", unexpectedError);

            showMessage(
                "Произошла ошибка: " + (unexpectedError.message || unexpectedError),
                "error"
            );

        } finally {

            forgotPasswordButton.disabled = false;

            forgotPasswordButton.textContent =
                "Отправить ссылку";

        }

    }
);

const registerForm =
    document.getElementById("registerForm");

const registerMessage =
    document.getElementById("registerMessage");

const usernameInput =
    document.getElementById("registerUsername");

const emailInput =
    document.getElementById("registerEmail");

const passwordInput =
    document.getElementById("registerPassword");


registerForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const username =
            usernameInput.value.trim();


        const email =
            emailInput.value.trim();


        const password =
            passwordInput.value;


        if (username.length < 3) {

            showMessage(
                "Никнейм должен содержать минимум 3 символа.",
                "error"
            );

            return;

        }


        if (password.length < 8) {

            showMessage(
                "Пароль должен содержать минимум 8 символов.",
                "error"
            );

            return;

        }


        showMessage(
            "Создаём аккаунт...",
            "success"
        );


        const {
            data,
            error
        } =
            await window.supabaseClient.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {

                        username: username

                    }

                }

            });


        if (error) {

            showMessage(
                error.message,
                "error"
            );

            return;

        }


        showMessage(
            "✅ Аккаунт успешно создан!",
            "success"
        );


        setTimeout(
            function () {

                window.location.href =
                    "login.html";

            },
            1200
        );

    }
);


function showMessage(
    message,
    type
) {

    registerMessage.textContent =
        message;


    registerMessage.className =
        `auth-message ${type}`;


    registerMessage.hidden =
        false;

}
console.log("login.js загружен");
const loginForm =
    document.getElementById("loginForm");

const loginMessage =
    document.getElementById("loginMessage");


loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();
        console.log("Кнопка входа нажата");

        const email =
            document.getElementById(
                "loginEmail"
            ).value.trim();


        const password =
            document.getElementById(
                "loginPassword"
            ).value;


        showMessage(
            "Входим...",
            "success"
        );


        const {
            data,
            error
        } =
            await window.supabaseClient.auth.signInWithPassword({

                email: email,

                password: password

            });


        if (error) {

            showMessage(
                error.message,
                "error"
            );

            return;

        }


        console.log("Вошёл:", data.user);
        showMessage(
            "✅ Успешный вход!",
            "success"
        );

        await recordLoginHistory(data.user);


        setTimeout(
            function () {

                window.location.href =
                    "index.html";

            },
            1000
        );

    }
);


async function recordLoginHistory(user) {

    if (typeof parseUserAgent !== "function" || typeof getSessionMarker !== "function") {
        return;
    }

    const { browser, os, device } =
        parseUserAgent();

    const { error } =
        await window.supabaseClient
            .from("login_history")
            .insert({
                user_id: user.id,
                browser: browser,
                os: os,
                device: device,
                user_agent: navigator.userAgent,
                session_marker: getSessionMarker()
            });

    if (error) {
        console.error("Не удалось записать историю входа:", error);
    }

}


function showMessage(
    message,
    type
) {

    loginMessage.textContent =
        message;

    loginMessage.className =
        `auth-message ${type}`;

    loginMessage.hidden =
        false;

}
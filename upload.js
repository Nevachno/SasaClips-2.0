console.log("upload.js загружен");

const supabaseClient = window.supabaseClient;

const uploadForm = document.getElementById("uploadForm");

const videoFile = document.getElementById("videoFile");

const dropZone = document.getElementById("dropZone");

const selectedFile = document.getElementById("selectedFile");

const fileName = document.getElementById("fileName");

const fileDetails = document.getElementById("fileDetails");

const removeFile = document.getElementById("removeFile");

const previewContainer = document.getElementById("previewContainer");

const videoPreview = document.getElementById("videoPreview");

const progressContainer = document.getElementById("progressContainer");

const progressFill = document.getElementById("progressFill");

const progressPercent = document.getElementById("progressPercent");

const uploadMessage = document.getElementById("uploadMessage");

const submitButton = document.getElementById("submitButton");

async function getCurrentUser() {

    const {
        data,
        error
    } =
    await supabaseClient.auth.getUser();

    if (error || !data.user) {

        alert("Сначала войдите в аккаунт.");

        window.location.href =
            "login.html";

        return null;

    }

    return data.user;

}

getCurrentUser();

videoFile.addEventListener(
    "change",
    function () {

        const file =
            videoFile.files[0];

        if (!file)
            return;

        if (file.type !== "video/mp4") {

            alert("Можно выбрать только MP4");

            videoFile.value = "";

            return;

        }

        const url =
            URL.createObjectURL(file);

        fileName.textContent =
            file.name;

        fileDetails.textContent =
            `${(file.size / 1024 / 1024).toFixed(2)} MB`;

        selectedFile.hidden =
            false;

        previewContainer.hidden =
            false;

        dropZone.style.display =
            "none";

        videoPreview.src =
            url;

    }
);

removeFile.addEventListener(
    "click",
    function () {

        videoFile.value = "";

        selectedFile.hidden =
            true;

        previewContainer.hidden =
            true;

        dropZone.style.display =
            "flex";

        videoPreview.src = "";

    }
);

function showMessage(text, success = true) {

    uploadMessage.hidden = false;

    uploadMessage.textContent = text;

    uploadMessage.className =
        success
        ? "upload-message success"
        : "upload-message error";

}

function setProgress(value) {

    progressContainer.hidden = false;

    progressFill.style.width =
        value + "%";

    progressPercent.textContent =
        value + "%";

}

uploadForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const user =
            await getCurrentUser();

        if (!user)
            return;

        const file =
            videoFile.files[0];

        if (!file) {

            showMessage(
                "Выберите MP4",
                false
            );

            return;

        }

        const title =
            document.getElementById(
                "videoTitle"
            ).value.trim();

        const description =
            document.getElementById(
                "videoDescription"
            ).value.trim();

        const socialLinks =
            document.getElementById(
                "videoSocial"
            ).value.trim();

        const category =
            document.getElementById(
                "videoCategory"
            ).value;

        if (!title) {

    showMessage(
        "Введите название клипа",
        false
    );

    return;

}

if (!category) {

    showMessage(
        "Выберите категорию клипа",
        false
    );

    return;

}

uploadMessage.hidden = true;

progressContainer.hidden = true;

submitButton.disabled =
    true;

        submitButton.textContent =
            "Загрузка...";

        setProgress(10);

        const extension =
            file.name.split(".").pop();

        const fileNameStorage =
            `${Date.now()}_${crypto.randomUUID()}.${extension}`;

        const {

            error: uploadError

        } =
        await supabaseClient.storage

        .from("clips")

        .upload(

            fileNameStorage,

            file,

            {

                cacheControl: "3600",

                upsert: false

            }

        );

        if (uploadError) {

            console.error(uploadError);

            showMessage(

                uploadError.message,

                false

            );

            submitButton.disabled =
                false;

            submitButton.textContent =
                "🚀 Отправить на модерацию";

            return;

        }

        setProgress(60);

        const {

            data: publicData

        } =
        supabaseClient.storage

        .from("clips")

        .getPublicUrl(

            fileNameStorage

        );

        const videoUrl =
            publicData.publicUrl;

        const {

            data: insertedClip,

            error: insertError

        } =
        await supabaseClient

        .from("clips")

        .insert({

            title: title,

            description: description,

            video_url: videoUrl,

            category: category,

            social_links:
                socialLinks || null,

            username:
                user.user_metadata.username ||
                user.email,

            user_id:
                user.id,

            likes: 0,

            views: 0,

            status: "pending"

        })

        .select()

        .single();

        if (insertError) {

            console.error(insertError);

            showMessage(
                insertError.message,
                false
            );

            submitButton.disabled =
                false;

            submitButton.textContent =
                "🚀 Отправить на модерацию";

            return;

        }

        setProgress(100);

        showMessage(
            "✅ Клип отправлен на модерацию!",
            true
        );

        setTimeout(
            function () {

                window.location.href =
                    `video.html?id=${insertedClip.id}`;

            },
            1500
        );

    }
);
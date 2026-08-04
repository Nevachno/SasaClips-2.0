console.log("device-info.js загружен");


// =========================
// РАЗБОР БРАУЗЕРА / ОС / УСТРОЙСТВА ИЗ USER AGENT
// Используется в login.js (запись входа) и security.js (отображение)
// =========================

function parseUserAgent(userAgentString) {

    const ua =
        userAgentString || navigator.userAgent;

    let browser = "Неизвестный браузер";

    if (/Edg\//.test(ua)) {
        browser = "Microsoft Edge";
    } else if (/OPR\//.test(ua) || /Opera/.test(ua)) {
        browser = "Opera";
    } else if (/YaBrowser/.test(ua)) {
        browser = "Яндекс Браузер";
    } else if (/SamsungBrowser/.test(ua)) {
        browser = "Samsung Internet";
    } else if (/Firefox\//.test(ua)) {
        browser = "Firefox";
    } else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) {
        browser = "Chrome";
    } else if (/Safari\//.test(ua) && /Version\//.test(ua)) {
        browser = "Safari";
    }

    let os = "Неизвестная ОС";

    if (/Windows NT/.test(ua)) {
        os = "Windows";
    } else if (/Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua)) {
        os = "macOS";
    } else if (/Android/.test(ua)) {
        os = "Android";
    } else if (/iPhone|iPad|iPod/.test(ua)) {
        os = "iOS";
    } else if (/Linux/.test(ua)) {
        os = "Linux";
    }

    let device = "Компьютер";

    if (/iPad/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) {
        device = "Планшет";
    } else if (/Mobi|iPhone/.test(ua)) {
        device = "Телефон";
    }

    return { browser, os, device };

}


// =========================
// МЕТКА ТЕКУЩЕГО УСТРОЙСТВА/СЕАНСА
// Хранится в localStorage, чтобы отличить "это устройство"
// от остальных в списке устройств
// =========================

function getSessionMarker() {

    const storageKey =
        "sasaclips_session_marker";

    let marker =
        localStorage.getItem(storageKey);

    if (!marker) {

        marker =
            (window.crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : `${Date.now()}_${Math.random().toString(36).slice(2)}`;

        localStorage.setItem(storageKey, marker);

    }

    return marker;

}

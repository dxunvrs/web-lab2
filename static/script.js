document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.querySelector(".graph-canvas");
    const ctx = canvas.getContext("2d"); // контекст рисования

    const form = document.querySelector(".point-form");
    const xCheckboxes = document.querySelectorAll(".x-checkbox");
    const yInput = document.querySelector(".y-input");
    const rSelect = document.querySelector(".r-select");
    const clearBtn = document.querySelector("#clear-btn");
    const historyBody = document.querySelector(".history-body");

    const xError = document.querySelector("#x-error");
    const yError = document.querySelector("#y-error");
    const rError = document.querySelector("#r-error");

    const STORAGE_KEY = "web-lab1";

    const EPS = 1e-12; // для точности границ

    function checkHit(x, y, r) {
        if (x >= -EPS && y >= -EPS) {
            // первая четверть, на рисунке окружность
            return (x*x +y*y) <= r*r/4;
        }
        if (x <= EPS && y >= -EPS) {
            // вторая четверть, на рисунке прямоугольник
            return x >= -r && y <= r/2;
        }
        if (x >= -EPS && y <= EPS) {
            // четвертая четверть: треугольник
            return y >= (x-r/2);
        }
        return false;
    }

    function drawCanvas(r) {
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width/2;
        const centerY = height/2;

        const scale = (centerX-30)/5;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "lightsteelblue";

        // первая четверть
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, (r / 2) * scale, -Math.PI / 2, 0, false);
        ctx.closePath();
        ctx.fill();

        // вторая четверть
        ctx.beginPath();
        ctx.rect(centerX - r * scale, centerY - (r / 2) * scale, r * scale, (r / 2) * scale);
        ctx.fill();

        // четвертая четверть
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + (r / 2) * scale, centerY);
        ctx.lineTo(centerX, centerY + (r / 2) * scale);
        ctx.closePath();
        ctx.fill();

        // оси
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
        ctx.lineWidth = 1.8;
        ctx.font = "12px sans-serif";

        // x
        ctx.beginPath();
        ctx.moveTo(15, centerY);
        ctx.lineTo(width - 15, centerY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(width - 15, centerY);
        ctx.lineTo(width - 25, centerY - 5);
        ctx.lineTo(width - 25, centerY + 5);
        ctx.fill();
        ctx.fillText("x", width - 15, centerY - 10);

        // y
        ctx.beginPath();
        ctx.moveTo(centerX, height - 15);
        ctx.lineTo(centerX, 15);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, 15);
        ctx.lineTo(centerX - 5, 25);
        ctx.lineTo(centerX + 5, 25);
        ctx.fill();
        ctx.fillText("y", centerX + 10, 20);

        // засечки
        const points = [
            { val: -r, text: `${-r}` },
            { val: -r / 2, text: `${-r/2}` },
            { val: r / 2, text: `${r/2}` },
            { val: r, text: `${r}` }
        ];

        ctx.lineWidth = 1.2;
        points.forEach(pt => {
            const offset = pt.val * scale;

            // x
            ctx.beginPath();
            ctx.moveTo(centerX + offset, centerY - 4);
            ctx.lineTo(centerX + offset, centerY + 4);
            ctx.stroke();
            ctx.fillText(pt.text, centerX + offset - 10, centerY + 18);

            // y
            ctx.beginPath();
            ctx.moveTo(centerX - 4, centerY - offset);
            ctx.lineTo(centerX + 4, centerY - offset);
            ctx.stroke();
            ctx.fillText(pt.text, centerX + 8, centerY - offset + 4);
        });

        ctx.fillText("0", centerX - 12, centerY + 14);

        // отрисовка точек
        const history = loadHistory();
        history.forEach(pt => {
            const pixelX = centerX + pt.x * scale;
            const pixelY = centerY - pt.y * scale;

            const isPointHit = checkHit(pt.x, pt.y, r);

            ctx.beginPath();
            ctx.arc(pixelX, pixelY, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = isPointHit ? "green" : "red";
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }

    function formatDateTime(timestamp) {
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZoneName: "short"
        }).format(date);
    }

    function loadHistory() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveHistory(history) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    function renderTable() {
        const history = loadHistory();
        historyBody.innerHTML = "";

        history.forEach(item => {
            const tr = document.createElement("tr");

            const tdX = document.createElement("td");
            tdX.textContent = item.x;
            tr.appendChild(tdX);

            const tdY = document.createElement("td");
            tdY.textContent = item.y;
            tr.appendChild(tdY);

            const tdR = document.createElement("td");
            tdR.textContent = item.r;
            tr.appendChild(tdR);

            const tdResult = document.createElement("td");
            tdResult.textContent = item.hit ? "Попадание" : "Промах";
            tdResult.style.fontWeight = "bold";
            tdResult.style.color = item.hit ? "green" : "red";
            tr.appendChild(tdResult);

            const tdTime = document.createElement("td");
            tdTime.textContent = formatDateTime(item.timestamp);
            tr.append(tdTime);

            historyBody.appendChild(tr);
        });
    }

    function validateAndSubmit(e) {
        e.preventDefault();

        xError.textContent = "";
        yError.textContent = "";
        rError.textContent = "";

        let isValid = true;

        // валидация x
        const allowedX = ["-5", "-4", "-3", "-2", "-1", "0", "1", "2", "3"]
        let selectedX = Array.from(xCheckboxes).filter(x => x.checked);

        selectedX = selectedX.filter(x => {
            if (!allowedX.includes(x.value)) {
                xError.textContent += " значение X " + x.value + " не разрешено\n";
                return false;
            }
            return true;
        });

        if (selectedX.length === 0) {
            xError.textContent = "Выберите хотя бы одно значение X";
            isValid = false;
        }

        // валидация y
        const yRaw = yInput.value.trim().replace(",", ".");
        const yRegex = /^-?[0-4](\.\d+)?$/;
        const numRegex = /^-?\d+(\.\d+)?$/;

        if (yRaw === "") {
            yError.textContent = "Заполните поле Y";
            isValid = false;
        } else if (!numRegex.test(yRaw)) {
            yError.textContent = "Y должен быть действительным числом";
            isValid = false;
        } else if (!yRegex.test(yRaw)) {
            yError.textContent = "Число Y должно строго принадлежать интервалу от -5 до 5";
            isValid = false;
        }

        // валидация r
        const allowedR = ["1", "1.5", "2", "2.5", "3"];
        const rVal = rSelect.value;
        const rNum = parseFloat(rVal);

        if (!allowedR.includes(rVal) || isNaN(rNum) || rNum <= 0) {
            rError.textContent = "Недопустимое значение радиуса";
            isValid = false;
        }

        if (!isValid) return;

        // переменные для сохранения
        const currentTimestamp = Date.now();
        const history = loadHistory();
        const cleanY = parseFloat(yRaw);

        // проверяем каждую выбранную точку
        selectedX.forEach(cb => {
            const cleanX = parseFloat(cb.value);
            const hit = checkHit(cleanX, cleanY, rNum);

            history.unshift({
                x: cb.value,
                y: yRaw,
                r: rVal,
                hit: hit,
                timestamp: currentTimestamp
            });
        });

        // сохраняем в localStorage и перерисовываем
        saveHistory(history);
        renderTable();
        drawCanvas(rNum);
    }

    form.addEventListener("submit", validateAndSubmit);

    rSelect.addEventListener("change", () => {
        const currentR = parseFloat(rSelect.value) || 2;
        drawCanvas(currentR);
    });

    clearBtn.addEventListener("click", () => {
        localStorage.removeItem(STORAGE_KEY);
        renderTable();
        drawCanvas(parseFloat(rSelect.value) || 2);
    });

    const initialR = parseFloat(rSelect.value) || 2;
    renderTable();
    drawCanvas(initialR);

    // бегающий гном
    const N_SEC = 15; // 15
    const K_SEC = 7; // 7

    let gnomeEl = null;
    let gnomeTimer = null;
    let moveInterval = null;

    function showGnomeMsg(message, isMiss = false) {
        const oldMsg = document.querySelector(".gnome-msg");
        if (oldMsg) {
            oldMsg.remove();
        }

        const msg = document.createElement("div");
        msg.className = `gnome-msg ${isMiss ? "gnome-miss" : ""}`;
        msg.textContent = message;
        document.body.appendChild(msg);

        msg.addEventListener("animationend", () => msg.remove());
    }

    function moveGnome() {
        if (!gnomeEl) {
            return;
        }

        const maxX = window.innerWidth - 70;
        const maxY = window.innerHeight - 70;
        const randomX = Math.floor(Math.random() * Math.max(maxX, 0));
        const randomY = Math.floor(Math.random() * Math.max(maxY, 0));

        gnomeEl.style.left = `${randomX}px`;
        gnomeEl.style.top = `${randomY}px`;
    }

    function removeGnome() {
        clearTimeout(gnomeTimer);
        clearInterval(moveInterval);

        if (gnomeEl) {
            gnomeEl.remove();
            gnomeEl = null;
        }
    }

    function onGnomeCatch() {
        removeGnome();
        showGnomeMsg("Ура, вы поймали гнома!")
    }

    function onGnomeMiss() {
        removeGnome();
        const history = loadHistory();

        if (history.length > 0) {
            const randomIndex = Math.floor(Math.random() * history.length);
            const stolenPoint = history.splice(randomIndex, 1)[0];

            saveHistory(history);
            renderTable();
            drawCanvas(parseFloat(rSelect.value) || 2);
            showGnomeMsg(`Время вышло, гном украл точку (${stolenPoint.x}, ${stolenPoint.y})`, true);
        } else {
            showGnomeMsg(`Время вышло, точек нет и гном убежал ни с чем`);
        }
    }

    function spawnGnome() {
        if (gnomeEl) {
            removeGnome();
        }

        gnomeEl = document.createElement("img");
        gnomeEl.className = "gnome";
        gnomeEl.src = "assets/gnome.png";
        document.body.appendChild(gnomeEl);

        moveGnome();
        moveInterval = setInterval(moveGnome, 1200);

        gnomeEl.addEventListener("mousedown", onGnomeCatch);

        gnomeTimer = setTimeout(onGnomeMiss, K_SEC * 1000);
    }

    setInterval(spawnGnome, N_SEC * 1000);
});

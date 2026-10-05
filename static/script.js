document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.querySelector(".graph-canvas");
    const ctx = canvas.getContext("2d"); // контекст рисования

    const form = document.querySelector(".point-form");
    const xInput = document.querySelector(".x-input");
    const yInput = document.querySelector(".y-input");
    const rRadios = document.querySelectorAll("input[name='r-val']");
    const clearBtn = document.querySelector("#clear-btn");
    const historyBody = document.querySelector(".history-body");

    const xError = document.querySelector("#x-error");
    const yError = document.querySelector("#y-error");
    const rError = document.querySelector("#r-error");

    const STORAGE_KEY = "web-lab2";

    function checkHit(x, y, r) {
        if (x >= -Number.EPSILON && y >= -Number.EPSILON) {
            return x <= r && y <= r / 2; // прямоугольник
        }
        if (x <= Number.EPSILON && y >= -Number.EPSILON) {
            return y <= (x * 1 / 2 + r / 2); // треугольник
        }
        if (x <= -Number.EPSILON && y <= Number.EPSILON) {
            return (x * x + y * y) <= r * r; // окружность
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
        ctx.rect(centerX, centerY - (r / 2) * scale, r * scale, (r / 2) * scale);
        ctx.fill();

        // вторая четверть
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - r * scale, centerY);
        ctx.lineTo(centerX, centerY - (r / 2) * scale);
        ctx.closePath();
        ctx.fill();

        // третья четверть
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, r * scale, Math.PI, Math.PI / 2, true);
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
        const numRegex = /^-?\d+(\.\d+)?$/;

        // валидация x
        const xRaw = xInput.value.trim().replace(",", ".");
        const xRegex = /^([0-4]|-[0-2])(\.\d+)?$/;
        if (xRaw === "") {
            xError.textContent = "Заполните поле X";
            isValid = false;
        } else if (!numRegex.test(xRaw)) {
            xError.textContent = "X должен быть действительным числом";
            isValid = false;
        } else if (!xRegex.test(xRaw)) {
            xError.textContent = "Число X должно строго принадлежать интервалу от -3 до 5";
            isValid = false;
        }

        // валидация y
        const yRaw = yInput.value.trim().replace(",", ".");
        const yRegex = /^-?[0-4](\.\d+)?$/;

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
        let checkedR = null;
        rRadios.forEach((radio) => {
            if (radio.checked) {
                checkedR = radio;
            }
        })
        if (!checkedR) {
            rError.textContent = "Выберите значение радиуса R";
            isValid = false;
            return;
        }

        const rVal = checkedR.value;
        const rNum = parseFloat(rVal);

        if (!allowedR.includes(rVal) || isNaN(rNum) || rNum <= 0) {
            rError.textContent = "Недопустимое значение радиуса";
            isValid = false;
        }

        if (!isValid) return;

        // переменные для сохранения
        const currentTimestamp = Date.now();
        const history = loadHistory();
        const cleanX = parseFloat(xRaw);
        const cleanY = parseFloat(yRaw);

        // отправляем точку
        const hit = checkHit(cleanX, cleanY, rNum)
        history.unshift({
            x: xRaw,
            y: yRaw,
            r: rVal,
            hit: hit,
            timestamp: currentTimestamp
        });

        // сохраняем в localStorage и перерисовываем
        saveHistory(history);
        renderTable();
        drawCanvas(rNum);
    }

    function getRValue() {
        const checkedR = document.querySelector("input[name='r-val']:checked");
        return checkedR ? checkedR.value : 1;
    }

    form.addEventListener("submit", validateAndSubmit);

    rRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            const currentR = parseFloat(radio.value) || 1;
            drawCanvas(currentR);
        });
    });

    clearBtn.addEventListener("click", () => {
        localStorage.removeItem(STORAGE_KEY);
        renderTable();
        drawCanvas(getRValue())
    });

    renderTable();
    drawCanvas(getRValue());
});

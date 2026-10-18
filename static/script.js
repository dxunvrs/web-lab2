document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.querySelector(".graph-canvas");
    const ctx = canvas.getContext("2d"); // контекст рисования

    const form = document.querySelector(".point-form");
    const xInput = document.querySelector(".x-input");
    const yInput = document.querySelector(".y-input");
    const rRadios = document.querySelectorAll("input[name='r-val']");
    const clearBtn = document.querySelector("#clear-btn");
    const submitBtn = document.querySelector("#submit-btn");
    const historyBody = document.querySelector(".history-body");

    const xError = document.querySelector("#x-error");
    const yError = document.querySelector("#y-error");
    const rError = document.querySelector("#r-error");
    const serverError = document.querySelector("#server-error");

    const STORAGE_KEY = "web-lab2";

    function clearErrors() {
        xError.textContent = "";
        yError.textContent = "";
        rError.textContent = "";
        serverError.textContent = "";
    }

    function getRValue() {
        const checkedR = document.querySelector("input[name='r-val']:checked");
        return checkedR ? checkedR.value : 1;
    }

    function validateX(raw) {
        const xRegex = /^([0-4]|-[0-2])(\.\d+)?$/;
        const numRegex = /^-?\d+(\.\d+)?$/;

        if (raw === "") {
            return "Заполните поле X";
        } else if (!numRegex.test(raw)) {
            return "X должен быть действительным числом";
        } else if (!xRegex.test(raw)) {
            return "Число X должно строго принадлежать интервалу от -3 до 5";
        }
    }

    function validateY(raw) {
        const yRegex = /^-?[0-4](\.\d+)?$/;
        const numRegex = /^-?\d+(\.\d+)?$/;

        if (raw === "") {
            return "Заполните поле Y";
        } else if (!numRegex.test(raw)) {
            return "Y должен быть действительным числом";
        } else if (!yRegex.test(raw)) {
            return "Число Y должно строго принадлежать интервалу от -5 до 5";
        }
    }

    function validateR(val) {
        const allowedR = ["1", "1.5", "2", "2.5", "3"];
        const rNum = parseFloat(val);

        if (!allowedR.includes(val) || isNaN(rNum) || rNum <= 0) {
            return "Недопустимое значение радиуса";
        }
    }

    function validateFormInputs() {
        clearErrors();

        const xRaw = xInput.value.trim().replace(",", ".");
        const yRaw = yInput.value.trim().replace(",", ".");
        const checkedR = document.querySelector("input[name='r-val']:checked");

        const xErr = validateX(xRaw);
        const yErr = validateY(yRaw);
        const rErr = validateR(checkedR ? checkedR.value : null);

        if (xErr) xError.textContent = xErr;
        if (yErr) yError.textContent = yErr;
        if (rErr) rError.textContent = rErr;

        if (xErr || yErr || rErr) {
            return { isValid: false };
        }

        return {
            isValid: true,
            x: xRaw,
            y: yRaw,
            r: checkedR.value,
            rNum: parseFloat(checkedR.value)
        };
    }

    async function requestPoint(x, y, r) {
        const url = `/fcgi-bin/server.jar?x=${x}&y=${y}&r=${r}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        const data = await response.json();
        if (data.status === "error") {
            throw new Error(data.message || "Ошибка сервера");
        }
        return data;
    }

    async function checkHit(x, y, r) {
        try {
            const data = await requestPoint(x, y, r);
            return data.hit;
        } catch (e) {
            return false;
        }
    }

    async function sendRequest(x, y, r) {
        clearErrors();
        submitBtn.disabled = true;

        try {
            const data = await requestPoint(x, y, r);

            const history = loadHistory();
            history.unshift({
                x: x,
                y: y,
                r: r,
                hit: data.hit,
                execTime: data.executionTime,
                serverTime: data.serverTime
            });
            saveHistory(history);
            renderTable();
            await drawCanvas(r);
        } catch (error) {
            serverError.textContent = error.message;
        } finally {
            submitBtn.disabled = false;
        }
    }

    async function drawCanvas(r) {
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        const scale = (centerX - 30) / 5;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "lightsteelblue";

        // первая четверть
        ctx.beginPath();
        ctx.rect(
            centerX,
            centerY - (r / 2) * scale,
            r * scale,
            (r / 2) * scale,
        );
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
            { val: -r / 2, text: `${-r / 2}` },
            { val: r / 2, text: `${r / 2}` },
            { val: r, text: `${r}` },
        ];

        ctx.lineWidth = 1.2;
        points.forEach((pt) => {
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
        const evalPoints = await Promise.all(
            history.map(async (pt) => {
                let hit = pt.hit;
                if (parseFloat(pt.r) != parseFloat(r)) {
                    hit = await checkHit(pt.x, pt.y, r);
                }
                return { x: pt.x, y: pt.y, hit: hit };
            })
        );

        evalPoints.forEach((pt) => {
            const pixelX = centerX + pt.x * scale;
            const pixelY = centerY - pt.y * scale;

            ctx.beginPath();
            ctx.arc(pixelX, pixelY, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = pt.hit ? "green" : "red";
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.stroke();
        });
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

        history.forEach((item) => {
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

            const tdServerTime = document.createElement("td");
            tdServerTime.textContent = item.serverTime;
            tr.append(tdServerTime);

            const tdExecTime = document.createElement("td");
            tdExecTime.textContent = item.execTime + " мс";
            tr.appendChild(tdExecTime);

            historyBody.appendChild(tr);
        });
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const validation = validateFormInputs();
        if (!validation.isValid) {
            return;
        }

        await sendRequest(validation.x, validation.y, validation.r);
    });

    rRadios.forEach((radio) => {
        radio.addEventListener("change", async () => {
            const currentR = parseFloat(radio.value) || 1;
            await drawCanvas(currentR);
        });
    });

    clearBtn.addEventListener("click", async () => {
        localStorage.removeItem(STORAGE_KEY);
        renderTable();
        await drawCanvas(getRValue());
    });

    canvas.addEventListener("click", async (event) => {
        clearErrors();

        const rErr = validateR(getRValue());
        if (rErr) {
            rError.textContent = "Сначала выберите значение R!";
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = (centerX - 30) / 5;

        let mathX = (clickX - centerX) / scale;
        let mathY = (centerY - clickY) / scale;

        mathX = parseFloat(mathX.toFixed(3));
        mathY = parseFloat(mathY.toFixed(3));

        const xErr = validateX(`${mathX}`);
        const yErr = validateY(`${mathY}`);

        if (xErr) xError.textContent = xErr;
        if (yErr) yError.textContent = yErr;
        if (xErr || yErr) return;

        sendRequest(mathX, mathY, getRValue());
    });

    renderTable();
    drawCanvas(getRValue());
});

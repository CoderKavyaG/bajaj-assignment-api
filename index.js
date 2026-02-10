import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const email = "kavya0543.be23@chitkara.edu.in";

app.use(express.json({ limit: "10kb" }));
app.use(cors());

const safeError = (res, status, msg) =>
    res.status(status).json({
        is_success: false,
        official_email: email,
        data: msg
    });

const isPrime = (n) => {
    if (n < 2) return false;

    for (let i = 2; i * i <= n; i++) {
        if (n % i === 0) {
            return false;
        }
    }
    return true;
};

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const lcm = (a, b) => (a * b) / gcd(a, b);

app.get("/health", (_, res) => {
    res.status(200).json({
        is_success: true,
        official_email: email
    });
});

app.post("/bfhl", async (req, res) => {
    try {
        if (!req.body || typeof req.body !== "object") {
            return safeError(res, 400, "Invalid JSON body");
        }

        if (Object.prototype.hasOwnProperty.call(req.body, "__proto__")) {
            return safeError(res, 400, "Invalid input");
        }

        const keys = Object.keys(req.body);

        if (keys.length !== 1) {
            return safeError(res, 400, "Exactly one key is required");
        }

        const key = keys[0];
        const value = req.body[key];

        const allowedKeys = ["fibonacci", "prime", "lcm", "hcf", "AI"];
        if (!allowedKeys.includes(key)) {
            return safeError(res, 400, "Invalid key");
        }

        let result;

        if (key === "fibonacci") {
            if (!Number.isInteger(value) || value < 0 || value > 1000) {
                return safeError(res, 400, "Invalid fibonacci input");
            }

            result = [];
            let a = 0, b = 1;
            for (let i = 0; i < value; i++) {
                result.push(a);
                [a, b] = [b, a + b];
            }
        }

        if (key === "prime") {
            if (!Array.isArray(value) || value.length === 0) {
                return safeError(res, 400, "Prime input must be non-empty array");
            }

            result = value.filter(
                (n) => Number.isInteger(n) && isPrime(n)
            );
        }

        if (key === "lcm") {
            if (
                !Array.isArray(value) ||
                value.length === 0 ||
                value.some((n) => !Number.isInteger(n) || n <= 0)
            ) {
                return safeError(res, 400, "Invalid LCM input");
            }

            result = value.reduce((acc, n) => lcm(acc, n));
        }

        if (key === "hcf") {
            if (
                !Array.isArray(value) ||
                value.length === 0 ||
                value.some((n) => !Number.isInteger(n) || n <= 0)
            ) {
                return safeError(res, 400, "Invalid HCF input");
            }

            result = value.reduce((acc, n) => gcd(acc, n));
        }

        if (key === "AI") {
            if (typeof value !== "string" || value.trim().length === 0) {
                return safeError(res, 400, "Invalid AI input");
            }

            try {
                const aiRes = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
                    {
                        contents: [{ parts: [{ text: value.slice(0, 500) }] }]
                    },
                    { timeout: 5000 }
                );

                result =
                    aiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text
                        ?.split(/\s+/)[0] || "Unknown";
            } catch (error) {
                console.error("AI Error:", error.response?.data || error.message);
                result = "Unavailable";
            }
        }

        return res.status(200).json({
            is_success: true,
            official_email: email,
            data: result
        });

    } catch (error) {
        return safeError(res, 500, "Internal server error");
    }
});

app.use((_, res) => {
    safeError(res, 404, "Endpoint not found");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
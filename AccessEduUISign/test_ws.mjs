import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:5001/ws-recognition");

ws.on("open", () => {
    console.log("Connected to ML Server");
    const payload = {
        type: "FRAME",
        image: "dummy_base64_string",
        timestamp: Date.now()
    };
    ws.send(JSON.stringify(payload));
    console.log("Sent mock frame");
});

ws.on("message", (data) => {
    console.log("Received data from AI Model:", data.toString());
    process.exit(0);
});

ws.on("error", (err) => {
    console.error("WS Error:", err);
    process.exit(1);
});

setTimeout(() => {
    console.error("Timeout: No response received from AI model in 5 seconds");
    process.exit(1);
}, 5000);

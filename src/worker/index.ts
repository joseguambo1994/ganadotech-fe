import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => {
	return c.json({
		name: "Cloudflare",
	});
});

app.post("/api/audio", async (c) => {
	try {
		const contentType =
			c.req.header("Content-Type") ||
			"application/octet-stream";

		const audio = await c.req.arrayBuffer();

		if (audio.byteLength === 0) {
			return c.json(
				{
					error: "No audio received",
				},
				400,
			);
		}

		console.log(
			`Forwarding ${audio.byteLength} bytes as ${contentType}`,
		);

		const response = await fetch(
			"https://gappnado-speech-to-text.jlguambo1980.workers.dev/",
			{
				method: "POST",
				headers: {
					"Content-Type": contentType,
				},
				body: audio,
			},
		);

		const responseBody = await response.text();

		if (!response.ok) {
			console.error(
				"Speech-to-text error:",
				response.status,
				responseBody,
			);

			return c.json(
				{
					error: "Speech-to-text request failed",
					status: response.status,
					details: responseBody,
				},
				502,
			);
		}

		// Forward JSON if the speech service returns JSON
		try {
			return c.json(JSON.parse(responseBody));
		} catch {
			return c.json({
				success: true,
				result: responseBody,
			});
		}
	} catch (error) {
		console.error("Audio proxy error:", error);

		return c.json(
			{
				error: "Internal server error",
			},
			500,
		);
	}
});

export default app;
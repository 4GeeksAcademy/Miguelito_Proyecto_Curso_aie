import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	async rewrites() {
		const apiOrigin = process.env.INCIDENT_API_ORIGIN ?? "http://127.0.0.1:8000";
		return [
			{
				source: "/api/incidents/:path*",
				destination: `${apiOrigin}/api/incidents/:path*`,
			},
		];
	},
};

export default nextConfig;
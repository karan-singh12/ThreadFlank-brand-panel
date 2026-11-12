/**
 * Studio engines route.
 * Image generation and animation are orchestrated on the NestJS backend.
 */
export async function GET() {
  return Response.json({
    image: ["gemini", "replicate"],
    cooling: [],
    video: true,
  });
}

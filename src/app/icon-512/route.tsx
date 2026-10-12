import { ImageResponse } from "next/og";
import { IconArt } from "../icon-art";

export const dynamic = "force-static";

/** 512px PNG for the web app manifest (Android home screen). */
export function GET() {
  return new ImageResponse(<IconArt size={512} />, { width: 512, height: 512 });
}

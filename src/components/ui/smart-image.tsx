import Image, { type ImageProps } from "next/image";

const MAL_HOSTS = new Set(["myanimelist.net", "cdn.myanimelist.net"]);

function isMalImage(src: ImageProps["src"]): boolean {
  if (typeof src === "string") {
    try {
      const url = new URL(src);
      return MAL_HOSTS.has(url.hostname);
    } catch {
      return false;
    }
  }

  if (typeof src === "object" && "src" in src) {
    try {
      const url = new URL(src.src);
      return MAL_HOSTS.has(url.hostname);
    } catch {
      return false;
    }
  }

  return false;
}

export default function SmartImage(props: ImageProps) {
  const disableOptimization = props.unoptimized === true || isMalImage(props.src);

  return <Image {...props} unoptimized={disableOptimization} />;
}

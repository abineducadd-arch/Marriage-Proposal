import type { ObjectId } from "./adventure";
import chocolateImg from "@/assets/story/chocolate-box.png";
import giftImg from "@/assets/story/wrapped-gift.png";
import pictureImg from "@/assets/story/framed-picture.png";

const OBJECT_METADATA: Record<ObjectId, { src: string; alt: string }> = {
  chocolate: { src: chocolateImg, alt: "Chocolate box" },
  gift: { src: giftImg, alt: "Wrapped gift" },
  picture: { src: pictureImg, alt: "Framed picture" },
};

export function ObjectArtwork({ kind }: { kind: ObjectId }) {
  const item = OBJECT_METADATA[kind];
  return (
    <img src={item.src} alt={item.alt} className={`object-art art-${kind}`} draggable={false} />
  );
}

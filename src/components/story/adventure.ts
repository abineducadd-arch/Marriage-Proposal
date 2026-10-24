export const SWITCH_POSITION = { x: 73, y: 34 };
export const NEXT_PAGE_ROUTE = "/page-3";
export type ObjectId = "chocolate" | "gift" | "picture";
export const OBJECTS: Record<ObjectId, { title: string; clue: string; dialogue: string }> = {
  chocolate: {
    title: "A Little Sweetness for You",
    clue: "They say chocolate makes life sweeter, but you make my entire world sweeter just by being in it. If I could give you one chocolate for every moment you've made me smile, this box would never be big enough. ❤️",
    dialogue: "Chocolate! A perfect discovery. But wait... there's a tiny note hiding underneath!",
  },
  gift: {
    title: "A Little Gift from My Heart",
    clue: "If I could wrap up all the happiness you've brought into my life, it would be the most beautiful gift in the world. But even that wouldn't be enough to show you how special you are to me. You are a gift I never want to stop unwrapping, one beautiful day at a time. 💝",
    dialogue: "Ooooh! A mysterious little gift! I wonder what else is waiting for us...",
  },
  picture: {
    title: "A Picture Worth a Thousand Feelings",
    clue: "Some pictures capture a moment, but some people make every moment worth remembering. If I could freeze one thing in time, it would be every little moment with you. And if I could choose my favourite view in the whole world, it would always be you. ❤️",
    dialogue: "That's a very mysterious message... don't you think? Hehe!",
  },
};
export function exploreObject(visited: ObjectId[], id: ObjectId): ObjectId[] {
  return visited.includes(id) ? visited : [...visited, id];
}
export function passageUnlocked(visited: ObjectId[]) {
  return new Set(visited).size >= 3;
}
export function switchInBeam(x: number, y: number, sx: number, sy: number, radius = 105) {
  return Math.hypot(x - sx, y - sy) <= radius;
}

export const locations = [
  { id: "market", name: "Market", purpose: "Meet your companion", x: 210, y: 145, color: 0xcb9a55 },
  { id: "oracle", name: "Oracle", purpose: "Find a recommendation", x: 590, y: 145, color: 0xa093cc },
  { id: "camp", name: "Camp", purpose: "Get a little help", x: 590, y: 355, color: 0xcc8460 },
  { id: "post", name: "Post Office", purpose: "Letters from the village", x: 210, y: 355, color: 0x88b7aa },
] as const;

export type LocationId = (typeof locations)[number]["id"];

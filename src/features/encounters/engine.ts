import { productIds, type ProductId } from "@/domain/catalog";
import type {
  Choice,
  EncounterAction,
  EncounterContext,
  EncounterState,
  EncounterTransition,
  Node,
  NodeId,
} from "./types";

export const emptyEncounter: EncounterState = Object.freeze({
  location: null,
  nodeId: null,
  productId: "ember",
  receipt: null,
});

const startNodes = {
  market: "market-start",
  oracle: "legacy-oracle",
  camp: "legacy-camp",
  post: "legacy-post",
  bag: "bag",
} as const;

export function createEncounterState(location: NonNullable<EncounterState["location"]>): EncounterState {
  return { ...emptyEncounter, location, nodeId: startNodes[location] };
}

function rotateProduct(productId: ProductId, direction: 1 | -1): ProductId {
  const index = productIds.indexOf(productId);
  return productIds[(index + direction + productIds.length) % productIds.length];
}

export function applyEncounterAction(
  state: EncounterState,
  action: EncounterAction,
): EncounterTransition {
  switch (action.type) {
    case "add-to-bag":
      return {
        state: { ...state, nodeId: "market-added", productId: action.productId ?? state.productId },
        effect: action,
      };
    case "browse-next":
      return { state: { ...state, productId: rotateProduct(state.productId, 1) } };
    case "browse-previous":
      return { state: { ...state, productId: rotateProduct(state.productId, -1) } };
    case "open-bag":
      return { state: { ...state, location: "bag", nodeId: "bag", receipt: null } };
    case "checkout":
      return { state: { ...state, nodeId: "market-receipt" }, effect: action };
    case "close":
      return { state: emptyEncounter };
    case "goto-location":
      return { state: createEncounterState(action.location) };
  }
}

export function chooseEncounterOption(
  state: EncounterState,
  node: Node,
  choiceId: string,
): EncounterTransition {
  const choice = node.choices.find((option) => option.id === choiceId);
  if (!choice) return { state };
  if (choice.action) return applyEncounterAction(state, choice.action);
  if (choice.next) return { state: { ...state, nodeId: choice.next } };
  return { state };
}

export function resolveNodeText(node: Node, context: EncounterContext): string {
  return typeof node.text === "function" ? node.text(context) : node.text;
}

export function findChoice(node: Node, id: string): Choice | undefined {
  return node.choices.find((choice) => choice.id === id);
}

export type { NodeId };

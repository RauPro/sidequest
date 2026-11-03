import { productIds, type ProductId } from "@/domain/catalog";
import { recommend } from "@/domain/recommendations";
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
  deskMood: null,
  visualStyle: null,
  recommendedProductId: null,
  alternateProductId: null,
  campReply: null,
});

const startNodes = {
  market: "market-start",
  oracle: "oracle-start",
  camp: "camp-start",
  post: "post-start",
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
        state: {
          ...state,
          nodeId: state.location === "oracle" ? "oracle-reveal" : "market-added",
          productId: action.productId ?? state.productId,
        },
        effect: action,
      };
    case "browse-next":
      return { state: { ...state, productId: rotateProduct(state.productId, 1) } };
    case "browse-prev":
      return { state: { ...state, productId: rotateProduct(state.productId, -1) } };
    case "open-bag":
      return {
        state: {
          ...state,
          location: "bag",
          bagSource: state.location === "market" ? "market" : "hud",
          nodeId: "bag",
          receipt: null,
        },
      };
    case "checkout":
      return { state: { ...state, nodeId: "market-receipt" }, effect: action };
    case "close":
      return { state: emptyEncounter };
    case "oracle-answer":
      return {
        state: { ...state, nodeId: "oracle-realm", deskMood: action.mood, visualStyle: null },
      };
    case "oracle-realm": {
      if (!state.deskMood) return { state };
      const result = recommend(state.deskMood, action.realm);
      return {
        state: {
          ...state,
          nodeId: "oracle-reveal",
          visualStyle: action.realm,
          productId: result.productId,
          recommendedProductId: result.productId,
          alternateProductId: result.alternateId ?? null,
        },
      };
    }
    case "oracle-show-alternate":
      return { state: state.alternateProductId ? { ...state, productId: state.alternateProductId } : state };
    case "oracle-show-primary":
      return { state: state.recommendedProductId ? { ...state, productId: state.recommendedProductId } : state };
    case "save-oracle":
      return { state: { ...state, nodeId: "oracle-save" } };
    case "oracle-back":
      return { state: { ...state, nodeId: "oracle-reveal" } };
    case "oracle-reset":
      return { state: createEncounterState("oracle") };
    case "camp-custom":
      return { state: { ...state, nodeId: "camp-custom" } };
    case "camp-reset":
      return { state: { ...createEncounterState("camp"), campReply: null } };
    case "camp-email-skip":
      return { state: { ...state, nodeId: "camp-start" } };
    case "send-chat":
      return { state };
    case "subscribe":
      return { state };
    case "goto-location":
      return { state: createEncounterState(action.location) };
    case "visit-product":
      return { state: { ...createEncounterState("market"), nodeId: "market-browse", productId: action.productId } };
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

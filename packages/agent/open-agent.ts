import type { LanguageModel } from "ai";
import type { GatewayModelId } from "./models";
import { gateway } from "./models";

export interface AgentModelSelection {
  id: GatewayModelId;
}

export type OpenAgentModelInput = GatewayModelId | AgentModelSelection;

export interface OpenAgentCallOptions {
  model?: OpenAgentModelInput;
  customInstructions?: string;
}

export const defaultModelLabel = "anthropic/claude-sonnet-4-6" as const;
export const defaultModel: LanguageModel = gateway(defaultModelLabel);

export function resolveModel(
  input: OpenAgentModelInput | undefined,
): LanguageModel {
  if (!input) return defaultModel;
  const id = typeof input === "string" ? input : input.id;
  return gateway(id);
}

// Legacy export kept for any imports that haven't been updated yet
export const openAgent = {
  model: defaultModel,
};

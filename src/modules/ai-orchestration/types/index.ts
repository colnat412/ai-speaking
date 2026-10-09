export interface SaveConversationInput {
  userText: string;
  aiResponse: string;
  grammarCorrection: string;
}

export interface StoredGuestTurn extends SaveConversationInput {
  id: string;
  createdAt: string;
}

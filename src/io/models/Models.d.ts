export declare interface WorkspaceHistoryEntry {
  used: number;
  file: string;
}

export declare interface WorkspaceHistoryModel {
  kind: "ARC#WorkspaceHistory";
  entries: WorkspaceHistoryEntry[];
}

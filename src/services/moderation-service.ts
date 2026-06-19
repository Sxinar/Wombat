export interface ModerationAction {
  commentId: string;
  action: 'approve' | 'reject' | 'flag';
  moderatorId: string;
  reason?: string;
  timestamp: Date;
}

export class ModerationQueue {
  async flagComment(commentId: string, reason: string): Promise<void> {
    console.log(`Comment ${commentId} flagged: ${reason}`);
  }

  async approveComment(commentId: string, moderatorId: string): Promise<void> {
    console.log(`Comment ${commentId} approved by ${moderatorId}`);
  }

  async rejectComment(commentId: string, moderatorId: string, reason: string): Promise<void> {
    console.log(`Comment ${commentId} rejected: ${reason}`);
  }
}

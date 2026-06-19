export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  projectId: string;
}

export async function sendCommentNotification(
  parentAuthorEmail: string,
  commentContent: string,
  projectName: string
): Promise<void> {
  console.log(`Email notification sent to ${parentAuthorEmail}`);
}

export async function sendAdminNotification(
  adminEmails: string[],
  commentContent: string,
  projectName: string
): Promise<void> {
  console.log(`Admin notification sent to ${adminEmails.join(', ')}`);
}

import { createNotification } from "@/services/firestore/notifications";

interface ParticipantNotificationContext {
  tournamentName: string;
}

export const addParticipantToNotifications = async (
  userId: string,
  context: ParticipantNotificationContext
) => {
  await createNotification({
    user_id: userId,
    title: "Registration Approved",
    message: `You have been added to ${context.tournamentName}. Check your dashboard for match updates.`,
    type: "registration",
  });

  // Placeholder for email integration hook
  // TODO: integrate Firebase function / 3rd party email provider
};


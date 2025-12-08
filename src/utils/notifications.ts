import { createNotification } from "@/services/firestore/notifications";

interface ParticipantNotificationContext {
  tournamentName: string;
  gameName?: string;
}

interface GameRegistrationNotificationContext {
  tournamentName: string;
  gameName: string;
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

export const sendGameRegistrationApprovalNotification = async (
  userId: string,
  context: GameRegistrationNotificationContext
) => {
  await createNotification({
    user_id: userId,
    title: "Game Registration Approved! 🎉",
    message: `Your registration for "${context.gameName}" in ${context.tournamentName} has been approved. Good luck!`,
    type: "registration",
  });
};

export const sendGameRegistrationRejectionNotification = async (
  userId: string,
  context: GameRegistrationNotificationContext
) => {
  await createNotification({
    user_id: userId,
    title: "Game Registration Update",
    message: `Your registration for "${context.gameName}" in ${context.tournamentName} was not approved. Please contact the admin for more information.`,
    type: "registration",
  });
};


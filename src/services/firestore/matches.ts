import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  getDoc,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { Match, MatchResult } from "@/types/tournament";
import { createNotification } from "./notifications";
import { fetchParticipantById } from "./participants";
import { logAdminAction } from "./audit";

const matchesCollection = collection(db, "matches");
const resultsCollection = collection(db, "match_results");

const notifyParticipants = async (participantIds: (string | undefined)[], title: string, message: string, type: string, payload: any) => {
  for (const id of participantIds) {
    if (!id) continue;
    const participant = await fetchParticipantById(id);
    if (!participant) continue;

    if (participant.type === 'USER' && participant.user_id) {
      await createNotification({ user_id: participant.user_id, title, message, type, payload });
    } else if (participant.type === 'TEAM' && participant.team_id) {
      const teamDoc = await getDoc(doc(db, "teams", participant.team_id));
      if (teamDoc.exists()) {
        const teamData = teamDoc.data();
        for (const userId of (teamData.player_ids || [])) {
          await createNotification({ user_id: userId, title, message, type, payload });
        }
      }
    }
  }
};

export const fetchMatches = async (options: { tournamentId: string; gameId?: string }) => {
  const constraints = [
    where("tournament_id", "==", options.tournamentId),
  ];
  if (options.gameId) {
    constraints.push(where("game_id", "==", options.gameId));
  }

  const matchesQuery = query(matchesCollection, ...constraints);
  const snapshot = await getDocs(matchesQuery);
  const matches = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Match) }));

  // Sort in memory
  return matches.sort((a, b) => {
    if (a.round_index !== b.round_index) return a.round_index - b.round_index;
    return a.match_order - b.match_order;
  });
};

export const fetchMatchesForParticipants = async (participantIds: string[]) => {
  if (participantIds.length === 0) return [];

  const chunks = [];
  for (let i = 0; i < participantIds.length; i += 10) {
    chunks.push(participantIds.slice(i, i + 10));
  }

  const allMatches: Match[] = [];

  for (const chunk of chunks) {
    const qA = query(matchesCollection, where("participant_a_id", "in", chunk));
    const snapA = await getDocs(qA);

    const qB = query(matchesCollection, where("participant_b_id", "in", chunk));
    const snapB = await getDocs(qB);

    const matchesMap = new Map();

    snapA.docs.forEach(d => matchesMap.set(d.id, { id: d.id, ...d.data() }));
    snapB.docs.forEach(d => matchesMap.set(d.id, { id: d.id, ...d.data() }));

    matchesMap.forEach(m => allMatches.push(m as Match));
  }

  const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.id, m])).values());
  return uniqueMatches;
};

export const createMatch = async (
  match: Omit<Match, "id" | "created_at" | "updated_at">,
  adminInfo?: { id: string; name: string }
) => {
  const ref = await addDoc(matchesCollection, {
    ...match,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  if (match.participant_a_id || match.participant_b_id) {
    await notifyParticipants(
      [match.participant_a_id, match.participant_b_id],
      "Match Scheduled",
      "A new match has been scheduled for you.",
      "MATCH_SCHEDULED",
      { match_id: ref.id }
    );
  }

  if (adminInfo) {
    await logAdminAction({
      admin_id: adminInfo.id,
      admin_name: adminInfo.name,
      action: "MATCH_CREATE",
      resource_type: "MATCH",
      resource_id: ref.id,
      details: `Created match between ${match.participant_a_id} and ${match.participant_b_id}`
    });
  }

  return ref.id;
};

export const updateMatch = async (
  matchId: string,
  updates: Partial<Match>,
  adminInfo?: { id: string; name: string }
) => {
  await updateDoc(doc(db, "matches", matchId), { ...updates, updated_at: serverTimestamp() });

  if (updates.match_time || updates.venue) {
    const matchDoc = await getDoc(doc(db, "matches", matchId));
    if (matchDoc.exists()) {
      const match = matchDoc.data() as Match;
      await notifyParticipants(
        [match.participant_a_id, match.participant_b_id],
        "Match Updated",
        "Your match schedule or venue has been updated.",
        "MATCH_UPDATED",
        { match_id: matchId }
      );
    }
  }

  if (adminInfo) {
    await logAdminAction({
      admin_id: adminInfo.id,
      admin_name: adminInfo.name,
      action: "MATCH_UPDATE",
      resource_type: "MATCH",
      resource_id: matchId,
      details: `Updated match fields: ${Object.keys(updates).join(', ')}`
    });
  }
};

export const submitMatchResult = async (
  matchId: string,
  result: Omit<MatchResult, "id" | "match_id" | "created_at" | "updated_at">,
  adminInfo?: { id: string; name: string }
) => {
  const ref = await addDoc(resultsCollection, {
    ...result,
    match_id: matchId,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await updateMatch(matchId, {
    status: "COMPLETED",
    winner_participant_id: result.winner_participant_id,
  }, adminInfo);

  const matchDoc = await getDoc(doc(db, "matches", matchId));
  if (matchDoc.exists()) {
    const match = matchDoc.data() as Match;

    // Notify Winner
    await notifyParticipants(
      [result.winner_participant_id],
      "Victory! 🎉",
      "Congratulations! You won your match.",
      "MATCH_RESULT",
      { match_id: matchId, result: 'win' }
    );

    // Notify other participant (Loser)
    const loserId = match.participant_a_id === result.winner_participant_id
      ? match.participant_b_id
      : match.participant_a_id;

    if (loserId) {
      await notifyParticipants(
        [loserId],
        "Match Completed",
        "Your match has ended. Better luck next time!",
        "MATCH_RESULT",
        { match_id: matchId, result: 'loss' }
      );
    }
  }

  if (adminInfo) {
    await logAdminAction({
      admin_id: adminInfo.id,
      admin_name: adminInfo.name,
      action: "MATCH_RESULT_SUBMIT",
      resource_type: "MATCH",
      resource_id: matchId,
      details: `Submitted result. Winner: ${result.winner_participant_id}`
    });
  }

  return ref.id;
};

export const fetchMatchResultsForMatches = async (matchIds: string[]) => {
  if (matchIds.length === 0) return [];

  const chunks = [];
  for (let i = 0; i < matchIds.length; i += 10) {
    chunks.push(matchIds.slice(i, i + 10));
  }

  const allResults: MatchResult[] = [];

  for (const chunk of chunks) {
    const q = query(resultsCollection, where("match_id", "in", chunk));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(d => allResults.push({ id: d.id, ...d.data() } as MatchResult));
  }

  return allResults;
};

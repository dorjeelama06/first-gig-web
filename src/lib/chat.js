import { supabase } from "./supabase";
import { fetchBlockedIds } from "./blocks";

/* Get existing conversation or create a new one */
export async function getOrCreateConversation(jobId, seekerId, employerId) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("job_id", jobId)
    .eq("seeker_id", seekerId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ job_id: jobId, seeker_id: seekerId, employer_id: employerId })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

/* Fetch all conversations for a user */
export async function fetchConversations(userId, role) {
  const filter = role === "seeker" ? "seeker_id" : "employer_id";
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id, created_at,
      jobs(id, job_title, employer_id),
      employers(id, company_name),
      seekers(id, first_name, last_name, email),
      messages(id, content, created_at, sender_id, read)
    `)
    .eq(filter, userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const blockedIds = await fetchBlockedIds(userId);
  if (blockedIds.length === 0) return data || [];

  const otherId = c => role === "seeker" ? c.employers?.id : c.seekers?.id;
  return (data || []).filter(c => !blockedIds.includes(otherId(c)));
}

/* Fetch messages for a conversation */
export async function fetchMessages(conversationId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

/* Send a message */
export async function sendMessage(conversationId, senderId, content) {
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content });

  if (error) throw error;
}

/* Subscribe to new messages in a conversation — returns unsubscribe fn */
export function subscribeToMessages(conversationId, onNew) {
  const channel = supabase
    .channel(`messages-${conversationId}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `conversation_id=eq.${conversationId}`,
    }, payload => onNew(payload.new))
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/* Subscribe to any new messages (to refresh conversation list or unread badge).
   Pass a unique `tag` string to avoid channel name conflicts when multiple
   components subscribe for the same user at the same time. */
export function subscribeToConversationUpdates(userId, onUpdate, tag = "default") {
  const channel = supabase
    .channel(`convo-updates-${userId}-${tag}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, onUpdate)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversations" }, onUpdate)
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/* Fetch a single conversation by ID with all nested data */
export async function fetchConversationById(conversationId) {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id, created_at,
      jobs(id, job_title, employer_id),
      employers(id, company_name),
      seekers(id, first_name, last_name, email),
      messages(id, content, created_at, sender_id, read)
    `)
    .eq("id", conversationId)
    .single();

  if (error) throw error;
  return data;
}

/* Helper: last message from a conversation's messages array */
export function getLastMessage(messages) {
  if (!messages || messages.length === 0) return null;
  return [...messages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
}

/* Mark all messages from the other party as read when a conversation is opened */
export async function markMessagesAsRead(conversationId, userId) {
  // Only update messages where: correct conversation, not sent by the current user, and not yet read
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .eq("read", false);
}

/* Count how many conversations have at least one unread message not sent by this user.
   Powers the nav badge — returns a plain number. */
export async function fetchUnreadCount(userId, role) {
  const conversations = await fetchConversations(userId, role);

  let count = 0;
  for (const convo of conversations) {
    const last = getLastMessage(convo.messages);
    // A conversation counts as unread if the last message exists,
    // was sent by the other person, and has not been read yet.
    if (last && last.sender_id !== userId && last.read === false) {
      count++;
    }
  }
  return count;
}

import { supabaseAdmin } from '@/lib/supabase/supabaseAdmin'

export async function sendNotificationToAllUsers({
  type,
  title,
  message,
  link = '/notifications',
}) {
  const { data: users, error: usersError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'user')

  if (usersError) {
    throw new Error(usersError.message)
  }

  if (!users?.length) {
    return { success: true, inserted: 0 }
  }

  const payload = users.map((user) => ({
    user_id: user.id,
    type,
    title,
    message,
    link,
  }))

  const { error: insertError } = await supabaseAdmin
    .from('notifications')
    .insert(payload)

  if (insertError) {
    throw new Error(insertError.message)
  }

  return { success: true, inserted: payload.length }
}
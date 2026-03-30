import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClientWrapper } from '@/lib/supabase/server'

const NotificationsPage = async () => {
  const supabase = await createServerClientWrapper()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'user') {
    redirect('/dashboard')
  }

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <p>Failed to load notifications.</p>
      </section>
    )
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>

        <form action="/notifications/mark-read" method="post">
          <button
            type="submit"
            className="px-4 py-2 rounded-md border border-primary text-sm"
          >
            Mark all as read
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {notifications?.length ? (
          notifications.map((item) => (
            <Link
              key={item.id}
              href={item.link || '/profile/notifications'}
              className={`block rounded-lg border p-4 transition ${
                item.is_read ? 'opacity-70' : 'border-primary'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="text-sm mt-1">{item.message}</p>
                  <p className="text-xs mt-2 opacity-70">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>

                {!item.is_read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 mt-2 shrink-0" />
                )}
              </div>
            </Link>
          ))
        ) : (
          <p>No notifications yet.</p>
        )}
      </div>
    </section>
  )
}

export default NotificationsPage
import ActivityTracker from "@/components/ActivityTracker";
import DashboardNavbar from "@/components/DashboardNavbar";

export const metadata = {
    title: 'Admin Dashboard',
    robots: {
      index: false,
      follow: false,
    },
}
  

export default function DashboardLayout({ children }) {
    return (
        <>
            <DashboardNavbar />
            <main>
                <ActivityTracker />
                {children}
            </main>
        </>
    )
}
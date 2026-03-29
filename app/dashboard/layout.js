import ActivityTracker from "@/components/ActivityTracker";
import DashboardNavbar from "@/components/DashboardNavbar";

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
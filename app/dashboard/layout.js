import DashboardNavbar from "@/components/DashboardNavbar";

export default function DashboardLayout({ children }) {
    return (
        <>
            <DashboardNavbar />
            <main>
                {children}
            </main>
        </>
    )
}
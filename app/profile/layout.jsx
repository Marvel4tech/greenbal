import ProfileNavbar from "@/components/ProfileNavbar";
import BottomNavbar from "@/components/BottomNavbar";

export default function ProfileLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <ProfileNavbar />
      
      {/* Main content with bottom padding for mobile to prevent content hiding */}
      <main className="flex-1 pb-24 md:pb-0">
        {children}
      </main>
      
      {/* Bottom navbar - only visible on mobile */}
      <BottomNavbar />
    </div>
  );
}

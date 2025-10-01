import ProfileNavbar from "@/components/ProfileNavbar";


export default function ProfileLayout({ children }) {
  return (
    <>
      <ProfileNavbar />
      <main className=" ">
        {children}
      </main>
    </> 
  );
}

import { useEffect, useState } from "react";
import { auth } from "../utils/firebase";
import { useRouter } from "next/router";
import { getLocation } from "../utils/location";

export default function Dashboard() {
  const [location, setLocation] = useState(null);
  const router = useRouter();

  useEffect(() => {
    getLocation()
      .then((loc) => setLocation(loc))
      .catch((err) => console.error("Error fetching location:", err));
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/");
  };

  return (
    <div>
      <h1>Your Dashboard</h1>
      {location && (
        <p>
          Current Location: {location.latitude}, {location.longitude}
        </p>
      )}
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
}

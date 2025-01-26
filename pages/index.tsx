import Login from "@/components/Face/Login";
import Register from "@/components/Face/Register";
import { FaceMatcher } from "face-api.js";
import { useState } from "react";

export default function ScanPage() {
  const [faceMatcher, setFaceMatcher] = useState<FaceMatcher | null>(null);

  return (
    <div className="-mt-14 flex h-screen flex-col items-center justify-center">
      <p className="mb-4">First Register then try checking in</p>
      <div className="flex space-x-3">
        <Register faceMatcher={faceMatcher} setFaceMatcher={setFaceMatcher} />
        <Login faceMatcher={faceMatcher} setFaceMatcher={setFaceMatcher} />
      </div>

      <p className="mt-4">Note: Do not refresh between scans</p>
    </div>
  );
}

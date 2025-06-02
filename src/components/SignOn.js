import { useState } from "react";
import { signOn } from "../api/api"; // Import API function

const SignOn = () => {
  const [baNumber, setBaNumber] = useState("");

  const handleSignOn = () => {
    signOn({
      employeeId: "EMP123",
      time: new Date(),
      location: "Station A",
      baNumber: baNumber,
    })
    .then((response) => alert(response.data.message))
    .catch((error) => console.error("Error signing on:", error));
  };

  return (
    <div>
      <h2>Sign-On</h2>
      <input 
        type="text" 
        placeholder="Enter BA Number" 
        value={baNumber} 
        onChange={(e) => setBaNumber(e.target.value)}
      />
      <button onClick={handleSignOn}>Sign On</button>
    </div>
  );
};

export default SignOn;
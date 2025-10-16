import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { SIGN_IN } from "../../utils/constants";
import { BottomWarning } from "../components/BottomWarning";
import { Button } from "../components/Button";
import { Heading } from "../components/Heading";
import { InputBox } from "../components/InputBox";
import { SubHeading } from "../components/SubHeading";

export const Signin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignin = async () => {
    try {
      const response = await axios.post(
        SIGN_IN,
        { username, password },
        {
          headers: { "Content-Type": "application/json" },
          // withCredentials: true // only if backend uses cookies
        }
      );

      localStorage.setItem("token", response.data.token);
      navigate("/Home");
    } catch (error) {
      console.error("Signin error:", error.response?.data || error.message);
      alert(
        "Signin failed. Error: " + (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div className="bg-slate-300 h-screen flex justify-center">
      <div className="flex flex-col justify-center">
        <div className="rounded-lg bg-white w-80 text-center p-2 h-max px-4">
          <Heading label={"Sign in"} />
          <SubHeading label={"Enter your credentials to access your account"} />
          <InputBox
            placeholder="sid@gmail.com"
            label={"Email"}
            onChange={(e) => setUsername(e.target.value)}
          />
          <InputBox
            type="password"
            placeholder="123456"
            label={"Password"}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="pt-4">
            <Button onClick={handleSignin} label={"Sign in"} />
          </div>
          <BottomWarning
            label={"Don't have an account?"}
            buttonText={"Sign up"}
            to={"/"}
          />
        </div>
      </div>
    </div>
  );
};

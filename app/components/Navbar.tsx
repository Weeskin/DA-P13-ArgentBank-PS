import { NavLink, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../store/store";
import { clearToken } from "../store/authSlice";
import { clearUserData } from "../store/userSlice";
import Logo from "/assets/img/argentBankLogo.webp";

export function Navbar() {
  const isConnected = useSelector((state: RootState) => state.auth.token);
  const { firstName, userName } = useSelector((state: RootState) => state.user.userData);
  const displayName = userName || firstName;

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  function handleLogout() {
    dispatch(clearToken());
    dispatch(clearUserData());
    navigate("/");
  }

  return (
    <nav className="flex justify-between items-center w-full px-5 py-2 bg-white">
      <NavLink to="/" className="main-nav-logo">
        <img
          className="main-nav-logo-image h-10"
          src={Logo}
          alt="Argent Bank Logo"
        />
      </NavLink>

      <div className="flex items-center gap-4">
        {isConnected ? (
          <>
            <NavLink
              className="flex flex-nowrap items-center gap-1 font-bold text-blue-950 hover:underline"
              to="/profile"
            >
              <i className="fa-regular fa-user" aria-hidden="true"></i>
              <span>{displayName}</span>
            </NavLink>
            <button
              className="flex items-center gap-1 font-bold text-blue-950 hover:underline bg-transparent border-0 cursor-pointer"
              onClick={handleLogout}
            >
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true"></i>
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <NavLink
            className="flex items-center gap-1 font-bold text-blue-950 hover:underline"
            to="/login"
          >
            <i className="fa fa-user-circle" aria-hidden="true"></i>
            <span>Sign In</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
}

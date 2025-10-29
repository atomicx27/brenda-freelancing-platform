import { Link } from "react-router-dom";

const LoginSignupFooter = () => {
    return (
        <footer className="bg-gradient-to-tr from-[#BAE6FD] to-[#CFFAFE] mt-auto">
            <div className="container mx-auto py-10 md:px-5 sm:px-7 px-3">
                <p className="text-center font-semibold text-zinc-800 text-sm">
                    &copy; 2015 - 2022 Brenda® Global Inc. 
                    <Link to="#" className="font-bold text-zinc-700 hover:underline"> Privacy Policy </Link>
                </p>
            </div>
        </footer>
    )
}

export default LoginSignupFooter;
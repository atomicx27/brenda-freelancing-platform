
import { useNavigate } from "react-router-dom";

const LoginSignupHeader = () => {

     // ============= Router hooks ===================
     const navigate = useNavigate();

    return (
        <header className="border-b">
            <nav className="container mx-auto py-3 px-3 flex lg:justify-start justify-center">
                <div>
                    <img
                        src="/images/logo.png"
                        width={60}
                        height={50}
                        alt="logo"
                        className="cursor-pointer"
                        onClick={() => navigate('/')}
                    />
                </div>
            </nav>
        </header>
    )
}

export default LoginSignupHeader;
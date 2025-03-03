import { useLayoutEffect } from "react";
import { useStore } from "../store/useStore";

  // Proveedor de autenticación
  export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { setAccessToken, accessToken, setIsAuthenticated, setCurrentUser,isAuthenticated } = useStore();
    const api = import.meta.env.VITE_API_URL;
    useLayoutEffect(() => {
      const fetchMe = async () => {
        try {
          const response = await fetch(`${api}/current_user`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              credentials: 'include'
            },
          });
  
          const data = await response.json();
          if (response.ok) {
            setAccessToken(data.accessToken); 
          } else if (response.status === 401) {
          
            await refreshTokens();
          } else {
            setAccessToken('');
          }
        } catch (error) {
          setAccessToken('');
        }
      };
  
      fetchMe();
    }, []);
  
    // Función para refrescar el accessToken sin almacenar refreshToken en el cliente
    const refreshTokens = async () => {
      try {
        const response = await fetch(`${api}/refresh_token`, {
          method: 'POST',
           credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        const data = await response.json();
        if (response.ok) {
          setAccessToken(data.accessToken);
          setCurrentUser(data.user);
        } else {
            setAccessToken('');
            setIsAuthenticated(false);
        }
      } catch (error) {
        setAccessToken('');
        isAuthenticated && setIsAuthenticated(false);
      }
    };
  
    return <>{children}</>;
}
  export default AuthProvider;
  
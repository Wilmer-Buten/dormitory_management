import { useEffect, useLayoutEffect } from "react";
import { useStore } from "../store/useStore";
  // Proveedor de autenticación
  export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const { setAccessToken, accessToken, setIsAuthenticated, setCurrentUser,isAuthenticated } = useStore();
    const api = 'http://localhost:4000';
    useLayoutEffect(() => {
      const fetchMe = async () => {
        try {
          const response = await fetch(`${api}/current_user`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });
  
          const data = await response.json();
          if (response.ok) {
            console.log(data)
            setAccessToken(data.accessToken); // Establecer el nuevo token de acceso
          } else if (response.status === 401) {
            // Si el token de acceso ha expirado, solicitar un nuevo accessToken
            console.log(data.message)
            await refreshTokens();
          } else {
            console.log(data)
            setAccessToken('');
          }
        } catch (error) {
          console.error('Error fetching user:', error);
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
          console.log(data)
          setAccessToken(data.accessToken); // Establecer el nuevo token de acceso
          setCurrentUser(data.user);
        } else {
            console.log(data.message)
            setAccessToken(''); // Si el refreshToken es inválido, limpiamos los tokens
            setIsAuthenticated(false);
            console.log(data.message)
        }
      } catch (error) {
        console.error('Error refreshing tokens:', error);
        setAccessToken('');
        isAuthenticated && setIsAuthenticated(false);
      }
    };
  
    return <>{children}</>;
}
  export default AuthProvider;
  
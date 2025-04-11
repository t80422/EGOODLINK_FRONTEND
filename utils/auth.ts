// utils/auth.ts
export const parseJwt = (token: string) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };
  
  export const isTokenExpired = (token: string): boolean => {
    const decoded = parseJwt(token);
    if (!decoded) return true;
    // 檢查是否過期(1小時)
    return decoded.exp * 1000 < Date.now();
  };
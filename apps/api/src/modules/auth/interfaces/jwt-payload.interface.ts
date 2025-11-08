export interface JwtPayload {
  sub: string; // user id
  email: string;
  iat?: number; // issued at
  exp?: number; // expiration
}

export interface RefreshTokenPayload extends JwtPayload {
  jti: string; // JWT ID for refresh token tracking
  familyId: string; // Token family for rotation tracking
}

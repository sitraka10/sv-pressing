// server/express.d.ts

import { User } from '../shared/schema'; // Assurez-vous que ce chemin est correct pour votre type User
import { Session, SessionData } from 'express-session';

declare global {
  namespace Express {
    // Étend l'interface User de Express avec votre type User réel
    interface User extends User {}

    // Étend l'interface Request de Express pour inclure les propriétés de Passport
    interface Request {
      user?: User;
      isAuthenticated(): boolean;
      isUnauthenticated(): boolean;
      logIn(user: any, done: (err: any) => void): void;
      logOut(done: (err: any) => void): void;
      session: Session & Partial<SessionData>;
      // Ajoutez d'autres propriétés personnalisées si vous en utilisez
    }
  }
}
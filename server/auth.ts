// server/auth.ts

import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";

const router = Router();

// =====================================================
// LOGIN
// =====================================================
router.post(
  "/api/login",
  (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    console.log(
      "✅ [AUTH] /api/login atteinte - username:",
      req.body?.username
    );

    console.log(
      "✅ [AUTH] Content-Type:",
      req.headers["content-type"]
    );

    passport.authenticate(
      "local",
      (
        err: any,
        user: any,
        info: any
      ) => {
        // Erreur Passport
        if (err) {
          console.error(
            "❌ [AUTH] Erreur interne de Passport:",
            err
          );

          return res.status(500).json({
            success: false,
            message:
              "Erreur serveur lors de l'authentification.",
          });
        }

        // Identifiants incorrects
        if (!user) {
          console.log(
            "❌ [AUTH] Échec authentification:",
            info?.message
          );

          return res.status(401).json({
            success: false,
            message:
              info?.message ||
              "Identifiants invalides.",
          });
        }

        console.log(
          `✅ [AUTH] Authentification réussie pour '${user.username}'.`
        );

        // Création de la session Passport
        req.logIn(
          user,
          (loginError) => {
            if (loginError) {
              console.error(
                "❌ [AUTH] ERREUR lors de req.logIn:",
                loginError
              );

              return res.status(500).json({
                success: false,
                message:
                  "Échec de la création de la session utilisateur.",
              });
            }

            console.log(
              `✅ [AUTH] Session établie avec succès pour '${user.username}'.`
            );

            // Ne jamais envoyer le mot de passe au frontend
            const {
              password: _password,
              ...userWithoutPassword
            } = user;

            return res.status(200).json(
              userWithoutPassword
            );
          }
        );
      }
    )(req, res, next);
  }
);

// =====================================================
// LOGOUT
// =====================================================
router.post(
  "/api/logout",
  (
    req: Request,
    res: Response
  ) => {
    req.logout(
      (logoutError) => {
        if (logoutError) {
          console.error(
            "❌ [AUTH] Erreur logout:",
            logoutError
          );

          return res.status(500).json({
            success: false,
            message: "Logout failed",
          });
        }

        // Détruire la session côté serveur
        req.session.destroy(
          (sessionError) => {
            if (sessionError) {
              console.error(
                "❌ [AUTH] Erreur destruction session:",
                sessionError
              );

              return res.status(500).json({
                success: false,
                message:
                  "Session destruction failed",
              });
            }

            // IMPORTANT :
            // server/index.ts utilise :
            // name: "svpressing_session"

            res.clearCookie(
              "svpressing_session",
              {
                path: "/",
                httpOnly: true,
                secure:
                  process.env.NODE_ENV ===
                  "production",
                sameSite: "lax",
              }
            );

            console.log(
              "✅ [AUTH] Session détruite et cookie supprimé."
            );

            return res.status(200).json({
              success: true,
              message:
                "Logout successful",
            });
          }
        );
      }
    );
  }
);

// =====================================================
// CURRENT USER
// =====================================================
router.get(
  "/api/user",
  (
    req: Request,
    res: Response
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    const {
      password: _password,
      ...userWithoutPassword
    } = req.user as any;

    return res.status(200).json(
      userWithoutPassword
    );
  }
);

export default router;

// server/index.ts
 
import dotenv from 'dotenv';
dotenv.config();
 
import express, {
  Request,
  Response,
  NextFunction,
} from 'express';
 
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import connectPg from 'connect-pg-simple';
import bcrypt from 'bcryptjs';
import compression from 'compression';
import helmet from 'helmet';
import crypto from 'crypto';
 
import { createServer as createHttpServer } from 'http';
 
import { db, pool } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
 
import { registerAllRoutes } from './routes/index';
import { initializeDatabase } from './database-init';
import { generateTodayOrders } from './generate-weekly-orders';
import { log } from './logger';
 
import {
  seoHeadersMiddleware,
  canonicalUrlMiddleware,
  serverSideSEOMiddleware,
  compressionMiddleware,
  crawlerLoggerMiddleware,
} from './middleware/seo-middleware';
 
import seoRoutes from './routes/seo-routes';
 
// ============================================================
// PATH / APPLICATION
// ============================================================
 
const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
 
const app = express();
 
const httpServer = createHttpServer(app);
 
// ============================================================
// ENVIRONMENT
// ============================================================
 
const isProduction =
  process.env.NODE_ENV === 'production';
 
const isDevelopment =
  process.env.NODE_ENV === 'development' ||
  !process.env.NODE_ENV;
 
const isReplit =
  Boolean(process.env.REPL_ID) ||
  Boolean(process.env.REPL_SLUG) ||
  Boolean(process.env.REPL_OWNER);
 
const PORT =
  Number(process.env.PORT) || 5000;
  
 
// ============================================================
// HELMET / SECURITY
// ============================================================
 
if (isProduction) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
 
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
          ],
 
          fontSrc: [
            "'self'",
            'https://fonts.gstatic.com',
          ],
 
          imgSrc: [
            "'self'",
            'data:',
            'https:',
            'blob:',
          ],
 
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://www.googletagmanager.com',
            'https://connect.facebook.net',
            'https://mc.yandex.ru',
            'https://replit.com',
          ],
 
          connectSrc: [
            "'self'",
            'https://www.google-analytics.com',
            'https://region1.google-analytics.com',
            'https://*.google-analytics.com',
            'https://replit.com',
          ],
 
          frameSrc: ["'self'"],
        },
      },
 
      crossOriginEmbedderPolicy: false,
 
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    })
  );
} else {
  app.use(
    helmet({
      contentSecurityPolicy: false,
 
      crossOriginEmbedderPolicy: false,
 
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    })
  );
}
 
// ============================================================
// SEO MIDDLEWARE
// ============================================================
 
app.use(seoHeadersMiddleware);
app.use(canonicalUrlMiddleware);
app.use(serverSideSEOMiddleware);
app.use(compressionMiddleware);
app.use(crawlerLoggerMiddleware);
 
// ============================================================
// COMPRESSION
// ============================================================
 
app.use(
  compression({
    level: 6,
    threshold: 0,
  })
);
 
// ============================================================
// CORS
// ============================================================
 
const allowedOrigins: string[] = [
  'https://replit.com',
  'https://svpressing.com',
  'https://www.svpressing.com',
  'https://188.166.250.131',
 
  // Replit
  'https://*.replit.dev',
  'https://*.repl.co',
 
  // Localhost
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
 
  // 127.0.0.1
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5000',
 
  // Android emulator
  'http://10.0.2.2:3000',
  'http://10.0.2.2:5173',
 
  // 0.0.0.0
  'http://0.0.0.0:3000',
  'http://0.0.0.0:5173',
];
 
// ------------------------------------------------------------
// Replit dynamic URLs
// ------------------------------------------------------------
 
if (
  process.env.REPL_SLUG &&
  process.env.REPL_OWNER
) {
  allowedOrigins.push(
    `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  );
 
  allowedOrigins.push(
    `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.dev`
  );
}
 
// ------------------------------------------------------------
// FRONTEND_URL
// ------------------------------------------------------------
 
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(
    process.env.FRONTEND_URL
  );
}
 
// ------------------------------------------------------------
// CORS options
// ------------------------------------------------------------
 
const corsOptions: cors.CorsOptions = {
  origin: (
    origin,
    callback
  ) => {
    // Requests sans Origin
    if (!origin) {
      return callback(null, true);
    }
 
    // Development : autoriser toutes les origines
    if (isDevelopment) {
      return callback(null, true);
    }
 
    const isAllowed =
      allowedOrigins.some((allowed) => {
        if (allowed.includes('*')) {
          const pattern = allowed
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
            .replace(/\\\*/g, '.*');
 
          return new RegExp(
            `^${pattern}$`
          ).test(origin);
        }
 
        return allowed === origin;
      });
 
    if (isAllowed) {
      return callback(null, true);
    }
 
    console.warn(
      `[CORS] Origine non autorisée: ${origin}`
    );
 
    return callback(
      new Error('CORS non autorisé')
    );
  },
 
  credentials: true,
 
  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'OPTIONS',
    'HEAD',
  ],
 
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'Cache-Control',
    'Pragma',
    'X-Robots-Tag',
    'X-Device-Token',
  ],
 
  exposedHeaders: [
    'Set-Cookie',
    'Authorization',
    'X-Robots-Tag',
    'X-Crawler-Type',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials',
  ],
 
  maxAge: 86400,
 
  optionsSuccessStatus: 204,
};
 
app.use(cors(corsOptions));
 
app.options(
  '*',
  cors(corsOptions)
);
 
// ============================================================
// EXPRESS
// ============================================================
 
app.use(
  express.json({
    limit: '10mb',
  })
);
 
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);
 
// ============================================================
// SESSION
// ============================================================
 
const PostgresSessionStore =
  connectPg(session);
 
const sessionCookieConfig: session.CookieOptions = {
  maxAge:
    10 *
    365 *
    24 *
    60 *
    60 *
    1000,
 
  httpOnly: true,
 
  secure:
    isProduction || isReplit,
 
  sameSite: 'lax',
 
  path: '/',
 
  domain: isProduction
    ? '.svpressing.com'
    : undefined,
};
 
const sessionConfig: session.SessionOptions = {
  store: new PostgresSessionStore({
    pool,
 
    tableName: 'user_sessions',
 
    createTableIfMissing: true,
 
    pruneSessionInterval:
      60 * 60 * 24,
  }),
 
  secret:
    process.env.SESSION_SECRET ||
    'sv-pressing-secret-key-2025-madagascar',
 
  resave: false,
 
  saveUninitialized: false,
 
  cookie: sessionCookieConfig,
 
  name: 'svpressing_session',
 
  rolling: true,
 
  proxy: true,
 
  genid: () => {
    const id = crypto
      .randomBytes(32)
      .toString('hex');
 
    if (isDevelopment) {
      console.log(
        `[SESSION] Nouvel ID: ${id.substring(
          0,
          8
        )}...`
      );
    }
 
    return id;
  },
};
 
// Trust proxy doit être configuré
// avant l'utilisation des cookies secure.
app.set('trust proxy', 1);
 
// Session
app.use(
  session(sessionConfig)
);
 
// ============================================================
// PASSPORT
// ============================================================
 
app.use(
  passport.initialize()
);
 
app.use(
  passport.session()
);
 
// ============================================================
// REQUEST LOGGING - DEVELOPMENT
// ============================================================
 
if (isDevelopment) {
  app.use(
    (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      if (
        req.path.startsWith('/api')
      ) {
        console.log(
          `[REQ] ${req.method} ${req.path} - SessionID: ${
            req.sessionID?.substring(
              0,
              8
            ) || 'none'
          }`
        );
      }
 
      next();
    }
  );
}
 
// ============================================================
// PASSPORT LOCAL STRATEGY
// ============================================================
 
passport.use(
  new LocalStrategy(
    async (
      username,
      password,
      done
    ) => {
      try {
        const user =
          await db.query.users.findFirst({
            where: eq(
              users.username,
              username
            ),
          });
 
        // Utilisateur introuvable
        if (!user) {
          return done(
            null,
            false,
            {
              message:
                "Nom d'utilisateur ou mot de passe incorrect.",
            }
          );
        }
 
        // Vérification mot de passe
        const isMatch =
          await bcrypt.compare(
            password,
            user.password
          );
 
        if (!isMatch) {
          return done(
            null,
            false,
            {
              message:
                "Nom d'utilisateur ou mot de passe incorrect.",
            }
          );
        }
 
        // Compte désactivé
        if (!user.isActive) {
          return done(
            null,
            false,
            {
              message:
                'Votre compte est actuellement désactivé.',
            }
          );
        }
 
        // Authentification réussie
        return done(
          null,
          user
        );
      } catch (error) {
        console.error(
          '[AUTH] Erreur:',
          error
        );
 
        return done(
          error
        );
      }
    }
  )
);
 
// ============================================================
// PASSPORT SERIALIZE
// ============================================================
 
passport.serializeUser(
  (
    user: any,
    done
  ) => {
    done(
      null,
      user.id
    );
  }
);
 
// ============================================================
// PASSPORT DESERIALIZE
// ============================================================
 
passport.deserializeUser(
  async (
    id: number,
    done
  ) => {
    try {
      const user =
        await db.query.users.findFirst({
          where: eq(
            users.id,
            id
          ),
        });
 
      done(
        null,
        user || null
      );
    } catch (error) {
      console.error(
        '[DESERIALIZE] Erreur:',
        error
      );
 
      done(
        error
      );
    }
  }
);
 
// ============================================================
// SESSION CHECK
// ============================================================
 
app.get(
  '/api/session-check',
  (
    req: Request,
    res: Response
  ) => {
    const currentUser =
      req.user as any;
 
    res.json({
      authenticated:
        req.isAuthenticated(),
 
      user: currentUser
        ? {
            id:
              currentUser.id,
 
            username:
              currentUser.username,
 
            role:
              currentUser.role,
          }
        : null,
 
      sessionID:
        req.sessionID,
 
      session: req.session
        ? {
            cookie:
              req.session.cookie,
          }
        : null,
 
      environment: {
        isProduction,
 
        isReplit,
 
        nodeEnv:
          process.env.NODE_ENV,
      },
    });
  }
);
 
// ============================================================
// API HEALTH
// ============================================================
 
app.get(
  '/api/health',
  (
    req: Request,
    res: Response
  ) => {
    res.json({
      status: 'healthy',
 
      timestamp:
        new Date().toISOString(),
 
      environment:
        process.env.NODE_ENV ||
        'development',
 
      session: {
        secure:
          sessionCookieConfig.secure,
 
        sameSite:
          sessionCookieConfig.sameSite,
 
        maxAge:
          sessionCookieConfig.maxAge,
 
        isReplit,
      },
    });
  }
);
 
// ============================================================
// SEO METADATA
// ============================================================
 
app.get(
  '/api/seo/metadata',
  (
    req: Request,
    res: Response
  ) => {
    res.json({
      site_name:
        'SV Pressing Madagascar',
 
      title:
        'SV Pressing Madagascar | Service de Pressing Professionnel',
 
      description:
        'Service de pressing professionnel avec collecte et livraison à domicile à Antananarivo, Madagascar',
 
      keywords: [
        'pressing Madagascar',
        'fanasan-damba Antananarivo',
        'laundry service Madagascar',
        'nettoyage à sec Madagascar',
        'blanchisserie Tananarive',
        'lavage repassage',
        'abonnement pressing',
        'collecte livraison domicile',
      ],
 
      og: {
        title:
          'SV Pressing Madagascar - Pressing Professionnel',
 
        description:
          'Collecte et livraison à domicile à Antananarivo',
 
        image:
          'https://svpressing.com/assets/img/Pressing_Gris.png',
 
        url:
          'https://svpressing.com',
 
        type: 'website',
      },
 
      twitter: {
        card:
          'summary_large_image',
 
        title:
          'SV Pressing Madagascar',
 
        description:
          'Service de pressing avec collecte et livraison',
 
        image:
          'https://svpressing.com/assets/img/SV_Pattern_Gris.svg',
      },
 
      last_updated:
        new Date().toISOString(),
    });
  }
);
 
// ============================================================
// GENERATE ORDERS MANUALLY
// ============================================================
 
app.post(
  '/api/orders/generate-manual',
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const currentUser =
        req.user as any;
 
      if (
        !currentUser ||
        currentUser.role !== 'admin'
      ) {
        return res.status(403).json({
          success: false,
 
          message:
            'Accès non autorisé. Admin requis.',
        });
      }
 
      const summary =
        await generateTodayOrders();
 
      return res.json({
        success: true,
 
        message:
          `Génération terminée: ${summary.generated} commandes créées`,
 
        summary,
 
        timestamp:
          new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(
        '[API] Erreur:',
        error
      );
 
      return res.status(500).json({
        success: false,
 
        message:
          error?.message ||
          'Erreur lors de la génération',
      });
    }
  }
);
 
// ============================================================
// BASIC HEALTH
// ============================================================
 
app.get(
  '/health',
  (
    req: Request,
    res: Response
  ) => {
    res.json({
      status: 'healthy',
 
      timestamp:
        new Date().toISOString(),
 
      service:
        'sv-pressing-api',
 
      version:
        process.env.npm_package_version ||
        '1.0.0',
    });
  }
);
 
// ============================================================
// STATUS
// ============================================================
 
app.get(
  '/status',
  (
    req: Request,
    res: Response
  ) => {
    res.json({
      online: true,
 
      server_time:
        new Date().toISOString(),
 
      uptime:
        process.uptime(),
 
      memory:
        process.memoryUsage(),
 
      env:
        process.env.NODE_ENV,
    });
  }
);
 
// ============================================================
// API ROUTES
// ============================================================
 
registerAllRoutes(app);
 
// ============================================================
// SEO ROUTES
// ============================================================
 
app.use(
  '/',
  seoRoutes
);
 
// ============================================================
// SERVER START
// ============================================================
 
(async () => {
  try {
    // --------------------------------------------------------
    // DATABASE
    // --------------------------------------------------------
 
    log(
      'Initialisation de la base de données...'
    );
 
    await initializeDatabase();
 
    log(
      'Base de données initialisée avec succès'
    );
 
    // --------------------------------------------------------
    // SERVER INFORMATION
    // --------------------------------------------------------
 
    console.log(
      '\n' + '='.repeat(70)
    );
 
    console.log(
      '🚀 SERVEUR SV PRESSING MADAGASCAR - OPTIMISÉ SEO'
    );
 
    console.log(
      '='.repeat(70)
    );
 
    console.log(
      `Mode: ${
        isProduction
          ? 'PRODUCTION'
          : 'DEVELOPMENT'
      }`
    );
 
    console.log(
      `Port: ${PORT}`
    );
 
    console.log(
      'Domain: https://svpressing.com'
    );
 
    console.log(
      `Session Cookie: secure=${sessionCookieConfig.secure}, sameSite=${sessionCookieConfig.sameSite}`
    );
 
    console.log(
      `Session MaxAge: ${
        (sessionCookieConfig.maxAge || 0) /
        (1000 * 60 * 60 * 24)
      } jours`
    );
 
    console.log(
      `Environnement: ${
        isReplit
          ? 'Replit'
          : 'Standard'
      }`
    );
 
    console.log(
      `CORS Origins: ${allowedOrigins.length} origines configurées`
    );
 
    console.log(
      '='.repeat(70) + '\n'
    );
 
    // --------------------------------------------------------
    // CRON
    // --------------------------------------------------------
 
    const cronSchedule =
      '5 0 * * *';
 
    const cronTask =
      cron.schedule(
        cronSchedule,
 
        async () => {
          log(
            '🤖 Génération quotidienne des commandes...'
          );
 
          try {
            const summary =
              await generateTodayOrders();
 
            log(
              `✅ Génération terminée: ${summary.generated} créées, ${summary.skipped} évitées`
            );
          } catch (error) {
            console.error(
              '❌ Erreur cron:',
              error
            );
          }
        },
 
        {
          timezone:
            'Indian/Antananarivo',
        }
      );
 
    console.log(
      `⏰ Cron job configuré: ${cronSchedule} (Antananarivo)`
    );
 
    // Filet de sécurité : la génération est idempotente (aucun doublon),
    // donc on la relance chaque heure et au démarrage pour rattraper
    // un serveur éteint à 00:05 ou un client ajouté en cours de journée.
    const hourlyTask = cron.schedule(
      '10 * * * *',
      async () => {
        try {
          const summary = await generateTodayOrders();
          if (summary.generated > 0) {
            log(`✅ Rattrapage horaire: ${summary.generated} commande(s) créée(s)`);
          }
        } catch (error) {
          console.error('❌ Erreur cron horaire:', error);
        }
      },
      { timezone: 'Indian/Antananarivo' }
    );
 
    setTimeout(async () => {
      try {
        const summary = await generateTodayOrders();
        log(`🚀 Génération au démarrage: ${summary.generated} créée(s), ${summary.skipped} déjà existante(s)`);
      } catch (error) {
        console.error('❌ Erreur génération au démarrage:', error);
      }
    }, 15000);
 
    // --------------------------------------------------------
    // DEVELOPMENT - VITE
    // --------------------------------------------------------
 
    if (
      process.env.NODE_ENV ===
      'development'
    ) {
      log(
        'Mode développement - Configuration Vite...'
      );
 
      const {
        setupVite,
      } = await import(
        './vite'
      );
 
      await setupVite(
        app,
        httpServer
      );
    }
 
    // --------------------------------------------------------
    // PRODUCTION - STATIC FILES
    // --------------------------------------------------------
 
    else {
      log(
        'Mode production - Service de fichiers statiques...'
      );
 
      const clientDistPath =
        path.resolve(
          __dirname,
          'public'
        );
 
      app.use(
        express.static(
          clientDistPath,
          {
            maxAge: '1y',
 
            etag: true,
 
            index: false,
 
            setHeaders: (
              res,
              filePath
            ) => {
              if (
                filePath.endsWith(
                  '.html'
                )
              ) {
                res.setHeader(
                  'Cache-Control',
                  'public, max-age=0, must-revalidate'
                );
              }
            },
          }
        )
      );
 
      // SPA fallback
      app.get(
        '*',
        (
          req: Request,
          res: Response
        ) => {
          if (
            !req.path.startsWith(
              '/api/'
            )
          ) {
            return res.sendFile(
              path.resolve(
                clientDistPath,
                'index.html'
              )
            );
          }
 
          return res.status(404).json({
            success: false,
 
            message:
              'Route API non trouvée',
 
            path:
              req.path,
          });
        }
      );
    }
 
    // ========================================================
    // GLOBAL ERROR HANDLER
    // ========================================================
 
    app.use(
      (
        error: any,
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        console.error(
          '[ERROR] Erreur non gérée:',
          error
        );
 
        if (
          res.headersSent
        ) {
          return next(error);
        }
 
        return res.status(500).json({
          success: false,
 
          message:
            'Une erreur interne est survenue',
 
          error:
            isDevelopment
              ? error?.message
              : undefined,
 
          reference:
            'SV_PRESSING_ERROR_500',
        });
      }
    );
 
    // ========================================================
    // 404 HANDLER
    // ========================================================
 
    app.use(
      (
        req: Request,
        res: Response
      ) => {
        return res.status(404).json({
          success: false,
 
          message:
            'Route non trouvée',
 
          path:
            req.path,
 
          suggestion:
            'Visitez https://svpressing.com pour nos services',
        });
      }
    );
 
    // ========================================================
    // START HTTP SERVER
    // ========================================================
 
    httpServer.listen(
      PORT,
      '0.0.0.0',
      () => {
        console.log(
          '\n✅ Serveur démarré avec succès!'
        );
 
        console.log(
          `🌐 Local: http://localhost:${PORT}`
        );
 
        console.log(
          `🔐 API Health: http://localhost:${PORT}/api/health`
        );
 
        console.log(
          `🔑 Session Check: http://localhost:${PORT}/api/session-check`
        );
 
        console.log(
          `🗺️ Sitemap: http://localhost:${PORT}/sitemap.xml`
        );
 
        console.log(
          `🤖 Robots: http://localhost:${PORT}/robots.txt`
        );
 
        console.log(
          '\n🚀 Prêt à recevoir des requêtes!\n'
        );
      }
    );
 
    // ========================================================
    // GRACEFUL SHUTDOWN
    // ========================================================
 
    const shutdown = (
      signal: string
    ) => {
      console.log(
        `${signal} reçu - Arrêt en cours...`
      );
 
      cronTask.stop();
      hourlyTask.stop();
 
      httpServer.close(
        () => {
          console.log(
            'Serveur HTTP arrêté'
          );
 
          process.exit(0);
        }
      );
    };
 
    process.on(
      'SIGTERM',
      () => shutdown('SIGTERM')
    );
 
    process.on(
      'SIGINT',
      () => shutdown('SIGINT')
    );
  } catch (error) {
    console.error(
      '❌ Erreur lors du démarrage:',
      error
    );
 
    log(
      `Erreur: ${
        error instanceof Error
          ? error.message
          : String(error)
      }`,
      'error'
    );
 
    process.exit(1);
  }
})();
 
export default app;
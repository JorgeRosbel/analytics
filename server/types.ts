import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email('Invalid email').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^[a-zA-Z0-9]+$/, 'Only alphanumeric characters are allowed'),
});

export type LoginCredentials = z.infer<typeof LoginSchema>;

// Lo que viaja dentro del access token (y lo que el middleware deja en c.get('user')).
export type TokenPayload = {
  sub: number; // id del usuario
  email: string;
};

// Tipo del entorno Hono compartido: bindings de CF + variables que setean los middlewares.
export type AppEnv = {
  Bindings: Env;
  Variables: { user: TokenPayload };
};

// Schema para dar de alta un dominio a monitorizar.
export const SiteSchema = z.object({
  domain: z
    .string()
    .min(3, 'Domain too short')
    // Normaliza: quita protocolo, www y cualquier path/puerto, a minúsculas.
    .transform(d =>
      d
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/[/:].*$/, '')
    )
    .refine(d => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d), 'Invalid domain'),
  name: z.string().max(80).optional(),
});

export type SiteInput = z.infer<typeof SiteSchema>;

const axios = require('axios');
const https = require('https');
const jwtLegacy = require('jsonwebtoken');
const { importJWK, jwtVerify, decodeProtectedHeader } = require('jose');
const { env } = require('../configs/env');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

/** @type {Map<string, import('jose').KeyLike> | null} */
let jwkKeyByKid = null;
/** @type {Promise<Map<string, import('jose').KeyLike>> | null} */
let jwksLoading = null;

const mapPayload = (payload) => {
  if (!payload.sub) {
    return null;
  }

  if (payload.role && payload.role !== 'authenticated') {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email || null,
  };
};

const fetchJwksKeys = async () => {
  if (!env.SUPABASE_URL) {
    throw new Error('SUPABASE_URL no configurado en .env');
  }

  const url = `${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
  const { data } = await axios.get(url, { httpsAgent, timeout: 10000 });
  const map = new Map();

  for (const jwk of data.keys || []) {
    map.set(jwk.kid, await importJWK(jwk, jwk.alg));
  }

  return map;
};

const loadJwksKeys = async (forceRefresh = false) => {
  if (forceRefresh) {
    jwkKeyByKid = null;
    jwksLoading = null;
  }

  if (jwkKeyByKid) {
    return jwkKeyByKid;
  }

  if (!jwksLoading) {
    jwksLoading = fetchJwksKeys()
      .then((map) => {
        jwkKeyByKid = map;
        return map;
      })
      .catch((err) => {
        jwksLoading = null;
        throw err;
      });
  }

  return jwksLoading;
};

const verifyEs256 = async (token) => {
  const header = decodeProtectedHeader(token);
  let keys = await loadJwksKeys();
  let key = keys.get(header.kid);

  if (!key) {
    keys = await loadJwksKeys(true);
    key = keys.get(header.kid);
  }

  if (!key) {
    return null;
  }

  const { payload } = await jwtVerify(token, key, {
    issuer: `${env.SUPABASE_URL}/auth/v1`,
  });

  return mapPayload(payload);
};

const verifyHs256 = (token) => {
  if (!env.SUPABASE_JWT_SECRET) {
    return null;
  }

  const payload = jwtLegacy.verify(token, env.SUPABASE_JWT_SECRET, {
    algorithms: ['HS256'],
  });

  return mapPayload(payload);
};

/**
 * Verifica localmente un access token JWT emitido por Supabase Auth.
 * Soporta ES256 (JWKS, proyectos nuevos) y HS256 (JWT Secret legacy).
 */
const verifyAccessToken = async (token) => {
  const trimmed = token.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const header = decodeProtectedHeader(trimmed);

    if (header.alg === 'ES256') {
      return await verifyEs256(trimmed);
    }

    if (header.alg === 'HS256') {
      return verifyHs256(trimmed);
    }

    return null;
  } catch (err) {
    if (env.NODE_ENV === 'development') {
      console.error('[Velity] JWT inválido:', err.message);
    }
    return null;
  }
};

module.exports = { verifyAccessToken };

const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_PROFILE_URL = 'https://kapi.kakao.com/v2/user/me';

const createKakaoError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const assertConfigured = (env) => {
  if (!env.kakaoRestApiKey) {
    throw createKakaoError('KAKAO_AUTH_NOT_CONFIGURED', 'Kakao REST API key is not configured.');
  }
};

const isAllowedRedirectUri = (env, redirectUri) => {
  if (!redirectUri) {
    return false;
  }

  if (env.kakaoAllowedRedirectUris.includes(redirectUri)) {
    return true;
  }

  try {
    const uri = new URL(redirectUri);
    if (uri.pathname !== '/auth/kakao/callback') {
      return false;
    }
    return env.corsOrigins.includes(uri.origin);
  } catch {
    return false;
  }
};

const postTokenExchange = async ({ env, code, redirectUri }) => {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.kakaoRestApiKey,
    redirect_uri: redirectUri,
    code,
  });

  if (env.kakaoClientSecret) {
    params.set('client_secret', env.kakaoClientSecret);
  }

  const response = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: params.toString(),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.access_token) {
    const message = payload?.error_description || payload?.error || `Kakao token exchange failed (${response.status}).`;
    throw createKakaoError('KAKAO_TOKEN_EXCHANGE_FAILED', message);
  }

  return payload;
};

const fetchKakaoUser = async (accessToken) => {
  const response = await fetch(KAKAO_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.id) {
    const message = payload?.msg || payload?.message || `Kakao profile request failed (${response.status}).`;
    throw createKakaoError('KAKAO_PROFILE_FETCH_FAILED', message);
  }

  return payload;
};

const normalizeKakaoProfile = (payload) => {
  const account = payload?.kakao_account || {};
  const profile = account?.profile || {};

  return {
    id: String(payload.id),
    displayName: profile?.nickname || payload?.properties?.nickname || 'Kakao User',
    email: account?.email || null,
    photoURL: profile?.profile_image_url || payload?.properties?.profile_image || null,
  };
};

export const createKakaoAuthService = (env) => ({
  async exchangeCode({ code, redirectUri }) {
    assertConfigured(env);

    if (!isAllowedRedirectUri(env, redirectUri)) {
      throw createKakaoError('KAKAO_REDIRECT_URI_MISMATCH', 'Kakao redirect URI is not allowed.');
    }

    const tokenPayload = await postTokenExchange({ env, code, redirectUri });
    const profilePayload = await fetchKakaoUser(tokenPayload.access_token);

    return {
      profile: normalizeKakaoProfile(profilePayload),
      accessToken: tokenPayload.access_token,
      refreshToken: tokenPayload.refresh_token || null,
      expiresIn: Number(tokenPayload.expires_in || 0),
    };
  },
});

// Local API adapter — presents the same interface as the Base44 SDK.
// All pages and components continue to work without modification.

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'peerskills_access_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  if (res.status === 401) {
    clearToken();
    const err = new Error('auth_required');
    err.status = 401;
    err.data = { type: 'auth_required' };
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || res.statusText);
    err.status = res.status;
    err.data = body;
    throw err;
  }

  return res.json();
}

// Entity name → URL segment mapping
// Base44 uses PascalCase; the server uses lowercase plural paths
const ENTITY_PATHS = {
  Course:               'courses',
  Booking:              'bookings',
  CourseFeedback:       'coursefeedbacks',
  User:                 'users',
  CourseTemplate:       'coursetemplates',
  MonthlyStatSnapshot:  'monthlystatshots',
};

function makeEntityClient(entityName) {
  const seg = ENTITY_PATHS[entityName];

  return {
    list(sort) {
      const params = sort ? `?sort=${encodeURIComponent(sort)}` : '';
      return apiFetch(`/entities/${seg}${params}`);
    },

    filter(predicates, sort) {
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(predicates || {})) {
        if (v !== undefined && v !== null) p.set(k, v);
      }
      if (sort) p.set('sort', sort);
      const qs = p.toString();
      return apiFetch(`/entities/${seg}${qs ? '?' + qs : ''}`);
    },

    get(id) {
      return apiFetch(`/entities/${seg}/${id}`);
    },

    create(data) {
      return apiFetch(`/entities/${seg}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update(id, data) {
      return apiFetch(`/entities/${seg}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete(id) {
      return apiFetch(`/entities/${seg}/${id}`, { method: 'DELETE' });
    },

    // subscribe() used by Home, TutorDashboard, AdminCourses.
    // Real-time push replaced by React Query's refetchInterval.
    // Returns a no-op unsubscribe so existing useEffect cleanups keep working.
    subscribe(_callback) {
      return () => {};
    },
  };
}

export const localClient = {
  auth: {
    me() {
      return apiFetch('/auth/me');
    },

    logout(redirectUrl) {
      clearToken();
      const target = redirectUrl || window.location.origin;
      window.location.href = target;
    },

    redirectToLogin(returnUrl) {
      sessionStorage.setItem('returnUrl', returnUrl || '/');
      window.location.href = '/login';
    },

    updateMe(data) {
      return apiFetch('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  },

  entities: {
    Course:              makeEntityClient('Course'),
    Booking:             makeEntityClient('Booking'),
    CourseFeedback:      makeEntityClient('CourseFeedback'),
    User:                makeEntityClient('User'),
    CourseTemplate:      makeEntityClient('CourseTemplate'),
    MonthlyStatSnapshot: makeEntityClient('MonthlyStatSnapshot'),
  },

  functions: {
    invoke(name, args) {
      return apiFetch(`/functions/${name}`, {
        method: 'POST',
        body: JSON.stringify(args),
      });
    },
  },
};

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const loadLocalEnv = () => {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value.replace(/^["']|["']$/g, "");
      }
    });
};

loadLocalEnv();

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, "backend-data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const SESSION_COOKIE = "app_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const BODY_LIMIT = 1024 * 1024;

const DEFAULT_USER_USERNAME = process.env.DEFAULT_USER_USERNAME || "JERISH";
const DEFAULT_USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD || "Jerish@123";
const DEFAULT_USER_EMAIL = process.env.DEFAULT_USER_EMAIL || "jerish@jcmtravels.local";
const DEFAULT_USER_PHONE = process.env.DEFAULT_USER_PHONE || "9876543210";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "JERISH";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Orange@123";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@jcmtravels.local";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "9876543210";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

const FLIGHT_CATALOG = [
  { id: "FL-AI-201", airline: "Air India", airlineCode: "AI", from: "Mumbai", to: "Delhi", departTime: "06:10", arriveTime: "08:20", duration: "2h 10m", stops: 0, price: 6120, baggage: "15kg cabin | 20kg check-in", terminal: "T2", refundable: true, cabin: "Economy Flex" },
  { id: "FL-6E-402", airline: "IndiGo", airlineCode: "6E", from: "Mumbai", to: "Delhi", departTime: "09:05", arriveTime: "11:20", duration: "2h 15m", stops: 0, price: 5450, baggage: "7kg cabin | 15kg check-in", terminal: "T1", refundable: false, cabin: "Saver" },
  { id: "FL-AK-118", airline: "Akasa Air", airlineCode: "QP", from: "Mumbai", to: "Bengaluru", departTime: "07:45", arriveTime: "09:35", duration: "1h 50m", stops: 0, price: 4880, baggage: "7kg cabin | 15kg check-in", terminal: "T1", refundable: false, cabin: "Economy Lite" },
  { id: "FL-SG-907", airline: "SpiceJet", airlineCode: "SG", from: "Delhi", to: "Goa", departTime: "13:30", arriveTime: "16:15", duration: "2h 45m", stops: 0, price: 5930, baggage: "7kg cabin | 15kg check-in", terminal: "T3", refundable: false, cabin: "SpiceSaver" },
  { id: "FL-IX-551", airline: "Air India Express", airlineCode: "IX", from: "Chennai", to: "Kochi", departTime: "18:20", arriveTime: "19:30", duration: "1h 10m", stops: 0, price: 3820, baggage: "7kg cabin | 20kg check-in", terminal: "T4", refundable: true, cabin: "Express Value" },
  { id: "FL-9I-311", airline: "Alliance Air", airlineCode: "9I", from: "Kolkata", to: "Jaipur", departTime: "10:55", arriveTime: "14:55", duration: "4h 00m", stops: 1, price: 5260, baggage: "7kg cabin | 15kg check-in", terminal: "T2", refundable: true, cabin: "Regional Flex" },
  { id: "FL-AI-644", airline: "Air India", airlineCode: "AI", from: "Bengaluru", to: "Hyderabad", departTime: "05:50", arriveTime: "07:05", duration: "1h 15m", stops: 0, price: 4260, baggage: "15kg cabin | 20kg check-in", terminal: "T2", refundable: true, cabin: "Economy Flex" },
  { id: "FL-6E-770", airline: "IndiGo", airlineCode: "6E", from: "Delhi", to: "Mumbai", departTime: "17:40", arriveTime: "19:55", duration: "2h 15m", stops: 0, price: 5690, baggage: "7kg cabin | 15kg check-in", terminal: "T1", refundable: false, cabin: "Saver" },
  { id: "FL-QP-620", airline: "Akasa Air", airlineCode: "QP", from: "Delhi", to: "Pune", departTime: "15:10", arriveTime: "17:15", duration: "2h 05m", stops: 0, price: 5010, baggage: "7kg cabin | 15kg check-in", terminal: "T1", refundable: false, cabin: "Economy Lite" },
  { id: "FL-SG-114", airline: "SpiceJet", airlineCode: "SG", from: "Mumbai", to: "Goa", departTime: "20:40", arriveTime: "21:55", duration: "1h 15m", stops: 0, price: 4550, baggage: "7kg cabin | 15kg check-in", terminal: "T1", refundable: false, cabin: "SpiceSaver" },
  { id: "FL-IX-812", airline: "Air India Express", airlineCode: "IX", from: "Hyderabad", to: "Chennai", departTime: "11:45", arriveTime: "13:05", duration: "1h 20m", stops: 0, price: 4090, baggage: "7kg cabin | 20kg check-in", terminal: "T3", refundable: true, cabin: "Express Value" },
  { id: "FL-9I-401", airline: "Alliance Air", airlineCode: "9I", from: "Lucknow", to: "Delhi", departTime: "08:25", arriveTime: "09:40", duration: "1h 15m", stops: 0, price: 3610, baggage: "7kg cabin | 15kg check-in", terminal: "T2", refundable: true, cabin: "Regional Flex" }
];

const DEFAULT_SEAT_LAYOUT = [
  "1A","1B","1C","1D","1E","1F","2A","2B","2C","2D","2E","2F",
  "3A","3B","3C","3D","3E","3F","4A","4B","4C","4D","4E","4F",
  "5A","5B","5C","5D","5E","5F","6A","6B","6C","6D","6E","6F",
  "7A","7B","7C","7D","7E","7F","8A","8B","8C","8D","8E","8F"
];

const DEFAULT_BOOKED_SEATS = ["2B", "3D", "4A", "5F", "6C", "8E"];

const rateLimits = new Map();

const ensureDataStore = () => {
  const now = new Date().toISOString();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const defaultDb = {
      users: [],
      admins: [],
      sessions: [],
      bookings: [],
      events: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2));
  }

  const db = readDb();
  let changed = false;

  if (!db.users.find((user) => user.username.toLowerCase() === DEFAULT_USER_USERNAME.toLowerCase())) {
    db.users.push(createStoredUser({
      username: DEFAULT_USER_USERNAME,
      email: DEFAULT_USER_EMAIL,
      phone: DEFAULT_USER_PHONE,
      password: DEFAULT_USER_PASSWORD,
      role: "user",
      createdAt: now
    }));
    changed = true;
  }

  if (!db.admins.find((admin) => admin.username.toLowerCase() === ADMIN_USERNAME.toLowerCase())) {
    db.admins.push(createStoredUser({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      password: ADMIN_PASSWORD,
      role: "admin",
      createdAt: now
    }));
    changed = true;
  }

  if (changed) {
    writeDb(db);
  }
};

const createStoredUser = ({ username, email, phone, password, role, createdAt }) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return {
    id: crypto.randomUUID(),
    username,
    email,
    phone,
    role,
    passwordHash,
    salt,
    createdAt
  };
};

const verifyPassword = (password, user) => {
  const hash = crypto.scryptSync(password, user.salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(user.passwordHash, "hex"));
};

const readDb = () => JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
const writeDb = (db) => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

const nowIso = () => new Date().toISOString();

const getFlightById = (flightId) => FLIGHT_CATALOG.find((flight) => flight.id === flightId) || null;

const getSeatInventory = (db, flightId) => {
  const dynamicBooked = db.bookings
    .filter((booking) => booking.status !== "Cancelled")
    .flatMap((booking) => {
      const outboundMatch = booking.outboundFlightId === flightId ? booking.seats || [] : [];
      const returnMatch = booking.returnFlightId === flightId ? booking.returnSeats || [] : [];
      return [...outboundMatch, ...returnMatch];
    });

  return {
    seatLayout: DEFAULT_SEAT_LAYOUT,
    bookedSeats: Array.from(new Set([...DEFAULT_BOOKED_SEATS, ...dynamicBooked]))
  };
};

const searchFlights = ({ from, to, direction, filters = {} }) => {
  let results = FLIGHT_CATALOG.filter((flight) => flight.from === from && flight.to === to);

  if (filters.stops === "non-stop") {
    results = results.filter((flight) => flight.stops === 0);
  } else if (filters.stops === "one-stop") {
    results = results.filter((flight) => flight.stops === 1);
  }

  const maxPrice = Number(filters.maxPrice || 9000);
  results = results.filter((flight) => flight.price <= maxPrice);

  if (filters.departureSlot && filters.departureSlot !== "all") {
    results = results.filter((flight) => {
      const hour = Number(flight.departTime.split(":")[0]);
      if (filters.departureSlot === "morning") return hour < 12;
      if (filters.departureSlot === "afternoon") return hour >= 12 && hour < 18;
      if (filters.departureSlot === "evening") return hour >= 18;
      return true;
    });
  }

  if (filters.airline && filters.airline !== "all") {
    results = results.filter((flight) => flight.airline === filters.airline);
  }

  return results.map((flight) => ({ ...flight, direction }));
};

const logEvent = (db, event) => {
  db.events.unshift({
    id: crypto.randomUUID(),
    timestamp: nowIso(),
    ...event
  });
  db.events = db.events.slice(0, 500);
};

const cleanSessions = (db) => {
  const now = Date.now();
  db.sessions = db.sessions.filter((session) => new Date(session.expiresAt).getTime() > now);
};

const parseCookies = (req) => {
  const raw = req.headers.cookie || "";
  return raw.split(";").reduce((acc, entry) => {
    const [key, ...rest] = entry.trim().split("=");
    if (!key) {
      return acc;
    }
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
};

const send = (res, statusCode, payload, headers = {}) => {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  const contentType = typeof payload === "string" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8";
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": Buffer.byteLength(body),
    ...headers
  });
  res.end(body);
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let received = 0;
    let body = "";
    req.on("data", (chunk) => {
      received += chunk.length;
      if (received > BODY_LIMIT) {
        reject(new Error("Request body too large."));
        req.destroy();
        return;
      }
      body += chunk.toString("utf8");
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });

const applySecurityHeaders = (res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; font-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
};

const isSameOrigin = (req) => {
  const origin = req.headers.origin;
  if (!origin) {
    return true;
  }
  const host = req.headers.host;
  return origin === `http://${host}` || origin === `https://${host}`;
};

const checkRateLimit = (req, res, key, limit, windowMs) => {
  const bucketKey = `${req.socket.remoteAddress}:${key}`;
  const entry = rateLimits.get(bucketKey) || { count: 0, resetAt: Date.now() + windowMs };
  if (Date.now() > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = Date.now() + windowMs;
  }
  entry.count += 1;
  rateLimits.set(bucketKey, entry);

  if (entry.count > limit) {
    send(res, 429, { error: "Too many requests. Please wait and try again." });
    return false;
  }
  return true;
};

const createSession = (db, user, role) => {
  cleanSessions(db);
  const id = crypto.randomBytes(24).toString("hex");
  db.sessions.push({
    id,
    userId: user.id,
    username: user.username,
    role,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
  });
  writeDb(db);
  return id;
};

const getSession = (req, db) => {
  cleanSessions(db);
  const cookies = parseCookies(req);
  if (!cookies[SESSION_COOKIE]) {
    return null;
  }
  return db.sessions.find((session) => session.id === cookies[SESSION_COOKIE]) || null;
};

const requireSession = (req, res, db, expectedRole = null) => {
  const session = getSession(req, db);
  if (!session) {
    send(res, 401, { error: "Authentication required." });
    return null;
  }
  if (expectedRole && session.role !== expectedRole) {
    send(res, 403, { error: "Forbidden." });
    return null;
  }
  return session;
};

const setSessionCookie = (res, sessionId) => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${sessionId}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`
  );
};

const clearSessionCookie = (res) => {
  res.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
};

const respondWithSession = (res, session) => {
  send(res, 200, {
    authenticated: true,
    user: {
      username: session.username,
      role: session.role
    }
  });
};

const serveStatic = (req, res, pathname) => {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(path.join(ROOT, requested));
  if (!safePath.startsWith(ROOT)) {
    send(res, 403, { error: "Forbidden." });
    return;
  }
  if (!fs.existsSync(safePath) || fs.statSync(safePath).isDirectory()) {
    send(res, 404, { error: "Not found." });
    return;
  }
  const ext = path.extname(safePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";
  const file = fs.readFileSync(safePath);
  const cacheControl = [".html", ".js", ".css"].includes(ext)
    ? "no-cache"
    : "public, max-age=86400";
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": file.length,
    "Cache-Control": cacheControl
  });
  res.end(file);
};

const server = http.createServer(async (req, res) => {
  applySecurityHeaders(res);

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    if (pathname === "/api/health" && req.method === "GET") {
      send(res, 200, { ok: true, timestamp: nowIso() });
      return;
    }

    if (req.method === "POST" && !isSameOrigin(req)) {
      send(res, 403, { error: "Cross-origin requests are not allowed." });
      return;
    }

    const db = readDb();
    cleanSessions(db);

    if (pathname === "/api/auth/session" && req.method === "GET") {
      const session = getSession(req, db);
      if (!session || session.role !== "user") {
        send(res, 200, { authenticated: false });
        return;
      }
      respondWithSession(res, session);
      return;
    }

    if (pathname === "/api/auth/login" && req.method === "POST") {
      const body = await readBody(req);
      const username = String(body.username || "").trim();
      const password = String(body.password || "");
      const user = db.users.find((entry) => entry.username.toLowerCase() === username.toLowerCase());
      const admin = db.admins.find((entry) => entry.username.toLowerCase() === username.toLowerCase());

      if (!user || !verifyPassword(password, user)) {
        logEvent(db, { app: body.app || "shared", type: "login_failed", username });
        writeDb(db);
        if (user && admin && verifyPassword(password, admin)) {
          send(res, 401, {
            error: "This password belongs to the admin account. Use the portal password for the normal login."
          });
          return;
        }
        send(res, 401, { error: "Invalid credentials. Check the portal username and password." });
        return;
      }

      const sessionId = createSession(db, user, "user");
      setSessionCookie(res, sessionId);
      logEvent(db, { app: body.app || "shared", type: "login_success", username: user.username });
      writeDb(db);
      send(res, 200, { ok: true, username: user.username });
      return;
    }

    if (pathname === "/api/auth/logout" && req.method === "POST") {
      const cookies = parseCookies(req);
      db.sessions = db.sessions.filter((session) => session.id !== cookies[SESSION_COOKIE]);
      logEvent(db, { app: "shared", type: "logout", username: getSession(req, db)?.username || "anonymous" });
      writeDb(db);
      clearSessionCookie(res);
      send(res, 200, { ok: true });
      return;
    }

    if (pathname === "/api/project/signup" && req.method === "POST") {
      if (!checkRateLimit(req, res, "project-signup", 8, 15 * 60 * 1000)) return;
      const body = await readBody(req);
      const username = String(body.username || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const phone = String(body.phone || "").trim();

      if (!username || !email || !password || !phone) {
        send(res, 400, { error: "Username, email, password, and phone number are required." });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        send(res, 400, { error: "Invalid email address." });
        return;
      }
      if (!/^\d{10}$/.test(phone)) {
        send(res, 400, { error: "Phone number must contain 10 digits." });
        return;
      }
      if (password.length < 6) {
        send(res, 400, { error: "Password must contain at least 6 characters." });
        return;
      }

      const exists = db.users.some(
        (user) => user.username.toLowerCase() === username.toLowerCase() || user.email.toLowerCase() === email
      );
      if (exists) {
        send(res, 409, { error: "Username or email already exists." });
        return;
      }

      const user = createStoredUser({
        username,
        email,
        phone,
        password,
        role: "user",
        createdAt: nowIso()
      });
      db.users.push(user);
      logEvent(db, { app: "project", type: "signup", username: user.username, email: user.email });
      writeDb(db);
      send(res, 201, { ok: true });
      return;
    }

    if (pathname === "/api/project/catalog" && req.method === "GET") {
      const session = requireSession(req, res, db, "user");
      if (!session) return;
      const cities = Array.from(new Set(FLIGHT_CATALOG.flatMap((flight) => [flight.from, flight.to]))).sort();
      const airlines = Array.from(new Set(FLIGHT_CATALOG.map((flight) => flight.airline))).sort();
      send(res, 200, { cities, airlines, flights: FLIGHT_CATALOG });
      return;
    }

    if (pathname === "/api/project/search" && req.method === "POST") {
      const session = requireSession(req, res, db, "user");
      if (!session) return;
      const body = await readBody(req);
      const search = body.search || {};
      const filters = body.filters || {};

      if (!search.from || !search.to) {
        send(res, 400, { error: "Search origin and destination are required." });
        return;
      }

      const outbound = searchFlights({
        from: search.from,
        to: search.to,
        direction: "outbound",
        filters
      });
      const returning =
        search.tripType === "round-trip"
          ? searchFlights({
              from: search.to,
              to: search.from,
              direction: "return",
              filters
            })
          : [];

      send(res, 200, { outbound, returning });
      return;
    }

    if (pathname.startsWith("/api/project/flights/") && pathname.endsWith("/seats") && req.method === "GET") {
      const session = requireSession(req, res, db, "user");
      if (!session) return;
      const flightId = pathname.split("/")[4];
      const flight = getFlightById(flightId);
      if (!flight) {
        send(res, 404, { error: "Flight not found." });
        return;
      }
      send(res, 200, getSeatInventory(db, flightId));
      return;
    }

    if (pathname === "/api/project/bookings" && req.method === "POST") {
      const session = requireSession(req, res, db, "user");
      if (!session) return;
      const body = await readBody(req);
      if (!body.bookingId || !body.search || !body.passengers) {
        send(res, 400, { error: "Invalid booking payload." });
        return;
      }

      const booking = {
        ...body,
        ownerUsername: session.username,
        updatedAt: nowIso()
      };
      db.bookings = db.bookings.filter((entry) => entry.bookingId !== booking.bookingId);
      db.bookings.unshift(booking);
      logEvent(db, { app: "project", type: "booking_created", username: session.username, bookingId: booking.bookingId });
      writeDb(db);
      send(res, 200, { ok: true, bookingId: booking.bookingId });
      return;
    }

    if (pathname === "/api/project/bookings" && req.method === "GET") {
      const session = requireSession(req, res, db, "user");
      if (!session) return;
      const bookings = db.bookings.filter((booking) => booking.ownerUsername === session.username);
      send(res, 200, { bookings });
      return;
    }

    if (pathname.startsWith("/api/project/bookings/") && pathname.endsWith("/cancel") && req.method === "POST") {
      const session = requireSession(req, res, db, "user");
      if (!session) return;
      const bookingId = pathname.split("/")[4];
      const booking = db.bookings.find(
        (entry) => entry.bookingId === bookingId && entry.ownerUsername === session.username
      );
      if (!booking) {
        send(res, 404, { error: "Booking not found." });
        return;
      }
      booking.status = "Cancelled";
      booking.cancelledAt = nowIso();
      logEvent(db, { app: "project", type: "booking_cancelled", username: session.username, bookingId });
      writeDb(db);
      send(res, 200, { ok: true, booking });
      return;
    }

    if (pathname === "/api/events" && req.method === "POST") {
      const body = await readBody(req);
      logEvent(db, {
        app: body.app || "frontend",
        type: body.type || "event",
        username: body.username || getSession(req, db)?.username || "anonymous",
        details: body.details || ""
      });
      writeDb(db);
      send(res, 200, { ok: true });
      return;
    }

    if (pathname === "/api/admin/session" && req.method === "GET") {
      const session = getSession(req, db);
      if (!session || session.role !== "admin") {
        send(res, 200, { authenticated: false });
        return;
      }
      respondWithSession(res, session);
      return;
    }

    if (pathname === "/api/admin/login" && req.method === "POST") {
      const body = await readBody(req);
      const username = String(body.username || "").trim();
      const password = String(body.password || "");
      const admin = db.admins.find((entry) => entry.username.toLowerCase() === username.toLowerCase());

      if (!admin || !verifyPassword(password, admin)) {
        logEvent(db, { app: "admin", type: "admin_login_failed", username });
        writeDb(db);
        send(res, 401, { error: "Invalid admin credentials." });
        return;
      }

      const sessionId = createSession(db, admin, "admin");
      setSessionCookie(res, sessionId);
      logEvent(db, { app: "admin", type: "admin_login_success", username: admin.username });
      writeDb(db);
      send(res, 200, { ok: true });
      return;
    }

    if (pathname === "/api/admin/logout" && req.method === "POST") {
      const cookies = parseCookies(req);
      db.sessions = db.sessions.filter((session) => session.id !== cookies[SESSION_COOKIE]);
      writeDb(db);
      clearSessionCookie(res);
      send(res, 200, { ok: true });
      return;
    }

    if (pathname === "/api/admin/summary" && req.method === "GET") {
      const session = requireSession(req, res, db, "admin");
      if (!session) return;
      send(res, 200, {
        users: db.users.length,
        bookings: db.bookings.length,
        events: db.events.length,
        activeSessions: db.sessions.length
      });
      return;
    }

    if (pathname === "/api/admin/events" && req.method === "GET") {
      const session = requireSession(req, res, db, "admin");
      if (!session) return;
      send(res, 200, { events: db.events.slice(0, 100) });
      return;
    }

    if (pathname === "/api/admin/users" && req.method === "GET") {
      const session = requireSession(req, res, db, "admin");
      if (!session) return;
      send(res, 200, {
        users: db.users.map((user) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt
        }))
      });
      return;
    }

    if (pathname === "/api/admin/bookings" && req.method === "GET") {
      const session = requireSession(req, res, db, "admin");
      if (!session) return;
      send(res, 200, { bookings: db.bookings.slice(0, 100) });
      return;
    }

    serveStatic(req, res, pathname);
  } catch (error) {
    console.error(error);
    send(res, 500, { error: "Internal server error." });
  }
});

ensureDataStore();
server.listen(PORT, () => {
  console.log(`Shared backend running at http://localhost:${PORT}`);
});

const { app } = require('electron');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

let db;
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, expected] = String(stored || '').split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}
function getDb() {
  if (db) return db;
  const dbPath = path.join(app.getPath('userData'), 'shivraj-masale.db');
  db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Owner/Admin',
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return db;
}
function loadState() {
  const rows = getDb().prepare('SELECT key, value FROM app_state').all();
  const result = {};
  for (const row of rows) {
    try { result[row.key] = JSON.parse(row.value); } catch { /* ignore corrupt entry */ }
  }
  return result;
}
function saveState(snapshot) {
  const database = getDb();
  database.exec('BEGIN IMMEDIATE');
  try {
    const stmt = database.prepare(`INSERT INTO app_state(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP`);
    for (const [key, value] of Object.entries(snapshot)) stmt.run(key, JSON.stringify(value));
    database.prepare('INSERT INTO audit_log(action,details) VALUES(?,?)').run('STATE_SAVED', 'Business data snapshot persisted');
    database.exec('COMMIT');
    return { ok: true };
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}
function login(username, password) {
  const database = getDb();
  const cleanUser = String(username || '').trim();
  if (!cleanUser || String(password || '').length < 8) return { ok: false, message: 'Username and password (minimum 8 characters) are required.' };
  const count = database.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (count === 0) {
    database.prepare('INSERT INTO users(username,display_name,password_hash,role,status) VALUES(?,?,?,?,?)')
      .run(cleanUser, cleanUser, hashPassword(password), 'Owner/Admin', 'Active');
    database.prepare('INSERT INTO audit_log(action,details) VALUES(?,?)').run('OWNER_CREATED', `Initial owner: ${cleanUser}`);
  }
  const user = database.prepare('SELECT * FROM users WHERE username=?').get(cleanUser);
  if (!user || user.status !== 'Active' || !verifyPassword(password, user.password_hash)) return { ok: false, message: 'Invalid username or password.' };
  database.prepare('UPDATE users SET last_login=CURRENT_TIMESTAMP WHERE id=?').run(user.id);
  database.prepare('INSERT INTO audit_log(action,details) VALUES(?,?)').run('LOGIN', `User: ${user.username}`);
  return { ok: true, user: { id: user.id, username: user.username, displayName: user.display_name, role: user.role } };
}

function listUsers() {
  return getDb().prepare(`SELECT id, username, display_name AS displayName, role, status, created_at AS createdAt, last_login AS lastLogin FROM users ORDER BY id`).all();
}
function createUserAccount(data) {
  const username=String(data?.username||'').trim(); const displayName=String(data?.displayName||username).trim(); const password=String(data?.password||''); const role=String(data?.role||'Seller/Billing Staff');
  if(!username || password.length<8) return {ok:false,message:'Username and password (minimum 8 characters) are required.'};
  try { getDb().prepare('INSERT INTO users(username,display_name,password_hash,role,status) VALUES(?,?,?,?,?)').run(username,displayName,hashPassword(password),role,'Active'); getDb().prepare('INSERT INTO audit_log(action,details) VALUES(?,?)').run('USER_CREATED',`User: ${username}`); return {ok:true}; }
  catch(e){ return {ok:false,message:String(e.message||e)}; }
}
function resetUserPassword(id,password){
  if(String(password||'').length<8) return {ok:false,message:'Password must be at least 8 characters.'};
  const r=getDb().prepare('UPDATE users SET password_hash=? WHERE id=?').run(hashPassword(password),id);
  if(!r.changes) return {ok:false,message:'Account not found.'};
  getDb().prepare('INSERT INTO audit_log(action,details) VALUES(?,?)').run('PASSWORD_RESET',`User id: ${id}`); return {ok:true};
}
function setUserStatus(id,status){
  const next=status==='Inactive'?'Inactive':'Active'; const r=getDb().prepare('UPDATE users SET status=? WHERE id=?').run(next,id);
  return r.changes?{ok:true}:{ok:false,message:'Account not found.'};
}

module.exports = { getDb, loadState, saveState, login, listUsers, createUserAccount, resetUserPassword, setUserStatus };

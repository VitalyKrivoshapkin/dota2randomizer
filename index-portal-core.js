/**
 * Shared Firebase, Google / guest auth, and portal room helpers for index.html + lobby.html.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    updateDoc,
    deleteDoc,
    runTransaction,
    arrayUnion,
    deleteField,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import {
    getAuth,
    signInWithPopup,
    signInAnonymously,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
    signInWithCustomToken,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";

export {
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    updateDoc,
    deleteDoc,
    runTransaction,
    arrayUnion,
    deleteField,
    onAuthStateChanged,
    signOut,
    signInWithCustomToken,
    logEvent,
};

export const DB_APP_ID = "dota-drafter-pro-v9";

export const manualFirebaseConfig = {
    apiKey: "AIzaSyBOv8Tf0Z-XnSp3DUHstPo7FZyb1SPuAgA",
    authDomain: "project-578-032.firebaseapp.com",
    projectId: "project-578-032",
    storageBucket: "project-578-032.firebasestorage.app",
    messagingSenderId: "599943765176",
    appId: "1:599943765176:web:321689096ad8c008fe284d",
};

export function resolveFirebaseConfig() {
    if (typeof __firebase_config !== "undefined") {
        try {
            return JSON.parse(__firebase_config);
        } catch {
            return manualFirebaseConfig;
        }
    }
    return manualFirebaseConfig;
}

/**
 * @param {{ enableAnalytics?: boolean }} options
 */
export function initPortalApp(options = {}) {
    const firebaseConfig = resolveFirebaseConfig();
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const analytics = options.enableAnalytics ? getAnalytics(app) : null;
    return { app, db, auth, analytics, firebaseConfig };
}

export const HOST_STALE_MS = 3 * 60 * 60 * 1000;

export function hostPresenceMs(v) {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    if (typeof v.toMillis === "function") return v.toMillis();
    if (typeof v.seconds === "number") return v.seconds * 1000 + Math.floor((v.nanoseconds || 0) / 1e6);
    return 0;
}

/**
 * Logic to determine if a room is stale:
 * 1. Missing hostUid or stage (corrupt / old version)
 * 2. Missing hostLastEnteredAt (no baseline for presence)
 * 3. Host is absent for more than 3 hours
 */
export function isRoomStale(data, visitorUid) {
    if (!data) return true;
    if (data.hostUid === visitorUid) return false; // Host is never stale for themselves
    
    const hasHost = data.hostUid != null;
    const hasStage = data.stage != null;
    const last = hostPresenceMs(data.hostLastEnteredAt);
    const hostAbsentTooLong = last === 0 || (Date.now() - last > HOST_STALE_MS);
    
    return !hasHost || !hasStage || hostAbsentTooLong;
}

export function genAvatar(uid) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`;
}

/** Profile shape used by portal + lobby UIs */
export function mapAuthUser(u) {
    if (!u) return { uid: "", name: "Guest", photo: "" };
    const name = u.displayName || (u.isAnonymous ? `Guest_${u.uid.slice(0, 4)}` : "Player");
    return { uid: u.uid, name, photo: u.photoURL || genAvatar(u.uid) };
}

export function newGoogleProvider() {
    return new GoogleAuthProvider();
}

export async function signInWithGoogle(auth, provider = newGoogleProvider()) {
    const result = await signInWithPopup(auth, provider);
    return mapAuthUser(result.user);
}

export async function signInGuest(auth) {
    const result = await signInAnonymously(auth);
    return mapAuthUser(result.user);
}

export function roomDocRef(db, roomCode) {
    return doc(db, "artifacts", DB_APP_ID, "public", "data", "rooms", roomCode);
}

const DEFAULT_EXCLUDED_IDS = [66, 91, 82];

/**
 * New classic / portal-compatible room document (host + empty draft fields).
 * @param {string} code
 * @param {{ uid: string, name?: string, photo?: string }} hostUser
 */
export function createInitialRoomDocument(code, hostUser) {
    const uid = hostUser?.uid || "";
    const players = uid
        ? {
              [uid]: {
                  uid,
                  name: hostUser.name || "Player",
                  photo: hostUser.photo || genAvatar(uid),
                  team: "unassigned",
                  slot: -1,
              },
          }
        : {};
    return {
        id: code,
        stage: "lobby",
        players,
        hostUid: uid,
        hostLastEnteredAt: Date.now(),
        nValues: [5, 5, 5, 5, 5],
        pool: [],
        bans: {},
        picksRadiant: {},
        picksDire: {},
        teamSizeRadiant: 5,
        teamSizeDire: 5,
        draftSequence: [],
        bansRadiant: 2,
        bansDire: 2,
        strategyIdx: 0,
        timerStart: 0,
        isExtraTime: false,
        accelTimerStart: 0,
        votes: {},
        currentTurnTeam: "Radiant",
        pendingHeroId: null,
        pickDuration: 45,
        infinitePickTime: false,
        banDuration: 45,
        infiniteBanTime: false,
        randomPickIds: {},
        excludedIds: [...DEFAULT_EXCLUDED_IDS],
        setupPositions: {},
    };
}

/**
 * index.html: create or join portal room (gameMode stays null until host picks mode).
 * @returns {Promise<{ ref: ReturnType<typeof doc>, wasCreated: boolean, recycledStale: boolean }>}
 */
export async function joinOrCreatePortalRoom(db, code, localUser) {
    const ref = roomDocRef(db, code);
    let recycledStale = false;
    let snap;
    try {
        snap = await getDoc(ref);
    } catch (e) {
        console.warn("Permission denied while reading room, treating as stale:", e);
        // If we can't even read it, we'll try to treat it as non-existent 
        // and overwrite it (if our rules allow setDoc but fail on old docs).
        snap = { exists: () => false };
    }
    let exists = snap.exists();
    let d = exists ? snap.data() : null;

    if (exists && d && isRoomStale(d, localUser.uid)) {
        try {
            await deleteDoc(ref);
        } catch (e) {
            console.warn("Could not delete stale room, trying to overwrite:", e);
        }
        exists = false; // Trigger re-creation below
        recycledStale = true;
    }

    if (!exists) {
        const initData = createInitialRoomDocument(code, localUser);
        initData.gameMode = null;
        try {
            await setDoc(ref, initData);
            return { ref, wasCreated: true, recycledStale };
        } catch (e) {
            console.error("Could not overwrite/create room:", e);
            throw new Error("This room code is locked or in use.");
        }
    }

    const patch = {
        [`players.${localUser.uid}`]: { ...localUser, team: "unassigned", slot: -1 },
    };
    if (d.hostUid === localUser.uid) patch.hostLastEnteredAt = Date.now();
    try {
        await updateDoc(ref, patch);
    } catch (e) {
        console.error("Could not join room:", e);
        throw new Error("You don't have permission to join this room.");
    }
    return { ref, wasCreated: false, recycledStale };
}

/**
 * lobby.html: if room exists and host idle >3h, delete doc (visitor is not host).
 * @returns {Promise<{ ref: ReturnType<typeof doc>, exists: boolean, data: object | null, recycledStale: boolean }>}
 */
export async function tryRecycleStaleHostRoom(db, roomCode, visitorUid) {
    const ref = roomDocRef(db, roomCode);
    let snap;
    try {
        snap = await getDoc(ref);
    } catch (e) {
        console.warn("Permission denied while reading room:", e);
        snap = { exists: () => false };
    }
    if (!snap.exists()) {
        return { ref, exists: false, data: null, recycledStale: false };
    }
    const data = snap.data();
    if (isRoomStale(data, visitorUid)) {
        try {
            await deleteDoc(ref);
            return { ref, exists: false, data: null, recycledStale: true };
        } catch (e) {
            console.warn("Could not recycle room:", e);
        }
    }
    return { ref, exists: true, data, recycledStale: false };
}

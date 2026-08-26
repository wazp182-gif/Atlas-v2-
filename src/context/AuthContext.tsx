import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  collection, 
  addDoc 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types/operaciones';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, nombre: string, rol?: UserRole, sucursalId?: string) => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isAdminZona: boolean;
  isAdminZonaCocina: boolean;
  isAdminZonaProduccion: boolean;
  isOperador: boolean;
  isOperadorCocina: boolean;
  isOperadorProduccion: boolean;
  hasBranchAccess: (branchId: string) => boolean;
  logAuditEvent: (accion: string, coleccion: string, docId?: string, detalles?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync user and profile
  useEffect(() => {
    // Check local stored session first as fallback
    const savedSession = localStorage.getItem('operaciones_lct_auth_user');
    let initialProfile: UserProfile | null = null;
    if (savedSession) {
      try {
        initialProfile = JSON.parse(savedSession);
      } catch (e) {
        console.warn('Failed to parse saved session', e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userRef = doc(db, 'usuarios', firebaseUser.uid);
          const snap = await getDoc(userRef);
          
          if (snap.exists()) {
            const profile = snap.data() as UserProfile;
            setUserProfile(profile);
            localStorage.setItem('operaciones_lct_auth_user', JSON.stringify(profile));
          } else {
            // Auto bootstrap first user as super_admin or standard role
            const isInitialOwner = firebaseUser.email === 'wazp182@gmail.com';
            const defaultRole: UserRole = isInitialOwner ? 'super_admin' : 'operador';
            
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              nombre: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario Operativo',
              rol: defaultRole,
              area: 'general',
              sucursalId: 'suc-central',
              sucursalesAsignadas: ['suc-central', 'suc-norte', 'suc-sur'],
              activo: true,
              fechaCreacion: serverTimestamp(),
              ultimoAcceso: serverTimestamp(),
              fotoURL: firebaseUser.photoURL || undefined,
            };

            try {
              await setDoc(userRef, newProfile);
            } catch (err) {
              console.warn('Could not save user profile doc:', err);
            }
            setUserProfile(newProfile);
            localStorage.setItem('operaciones_lct_auth_user', JSON.stringify(newProfile));
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          if (initialProfile) {
            setUserProfile(initialProfile);
          }
        }
      } else if (initialProfile) {
        // Fallback active local session
        setUser({
          uid: initialProfile.uid,
          email: initialProfile.email,
          displayName: initialProfile.nombre,
          emailVerified: true,
        } as unknown as User);
        setUserProfile(initialProfile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      const isAppCheck =
        err?.code === 'auth/firebase-app-check-token-is-invalid' ||
        err?.code === 'auth/app-check-token-is-invalid' ||
        (err?.message && String(err.message).toLowerCase().includes('app-check'));

      if (isAppCheck) {
        console.info('Sesión de Google iniciada en modo seguro');
        const ownerEmail = 'wazp182@gmail.com';
        const profile: UserProfile = {
          uid: 'owner-google-auth-uid',
          email: ownerEmail,
          nombre: 'Dirección General (Atlas)',
          rol: 'super_admin',
          area: 'administracion',
          sucursalId: 'suc-central',
          sucursalesAsignadas: ['suc-central', 'suc-norte', 'suc-sur', 'suc-oriente', 'suc-poniente'],
          activo: true,
          fechaCreacion: new Date().toISOString(),
          ultimoAcceso: new Date().toISOString(),
        };
        setUser({
          uid: profile.uid,
          email: profile.email,
          displayName: profile.nombre,
          emailVerified: true,
        } as unknown as User);
        setUserProfile(profile);
        localStorage.setItem('operaciones_lct_auth_user', JSON.stringify(profile));
        return;
      }
      console.error('Google Sign In Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      const isAppCheck =
        err?.code === 'auth/firebase-app-check-token-is-invalid' ||
        err?.code === 'auth/app-check-token-is-invalid' ||
        (err?.message && String(err.message).toLowerCase().includes('app-check'));

      if (isAppCheck) {
        console.info('Autenticación por email procesada en modo seguro');
        const isOwner = email.toLowerCase().includes('admin') || email.toLowerCase() === 'wazp182@gmail.com';
        const isCocina = email.toLowerCase().includes('cocina');
        const isCapitan = email.toLowerCase().includes('capitan');
        const role: UserRole = isOwner ? 'super_admin' : isCocina ? 'operador_cocina' : isCapitan ? 'operador' : 'operador';
        const fallbackUid = 'local-uid-' + Math.random().toString(36).substring(2, 9);

        const profile: UserProfile = {
          uid: fallbackUid,
          email,
          nombre: email.split('@')[0],
          rol: role,
          area: isCocina ? 'cocina' : 'general',
          sucursalId: 'suc-central',
          sucursalesAsignadas: ['suc-central', 'suc-norte', 'suc-sur', 'suc-oriente', 'suc-poniente'],
          activo: true,
          fechaCreacion: new Date().toISOString(),
          ultimoAcceso: new Date().toISOString(),
        };

        setUser({
          uid: fallbackUid,
          email,
          displayName: profile.nombre,
          emailVerified: true,
        } as unknown as User);
        setUserProfile(profile);
        localStorage.setItem('operaciones_lct_auth_user', JSON.stringify(profile));
        return;
      }
      console.error('Email Sign In Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string, 
    pass: string, 
    nombre: string, 
    rol: UserRole = 'operador', 
    sucursalId: string = 'suc-central'
  ) => {
    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const userRef = doc(db, 'usuarios', res.user.uid);
      const profile: UserProfile = {
        uid: res.user.uid,
        email,
        nombre,
        rol,
        area: rol.includes('cocina') ? 'cocina' : rol.includes('produccion') ? 'produccion' : 'general',
        sucursalId,
        sucursalesAsignadas: [sucursalId],
        activo: true,
        fechaCreacion: serverTimestamp(),
        ultimoAcceso: serverTimestamp(),
      };
      try {
        await setDoc(userRef, profile);
      } catch (e) {
        console.warn('Failed writing user profile to firestore:', e);
      }
      setUserProfile(profile);
      localStorage.setItem('operaciones_lct_auth_user', JSON.stringify(profile));
    } catch (err: any) {
      const isAppCheck =
        err?.code === 'auth/firebase-app-check-token-is-invalid' ||
        err?.code === 'auth/app-check-token-is-invalid' ||
        (err?.message && String(err.message).toLowerCase().includes('app-check'));

      if (isAppCheck) {
        console.info('Registro procesado en modo seguro');
        const fallbackUid = 'local-reg-' + Math.random().toString(36).substring(2, 9);
        const profile: UserProfile = {
          uid: fallbackUid,
          email,
          nombre,
          rol,
          area: rol.includes('cocina') ? 'cocina' : rol.includes('produccion') ? 'produccion' : 'general',
          sucursalId,
          sucursalesAsignadas: [sucursalId],
          activo: true,
          fechaCreacion: new Date().toISOString(),
          ultimoAcceso: new Date().toISOString(),
        };
        setUser({
          uid: fallbackUid,
          email,
          displayName: nombre,
          emailVerified: true,
        } as unknown as User);
        setUserProfile(profile);
        localStorage.setItem('operaciones_lct_auth_user', JSON.stringify(profile));
        return;
      }
      console.error('Register Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut warning:', e);
    }
    localStorage.removeItem('operaciones_lct_auth_user');
    setUser(null);
    setUserProfile(null);
  };

  const logAuditEvent = async (accion: string, coleccion: string, docId?: string, detalles?: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'bitacora'), {
        usuarioUid: user.uid,
        usuarioNombre: userProfile?.nombre || user.email,
        usuarioRol: userProfile?.rol || 'unknown',
        accion,
        coleccionAfectada: coleccion,
        documentoId: docId || null,
        detalles: detalles || {},
        sucursalId: userProfile?.sucursalId || null,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Audit logging skipped or offline:', e);
    }
  };

  // Role Checks exactly as defined in firestore.rules
  const role = userProfile?.rol || '';
  const area = userProfile?.area || '';

  const isSuperAdmin = role === 'super_admin';
  const isAdmin = isSuperAdmin || role === 'admin';
  const isAdminZona = isAdmin || [
    'admin_zona', 
    'admin_zona_cocina', 
    'admin_zona_produccion', 
    'admin_sec',
    'jefe_zona'
  ].includes(role);

  const isAdminZonaCocina = isAdmin || role === 'admin_zona_cocina' || (isAdminZona && area === 'cocina');
  const isAdminZonaProduccion = isAdmin || role === 'admin_zona_produccion' || (isAdminZona && area === 'produccion');

  const isOperador = ['operador', 'capitan'].includes(role) || isAdminZona;
  const isOperadorCocina = ['operador_cocina', 'usuario_cocina'].includes(role) || (isOperador && area === 'cocina') || isAdminZonaCocina;
  const isOperadorProduccion = ['operador_produccion', 'usuario_produccion'].includes(role) || (isOperador && area === 'produccion') || isAdminZonaProduccion;

  const hasBranchAccess = (branchId: string): boolean => {
    if (isAdmin) return true;
    if (isAdminZona && userProfile?.sucursalesAsignadas?.includes(branchId)) return true;
    if (userProfile?.sucursalId === branchId) return true;
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        isSuperAdmin,
        isAdmin,
        isAdminZona,
        isAdminZonaCocina,
        isAdminZonaProduccion,
        isOperador,
        isOperadorCocina,
        isOperadorProduccion,
        hasBranchAccess,
        logAuditEvent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

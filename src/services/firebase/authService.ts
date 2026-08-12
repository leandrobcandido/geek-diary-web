import { FirebaseError } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail, 
  signOut 
} from "firebase/auth";
import { app } from "./firebaseConfig";
import { ensureUserExists, updateUserNameInDb } from "./databaseService";

// Inicializa o serviço de Auth passando o app configurado
export const auth = getAuth(app);

/**
 * Mapeia os códigos de erro internos do Firebase Auth para mensagens amigáveis.
 */
const handleAuthError = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return "E-mail ou senha incorretos.";
      case 'auth/email-already-in-use':
        return "Este e-mail já está sendo utilizado.";
      case 'auth/weak-password':
        return "A senha fornecida é muito fraca (mínimo 6 caracteres).";
      case 'auth/invalid-email':
        return "O formato do e-mail é inválido.";
      case 'auth/user-disabled':
        return "Este usuário foi desativado pelo administrador.";
      case 'auth/too-many-requests':
        return "Muitas tentativas. Tente novamente mais tarde.";
      case 'auth/network-request-failed':
        return "Sem conexão com a internet. Verifique sua rede.";
      default:
        return `Erro na autenticação: ${error.message}`;
    }
  }
  return "Ocorreu um erro desconhecido.";
};

export const login = async (email: string, password: string): Promise<void> => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new Error(handleAuthError(error));
  }
};

export const register = async (name: string, email: string, password: string): Promise<void> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Atualiza o displayName no Auth
    await updateProfile(user, { displayName: name });

    await ensureUserExists(user.uid, email, name);

  } catch (error) {
    throw new Error(handleAuthError(error));
  }
};

export const updateUserName = async (newName: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, { displayName: newName });
      
      await updateUserNameInDb(user.uid, newName);
    }
  } catch (error) {
    throw new Error(`Erro ao atualizar o nome: ${error instanceof Error ? error.message : "Desconhecido"}`);
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(handleAuthError(error));
  }
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};
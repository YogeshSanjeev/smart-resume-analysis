import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface User {
  uid: string;
  email: string;
  name: string;
  createdAt: string;
}

class FirebaseAuthService {
  private currentUser: User | null = null;
  private authStateListeners: Array<(user: User | null) => void> = [];

  constructor() {
    // Listen to auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await this.getUserData(firebaseUser.uid);
        this.currentUser = userDoc;
        this.notifyListeners(userDoc);
      } else {
        this.currentUser = null;
        this.notifyListeners(null);
      }
    });
  }

  private async getUserData(uid: string): Promise<User | null> {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
      return null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }

  private notifyListeners(user: User | null) {
    this.authStateListeners.forEach(listener => listener(user));
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    this.authStateListeners.push(callback);
    // Immediately call with current user
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter(l => l !== callback);
    };
  }

  async signup(email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, { displayName: name });

      // Create user document in Firestore
      const userData: User = {
        uid: user.uid,
        email: user.email!,
        name: name,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", user.uid), userData);
      this.currentUser = userData;

      return { success: true };
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = 'Failed to create account';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already exists';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }

      return { success: false, error: errorMessage };
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await this.getUserData(userCredential.user.uid);
      
      if (userData) {
        this.currentUser = userData;
        return { success: true };
      }

      return { success: false, error: 'User data not found' };
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = 'Invalid email or password';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }

      return { success: false, error: errorMessage };
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  isAuthenticated(): boolean {
    return !!auth.currentUser;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getFirebaseUser(): FirebaseUser | null {
    return auth.currentUser;
  }
}

export const authService = new FirebaseAuthService();

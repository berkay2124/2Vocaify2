"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile, UserRole, Organization } from "@/types/organization";
import { toast } from "@/lib/toast";
import { logger } from "@/lib/logger";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  organization: Organization | null;
  loading: boolean;
  profileLoading: boolean;
  signUp: (email: string, password: string, displayName: string, organizationName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isRecruiter: () => boolean;
  hasRole: (role: UserRole) => boolean;
  canUploadCVs: () => boolean;
  canViewAllCVs: () => boolean;
  canManageTeam: () => boolean;
  canDeleteCVs: () => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Listen to user auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setUserProfile(null);
        setOrganization(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Listen to user profile changes
  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    let profileUnsubscribe: Unsubscribe | undefined;
    let orgUnsubscribe: Unsubscribe | undefined;

    // Subscribe to user profile
    profileUnsubscribe = onSnapshot(
      doc(db, "userProfiles", user.uid),
      async (profileDoc) => {
        if (profileDoc.exists()) {
          const profile = { id: profileDoc.id, ...profileDoc.data() } as UserProfile;
          setUserProfile(profile);

          // Subscribe to organization if profile has organizationId
          if (profile.organizationId) {
            orgUnsubscribe = onSnapshot(
              doc(db, "organizations", profile.organizationId),
              (orgDoc) => {
                if (orgDoc.exists()) {
                  setOrganization({ id: orgDoc.id, ...orgDoc.data() } as Organization);
                } else {
                  logger.error("Organization not found", new Error("Missing organization"), {
                    userId: user.uid,
                    organizationId: profile.organizationId,
                  });
                  setOrganization(null);
                }
                setLoading(false);
                setProfileLoading(false);
              },
              (error) => {
                logger.error("Failed to fetch organization", error, {
                  userId: user.uid,
                  organizationId: profile.organizationId,
                });
                setLoading(false);
                setProfileLoading(false);
              }
            );
          } else {
            setLoading(false);
            setProfileLoading(false);
          }
        } else {
          logger.warn("User profile not found, may need to create", {
            userId: user.uid,
          });
          setUserProfile(null);
          setLoading(false);
          setProfileLoading(false);
        }
      },
      (error) => {
        logger.error("Failed to fetch user profile", error, {
          userId: user.uid,
        });
        setLoading(false);
        setProfileLoading(false);
      }
    );

    return () => {
      profileUnsubscribe?.();
      orgUnsubscribe?.();
    };
  }, [user]);

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    organizationName?: string
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: displayName,
      });

      // Create organization if this is a new signup (not an invitation)
      let orgId: string;
      if (organizationName) {
        const orgRef = doc(db, "organizations", `org_${userId}`);
        const newOrg: Omit<Organization, "id"> = {
          name: organizationName,
          ownerId: userId,
          createdAt: serverTimestamp() as any,
          subscriptionStatus: "trial",
          subscriptionTier: "starter",
          memberIds: [userId],
          settings: {
            maxMembers: 5,
            maxCVs: 100,
            features: ["cv_upload", "semantic_search", "basic_analytics"],
          },
        };
        await setDoc(orgRef, newOrg);
        orgId = orgRef.id;

        logger.info("Organization created", {
          userId,
          organizationId: orgId,
          organizationName,
        });
      } else {
        // If no org name provided, user may be accepting an invitation
        // The invitation acceptance flow will handle profile creation
        toast.success("Account created successfully!");
        return;
      }

      // Create user profile
      const profileRef = doc(db, "userProfiles", userId);
      const newProfile: Omit<UserProfile, "id"> = {
        uid: userId,
        email,
        displayName,
        organizationId: orgId,
        role: "admin", // First user in org is admin
        createdAt: serverTimestamp() as any,
        isActive: true,
      };
      await setDoc(profileRef, newProfile);

      logger.info("User profile created", {
        userId,
        organizationId: orgId,
        role: "admin",
      });

      toast.success("Account and organization created successfully!");
    } catch (error: any) {
      let errorMessage = "Failed to create account";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already in use";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      }

      logger.error("Sign up failed", error, {
        email,
        errorCode: error.code,
      });

      toast.error(errorMessage);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Signed in successfully!");
      logger.userAction("sign_in", { email });
    } catch (error: any) {
      let errorMessage = "Failed to sign in";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/user-disabled") {
        errorMessage = "This account has been disabled";
      }

      logger.error("Sign in failed", error, {
        email,
        errorCode: error.code,
      });

      toast.error(errorMessage);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userId = result.user.uid;

      // Check if user profile exists
      const profileRef = doc(db, "userProfiles", userId);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        // New Google user - needs organization setup
        logger.info("New Google user, profile creation needed", {
          userId,
          email: result.user.email,
        });
        // The profile will be created by the onboarding flow
        toast.success("Welcome! Please complete your organization setup.");
      } else {
        toast.success("Signed in with Google!");
        logger.userAction("google_sign_in", {
          userId,
          email: result.user.email,
        });
      }
    } catch (error: any) {
      let errorMessage = "Failed to sign in with Google";

      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign in cancelled";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage = "Popup blocked. Please allow popups for this site";
      }

      logger.error("Google sign in failed", error, {
        errorCode: error.code,
      });

      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const userId = user?.uid;
      await signOut(auth);
      toast.success("Signed out successfully!");
      logger.userAction("sign_out", { userId });
    } catch (error) {
      logger.error("Sign out failed", error as Error);
      toast.error("Failed to sign out");
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent!");
      logger.userAction("password_reset_request", { email });
    } catch (error: any) {
      let errorMessage = "Failed to send reset email";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      }

      logger.error("Password reset failed", error, {
        email,
        errorCode: error.code,
      });

      toast.error(errorMessage);
      throw error;
    }
  };

  // Helper function to refresh user profile manually
  const refreshProfile = async () => {
    if (!user) return;

    try {
      const profileRef = doc(db, "userProfiles", user.uid);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const profile = { id: profileSnap.id, ...profileSnap.data() } as UserProfile;
        setUserProfile(profile);

        if (profile.organizationId) {
          const orgRef = doc(db, "organizations", profile.organizationId);
          const orgSnap = await getDoc(orgRef);

          if (orgSnap.exists()) {
            setOrganization({ id: orgSnap.id, ...orgSnap.data() } as Organization);
          }
        }

        logger.info("Profile refreshed", { userId: user.uid });
      }
    } catch (error) {
      logger.error("Failed to refresh profile", error as Error, {
        userId: user.uid,
      });
    }
  };

  // RBAC Helper Methods
  const isAdmin = () => userProfile?.role === "admin";
  const isManager = () => userProfile?.role === "manager";
  const isRecruiter = () => userProfile?.role === "recruiter";
  const hasRole = (role: UserRole) => userProfile?.role === role;

  // Permission helpers
  const canUploadCVs = () => {
    if (!userProfile) return false;
    return userProfile.role === "admin" || userProfile.role === "manager";
  };

  const canViewAllCVs = () => {
    if (!userProfile) return false;
    return userProfile.role === "admin" || userProfile.role === "manager";
  };

  const canManageTeam = () => {
    if (!userProfile) return false;
    return userProfile.role === "admin";
  };

  const canDeleteCVs = () => {
    if (!userProfile) return false;
    return userProfile.role === "admin" || userProfile.role === "manager";
  };

  const value: AuthContextType = {
    user,
    userProfile,
    organization,
    loading,
    profileLoading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    isAdmin,
    isManager,
    isRecruiter,
    hasRole,
    canUploadCVs,
    canViewAllCVs,
    canManageTeam,
    canDeleteCVs,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

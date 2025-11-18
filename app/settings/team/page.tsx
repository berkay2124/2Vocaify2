"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/lib/toast";
import { logger } from "@/lib/logger";
import { UserProfile, OrganizationInvitation, UserRole } from "@/types/organization";
import { usePageLoadPerformance } from "@/hooks/usePerformance";

export default function TeamManagementPage() {
  const { user, userProfile, organization, loading: authLoading, canManageTeam } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("recruiter");
  const [inviteLoading, setInviteLoading] = useState(false);

  usePageLoadPerformance("TeamManagementPage");

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !canManageTeam())) {
      toast.error("Access denied. Admin privileges required.");
      router.push("/dashboard");
    }
  }, [user, authLoading, canManageTeam, router]);

  // Load team members
  useEffect(() => {
    if (!userProfile?.organizationId) return;

    const q = query(
      collection(db, "userProfiles"),
      where("organizationId", "==", userProfile.organizationId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const membersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserProfile[];

        setMembers(membersList);
        setLoading(false);
        logger.info("Team members loaded", {
          organizationId: userProfile.organizationId,
          count: membersList.length,
        });
      },
      (error) => {
        logger.error("Failed to load team members", error, {
          organizationId: userProfile.organizationId,
        });
        toast.error("Failed to load team members");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile]);

  // Load pending invitations
  useEffect(() => {
    if (!userProfile?.organizationId) return;

    const q = query(
      collection(db, "invitations"),
      where("organizationId", "==", userProfile.organizationId),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const inviteList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as OrganizationInvitation[];

        setInvitations(inviteList);
      },
      (error) => {
        logger.error("Failed to load invitations", error, {
          organizationId: userProfile.organizationId,
        });
      }
    );

    return () => unsubscribe();
  }, [userProfile]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !userProfile || !organization) return;

    // Validate email
    if (!/\S+@\S+\.\S+/.test(inviteEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check if user is already a member
    if (members.some((m) => m.email === inviteEmail)) {
      toast.error("This user is already a member of your organization");
      return;
    }

    // Check if already invited
    if (invitations.some((inv) => inv.email === inviteEmail)) {
      toast.error("An invitation has already been sent to this email");
      return;
    }

    // Check member limit
    const maxMembers = organization.settings?.maxMembers || 5;
    if (members.length >= maxMembers) {
      toast.error(`Your plan allows a maximum of ${maxMembers} members`);
      return;
    }

    setInviteLoading(true);

    try {
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const invitation: Omit<OrganizationInvitation, "id"> = {
        organizationId: userProfile.organizationId,
        email: inviteEmail,
        role: inviteRole,
        invitedBy: user.uid,
        createdAt: serverTimestamp() as any,
        expiresAt: expiresAt as any,
        status: "pending",
        token,
      };

      await addDoc(collection(db, "invitations"), invitation);

      toast.success(`Invitation sent to ${inviteEmail}`);
      logger.userAction("send_invitation", {
        userId: user.uid,
        organizationId: userProfile.organizationId,
        invitedEmail: inviteEmail,
        role: inviteRole,
      });

      // Reset form
      setInviteEmail("");
      setInviteRole("recruiter");
    } catch (error) {
      logger.error("Failed to send invitation", error as Error, {
        userId: user.uid,
        email: inviteEmail,
      });
      toast.error("Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "invitations", invitationId));
      toast.success(`Invitation to ${email} cancelled`);
      logger.userAction("cancel_invitation", {
        userId: user.uid,
        invitationId,
        email,
      });
    } catch (error) {
      logger.error("Failed to cancel invitation", error as Error, {
        userId: user.uid,
        invitationId,
      });
      toast.error("Failed to cancel invitation");
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: UserRole, memberName: string) => {
    if (!user || !userProfile) return;

    // Prevent changing own role
    if (memberId === user.uid) {
      toast.error("You cannot change your own role");
      return;
    }

    // Prevent removing last admin
    if (members.filter((m) => m.role === "admin").length === 1) {
      const member = members.find((m) => m.id === memberId);
      if (member?.role === "admin") {
        toast.error("Cannot change role. Organization must have at least one admin");
        return;
      }
    }

    try {
      await updateDoc(doc(db, "userProfiles", memberId), {
        role: newRole,
      });

      toast.success(`Updated ${memberName}'s role to ${newRole}`);
      logger.userAction("update_member_role", {
        userId: user.uid,
        memberId,
        newRole,
      });
    } catch (error) {
      logger.error("Failed to update role", error as Error, {
        userId: user.uid,
        memberId,
        newRole,
      });
      toast.error("Failed to update role");
    }
  };

  const handleDeactivateMember = async (memberId: string, memberName: string) => {
    if (!user || !userProfile) return;

    // Prevent deactivating self
    if (memberId === user.uid) {
      toast.error("You cannot deactivate yourself");
      return;
    }

    // Prevent deactivating last admin
    if (members.filter((m) => m.role === "admin" && m.isActive).length === 1) {
      const member = members.find((m) => m.id === memberId);
      if (member?.role === "admin") {
        toast.error("Cannot deactivate. Organization must have at least one active admin");
        return;
      }
    }

    try {
      await updateDoc(doc(db, "userProfiles", memberId), {
        isActive: false,
      });

      toast.success(`${memberName} has been deactivated`);
      logger.userAction("deactivate_member", {
        userId: user.uid,
        memberId,
      });
    } catch (error) {
      logger.error("Failed to deactivate member", error as Error, {
        userId: user.uid,
        memberId,
      });
      toast.error("Failed to deactivate member");
    }
  };

  if (authLoading || !user || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
                Vocaify
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings/team"
                  className="text-sm font-medium text-primary-600 border-b-2 border-primary-600 pb-0.5"
                >
                  Team
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">
            Manage team members and permissions for {organization?.name}
          </p>
        </div>

        {/* Invite New Member */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  label="Email Address"
                />
              </div>
              <div className="w-full sm:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="recruiter">Recruiter</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" isLoading={inviteLoading}>
                  Send Invite
                </Button>
              </div>
            </form>
            <p className="text-sm text-gray-500 mt-4">
              {members.length} / {organization?.settings?.maxMembers || 5} members used
            </p>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
            </CardHeader>
            <CardContent padding="none">
              <div className="divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{invitation.email}</p>
                      <p className="text-sm text-gray-500">
                        Invited as {invitation.role}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="warning">Pending</Badge>
                      <Button
                        onClick={() => handleCancelInvitation(invitation.id!, invitation.email)}
                        variant="ghost"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members ({members.filter((m) => m.isActive).length})</CardTitle>
          </CardHeader>
          <CardContent padding="none">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton variant="circular" width={48} height={48} />
                    <div className="flex-1 space-y-2">
                      <Skeleton width="40%" />
                      <Skeleton width="60%" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {members
                  .filter((m) => m.isActive)
                  .map((member) => (
                    <div
                      key={member.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-lg">
                            {member.displayName?.charAt(0).toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{member.displayName}</p>
                            {member.uid === user.uid && (
                              <Badge variant="info" size="sm">
                                You
                              </Badge>
                            )}
                            {member.uid === organization?.ownerId && (
                              <Badge variant="primary" size="sm">
                                Owner
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {member.uid === user.uid ? (
                          <Badge
                            variant={
                              member.role === "admin"
                                ? "primary"
                                : member.role === "manager"
                                ? "info"
                                : "default"
                            }
                          >
                            {member.role}
                          </Badge>
                        ) : (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateRole(member.id!, e.target.value as UserRole, member.displayName)
                            }
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="recruiter">Recruiter</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                        {member.uid !== user.uid && (
                          <Button
                            onClick={() => handleDeactivateMember(member.id!, member.displayName)}
                            variant="ghost"
                            size="sm"
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Descriptions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="primary">Admin</Badge>
                  <span className="font-semibold text-gray-900">Full Access</span>
                </div>
                <p className="text-sm text-gray-600">
                  Complete control over organization, team management, billing, and all features
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="info">Manager</Badge>
                  <span className="font-semibold text-gray-900">CV Management</span>
                </div>
                <p className="text-sm text-gray-600">
                  Upload CVs, view all candidates, manage shortlists, assign roles to recruiters
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="default">Recruiter</Badge>
                  <span className="font-semibold text-gray-900">Search Only</span>
                </div>
                <p className="text-sm text-gray-600">
                  Search and view assigned shortlists, cannot upload or delete CVs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

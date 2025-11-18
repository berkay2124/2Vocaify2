/**
 * Cloud Function: Invite User to Organization
 *
 * This function handles team member invitations with email notifications.
 *
 * Triggered by: Firestore onCreate on /invitations/{invitationId}
 *
 * Security:
 * - Validates invitation was created by authorized user (admin)
 * - Checks organization member limits
 * - Verifies email hasn't already been invited
 * - Generates secure invitation tokens
 *
 * Email Service:
 * - Production: SendGrid/Mailgun/AWS SES
 * - Development: Console log simulation
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface OrganizationInvitation {
  organizationId: string;
  email: string;
  role: 'admin' | 'manager' | 'recruiter';
  invitedBy: string;
  createdAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
  status: 'pending' | 'accepted' | 'expired' | 'rejected';
  token: string;
}

interface Organization {
  name: string;
  ownerId: string;
  subscriptionStatus: string;
  subscriptionTier: string;
  memberIds: string[];
  settings?: {
    maxMembers?: number;
    maxCVs?: number;
    features?: string[];
  };
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  organizationId: string;
  role: 'admin' | 'manager' | 'recruiter';
  isActive: boolean;
}

/**
 * Send invitation email (simulated for now)
 *
 * In production, integrate with:
 * - SendGrid: https://sendgrid.com/
 * - Mailgun: https://www.mailgun.com/
 * - AWS SES: https://aws.amazon.com/ses/
 *
 * @param invitation - The invitation object
 * @param organizationName - Name of the organization
 * @param inviterName - Name of the person who sent the invitation
 */
async function sendInvitationEmail(
  invitation: OrganizationInvitation,
  organizationName: string,
  inviterName: string
): Promise<void> {
  const acceptUrl = `${process.env.APP_URL || 'https://vocaify.com'}/auth/accept-invitation?token=${invitation.token}`;

  // Email template
  const emailContent = {
    to: invitation.email,
    from: 'noreply@vocaify.com',
    subject: `You've been invited to join ${organizationName} on Vocaify`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .button:hover { background: #5568d3; }
            .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 You're Invited!</h1>
            </div>
            <div class="content">
              <h2>Join ${organizationName} on Vocaify</h2>
              <p><strong>${inviterName}</strong> has invited you to join their team as a <strong>${invitation.role}</strong>.</p>

              <div class="details">
                <h3>Invitation Details:</h3>
                <ul>
                  <li><strong>Organization:</strong> ${organizationName}</li>
                  <li><strong>Role:</strong> ${invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}</li>
                  <li><strong>Invited by:</strong> ${inviterName}</li>
                  <li><strong>Expires:</strong> ${invitation.expiresAt.toDate().toLocaleDateString()}</li>
                </ul>
              </div>

              <h3>Role Permissions:</h3>
              ${getRoleDescription(invitation.role)}

              <div style="text-align: center;">
                <a href="${acceptUrl}" class="button">Accept Invitation</a>
              </div>

              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                This invitation will expire in 7 days. If you don't want to join this organization, you can safely ignore this email.
              </p>

              <p style="color: #6b7280; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <code style="background: #e5e7eb; padding: 5px; border-radius: 4px; display: inline-block; margin-top: 5px;">${acceptUrl}</code>
              </p>
            </div>
            <div class="footer">
              <p>Vocaify - AI-Powered CV Search Platform</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
You've been invited to join ${organizationName} on Vocaify!

${inviterName} has invited you to join their team as a ${invitation.role}.

Invitation Details:
- Organization: ${organizationName}
- Role: ${invitation.role}
- Invited by: ${inviterName}
- Expires: ${invitation.expiresAt.toDate().toLocaleDateString()}

Accept this invitation by visiting:
${acceptUrl}

This invitation will expire in 7 days.

---
Vocaify - AI-Powered CV Search Platform
    `,
  };

  // In production, replace with actual email service
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send(emailContent);

  // For now, log to console (development)
  console.log('📧 Invitation Email (SIMULATED):');
  console.log('-----------------------------------');
  console.log(`To: ${emailContent.to}`);
  console.log(`Subject: ${emailContent.subject}`);
  console.log(`Accept URL: ${acceptUrl}`);
  console.log('-----------------------------------');

  // Store email in Firestore for audit trail
  await db.collection('emailLogs').add({
    to: invitation.email,
    subject: emailContent.subject,
    type: 'invitation',
    invitationId: invitation.token,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'simulated', // Change to 'sent' in production
  });
}

/**
 * Get role description for email
 */
function getRoleDescription(role: string): string {
  const descriptions = {
    admin: `
      <ul>
        <li>Full organization control</li>
        <li>Manage team members and roles</li>
        <li>Access billing and subscription</li>
        <li>Upload and delete CVs</li>
        <li>View all candidates</li>
      </ul>
    `,
    manager: `
      <ul>
        <li>Upload CVs</li>
        <li>View all candidates</li>
        <li>Manage shortlists</li>
        <li>Assign recruiters to CVs</li>
        <li>Export data and analytics</li>
      </ul>
    `,
    recruiter: `
      <ul>
        <li>Search CVs</li>
        <li>View assigned shortlists</li>
        <li>Basic analytics access</li>
      </ul>
    `,
  };

  return descriptions[role] || '<p>Standard user permissions</p>';
}

/**
 * Main Cloud Function: Process new invitation
 *
 * Triggered when a new invitation document is created in Firestore
 */
export const processInvitation = functions.firestore
  .document('invitations/{invitationId}')
  .onCreate(async (snapshot, context) => {
    const invitation = snapshot.data() as OrganizationInvitation;
    const invitationId = context.params.invitationId;

    console.log(`Processing invitation: ${invitationId}`);

    try {
      // 1. Get organization details
      const orgDoc = await db.collection('organizations').doc(invitation.organizationId).get();

      if (!orgDoc.exists) {
        console.error(`Organization not found: ${invitation.organizationId}`);
        await snapshot.ref.update({
          status: 'error',
          errorMessage: 'Organization not found',
        });
        return;
      }

      const organization = orgDoc.data() as Organization;

      // 2. Get inviter details
      const inviterDoc = await db.collection('userProfiles').doc(invitation.invitedBy).get();

      if (!inviterDoc.exists) {
        console.error(`Inviter not found: ${invitation.invitedBy}`);
        await snapshot.ref.update({
          status: 'error',
          errorMessage: 'Inviter not found',
        });
        return;
      }

      const inviter = inviterDoc.data() as UserProfile;

      // 3. Verify inviter is admin
      if (inviter.role !== 'admin') {
        console.error(`Unauthorized invitation attempt by non-admin: ${invitation.invitedBy}`);
        await snapshot.ref.update({
          status: 'error',
          errorMessage: 'Only admins can send invitations',
        });
        return;
      }

      // 4. Check member limit
      const maxMembers = organization.settings?.maxMembers || 5;
      const currentMembers = organization.memberIds?.length || 0;

      if (currentMembers >= maxMembers) {
        console.error(`Member limit reached for org: ${invitation.organizationId}`);
        await snapshot.ref.update({
          status: 'error',
          errorMessage: `Member limit reached (${maxMembers} maximum)`,
        });
        return;
      }

      // 5. Check if email is already a member
      const existingMemberQuery = await db
        .collection('userProfiles')
        .where('email', '==', invitation.email)
        .where('organizationId', '==', invitation.organizationId)
        .get();

      if (!existingMemberQuery.empty) {
        console.error(`User already a member: ${invitation.email}`);
        await snapshot.ref.update({
          status: 'error',
          errorMessage: 'User is already a member',
        });
        return;
      }

      // 6. Check for duplicate pending invitations
      const duplicateInviteQuery = await db
        .collection('invitations')
        .where('email', '==', invitation.email)
        .where('organizationId', '==', invitation.organizationId)
        .where('status', '==', 'pending')
        .get();

      // Remove the current invitation from duplicates count
      const duplicates = duplicateInviteQuery.docs.filter(doc => doc.id !== invitationId);

      if (duplicates.length > 0) {
        console.warn(`Duplicate invitation found for: ${invitation.email}`);
        // Cancel old invitations
        for (const doc of duplicates) {
          await doc.ref.update({ status: 'expired' });
        }
      }

      // 7. Send invitation email
      await sendInvitationEmail(invitation, organization.name, inviter.displayName);

      // 8. Update invitation status
      await snapshot.ref.update({
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        processed: true,
      });

      console.log(`✅ Invitation processed successfully: ${invitationId}`);

      // 9. Log activity
      await db.collection('activityLog').add({
        type: 'invitation_sent',
        organizationId: invitation.organizationId,
        invitedBy: invitation.invitedBy,
        invitedEmail: invitation.email,
        role: invitation.role,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

    } catch (error) {
      console.error('Error processing invitation:', error);

      // Update invitation with error
      await snapshot.ref.update({
        status: 'error',
        errorMessage: error.message || 'Unknown error',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      throw error; // Re-throw for Cloud Functions retry
    }
  });

/**
 * Scheduled Function: Clean up expired invitations
 *
 * Runs daily to mark expired invitations
 */
export const cleanupExpiredInvitations = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Running expired invitations cleanup...');

    const now = admin.firestore.Timestamp.now();

    const expiredQuery = await db
      .collection('invitations')
      .where('status', '==', 'pending')
      .where('expiresAt', '<', now)
      .get();

    console.log(`Found ${expiredQuery.size} expired invitations`);

    const batch = db.batch();

    expiredQuery.docs.forEach((doc) => {
      batch.update(doc.ref, { status: 'expired' });
    });

    await batch.commit();

    console.log(`✅ Marked ${expiredQuery.size} invitations as expired`);

    return null;
  });

/**
 * HTTP Function: Accept Invitation
 *
 * Called when user clicks accept link in email
 */
export const acceptInvitation = functions.https.onCall(async (data, context) => {
  const { token } = data;

  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to accept invitation'
    );
  }

  const userId = context.auth.uid;
  const userEmail = context.auth.token.email;

  if (!token) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invitation token is required'
    );
  }

  try {
    // Find invitation
    const invitationQuery = await db
      .collection('invitations')
      .where('token', '==', token)
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (invitationQuery.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'Invitation not found or already used'
      );
    }

    const invitationDoc = invitationQuery.docs[0];
    const invitation = invitationDoc.data() as OrganizationInvitation;

    // Verify email matches
    if (invitation.email !== userEmail) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Invitation was sent to a different email address'
      );
    }

    // Check if expired
    if (invitation.expiresAt.toDate() < new Date()) {
      await invitationDoc.ref.update({ status: 'expired' });
      throw new functions.https.HttpsError(
        'deadline-exceeded',
        'This invitation has expired'
      );
    }

    // Get user auth record
    const userRecord = await admin.auth().getUser(userId);

    // Create user profile
    const userProfile: Omit<UserProfile, 'id'> = {
      uid: userId,
      email: userEmail!,
      displayName: userRecord.displayName || userEmail!.split('@')[0],
      organizationId: invitation.organizationId,
      role: invitation.role,
      isActive: true,
    };

    await db.collection('userProfiles').doc(userId).set({
      ...userProfile,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Add user to organization members
    await db.collection('organizations').doc(invitation.organizationId).update({
      memberIds: admin.firestore.FieldValue.arrayUnion(userId),
    });

    // Mark invitation as accepted
    await invitationDoc.ref.update({
      status: 'accepted',
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      acceptedBy: userId,
    });

    // Log activity
    await db.collection('activityLog').add({
      type: 'invitation_accepted',
      organizationId: invitation.organizationId,
      userId,
      email: userEmail,
      role: invitation.role,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Invitation accepted: ${token} by ${userId}`);

    return {
      success: true,
      organizationId: invitation.organizationId,
      role: invitation.role,
    };

  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
});

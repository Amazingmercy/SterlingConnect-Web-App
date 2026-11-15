import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  triggerType: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromName: string;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.fromName = this.config.get<string>('SMTP_FROM_NAME', 'Sterling Connect');
    this.fromEmail = this.config.get<string>('SMTP_FROM_EMAIL', 'amaefulemercy499@gmail.com');
    this.frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');

    const smtpUser = this.config.get<string>('SMTP_USER', 'amaefulemercy499@gmail.com');
    const rawPass = this.config.get<string>('SMTP_APP_PASSWORD');
    const smtpPass = rawPass ? rawPass.replace(/\s+/g, '') : '';
    const smtpHost = this.config.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const smtpPort = this.config.get<number>('SMTP_PORT', 465);

    if (smtpUser && smtpPass && smtpPass !== 'your-16-char-google-workspace-app-password') {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log(`Google Workspace SMTP transport initialized for: ${smtpUser}`);
    } else {
      this.logger.warn(
        'Google Workspace SMTP credentials not configured. Emails will be logged to console in dev mode.',
      );
    }
  }

  /**
   * Core email delivery via SMTP with automatic EmailLog audit.
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, html, triggerType } = options;

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: `"${this.fromName}" <${this.fromEmail}>`,
          to,
          subject,
          html,
        });
        this.logger.log(`Email [${triggerType}] sent successfully to: ${to}`);
      } else {
        this.logger.log(`[DEV EMAIL SIMULATION] To: ${to} | Subject: ${subject} | Trigger: ${triggerType}`);
      }

      await this.prisma.emailLog.create({
        data: {
          recipientEmail: to,
          triggerType,
          subject,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send email [${triggerType}] to ${to}: ${error.message}`);

      await this.prisma.emailLog.create({
        data: {
          recipientEmail: to,
          triggerType,
          subject,
          status: 'FAILED',
          errorMessage: error.message || 'Unknown SMTP error',
        },
      });

      return false;
    }
  }

  /**
   * Canonical HTML layout wrapper enforcing approved branding, preview text and footer.
   */
  private renderHtmlLayout(previewText: string, contentHtml: string): string {
    const privacyUrl = `${this.frontendUrl}/privacy`;
    const termsUrl = `${this.frontendUrl}/terms`;
    const contactUrl = `${this.frontendUrl}/about`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Sterling Connect</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #102641;">
        <!-- Hidden Preheader Preview Text -->
        <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
          ${previewText}
        </div>

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <!-- Header -->
                <tr>
                  <td style="padding: 28px 32px; background-color: #102641; border-bottom: 3px solid #087b63;">
                    <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                      Sterling<span style="color: #90cfc0;">Connect.</span>
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px;">
                      From Readiness to Opportunity
                    </p>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 32px; font-size: 15px; line-height: 1.6; color: #334155;">
                    ${contentHtml}
                  </td>
                </tr>

                <!-- Approved Footer -->
                <tr>
                  <td style="padding: 24px 32px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
                    <p style="margin: 0 0 8px 0; font-weight: 600; color: #334155;">
                      Sterling Learning & Research Solutions | Sterling Connect
                    </p>
                    <p style="margin: 0 0 12px 0;">
                      <a href="${privacyUrl}" style="color: #087b63; text-decoration: none; margin: 0 8px;">Privacy Policy</a> •
                      <a href="${termsUrl}" style="color: #087b63; text-decoration: none; margin: 0 8px;">Terms of Service</a> •
                      <a href="${contactUrl}" style="color: #087b63; text-decoration: none; margin: 0 8px;">About & Contact</a>
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                      © ${new Date().getFullYear()} Sterling Learning & Research Solutions. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  // =========================================================================
  // SECTION 8 CANONICAL EMAIL TEMPLATES (EM001 - EM006 & AUTH_RESET)
  // =========================================================================

  /**
   * EM002: Verify your Sterling Connect email
   * Trigger: Immediately after pending account creation.
   * Delivery rule: Secure link; proposed 24-hour expiry. No marketing content.
   */
  async sendVerificationEmail(to: string, firstName: string, verificationToken: string) {
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${verificationToken}`;
    const previewText = 'Confirm your email address to get started.';

    const contentHtml = `
      <p style="font-size: 16px; font-weight: 600; color: #102641; margin-top: 0;">Hi ${firstName},</p>
      <p style="margin: 16px 0;">
        Welcome to Sterling Connect. Confirm your email address to set up your profile and begin exploring readiness, learning and opportunities.
      </p>
      
      <!-- 6-digit Code Box for manual entry -->
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
        <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; font-weight: 700;">Verification Code</p>
        <p style="margin: 6px 0 0 0; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #102641; font-family: monospace;">${verificationToken}</p>
      </div>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${verificationUrl}" style="background-color: #087b63; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
          Verify my email
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        If the button does not work, open this link: <br />
        <a href="${verificationUrl}" style="color: #087b63; word-break: break-all;">${verificationUrl}</a>
      </p>

      <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
        If you did not create this account, you can ignore this email.
      </p>

      <p style="margin-top: 24px; color: #102641; font-weight: 600;">The Sterling team</p>
    `;

    const html = this.renderHtmlLayout(previewText, contentHtml);

    return this.sendEmail({
      to,
      subject: 'Verify your Sterling Connect email',
      html,
      triggerType: 'EM002_ACCOUNT_VERIFICATION',
    });
  }

  /**
   * EM001: Welcome to Sterling Connect
   * Trigger: After verified email, once per account; deep link onboarding.
   */
  async sendWelcomeEmail(to: string, firstName: string) {
    const profileUrl = `${this.frontendUrl}/profile`;
    const previewText = 'Your next step starts with your profile.';

    const contentHtml = `
      <p style="font-size: 16px; font-weight: 600; color: #102641; margin-top: 0;">Hi ${firstName},</p>
      <p style="margin: 16px 0;">
        Your email is verified. You can now build your profile, reflect on your readiness and explore opportunities that may fit your goals.
      </p>
      <p style="margin: 16px 0;">
        Start by choosing your pathway and completing the details that matter to you. You can use both Career & Employment and Education & Scholarships.
      </p>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${profileUrl}" style="background-color: #087b63; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
          Set up my profile
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-top: 20px; border-left: 3px solid #90cfc0; padding-left: 12px;">
        Core Connect features are free. Where professional learning is paid, it is optional. Scholarship learning is free.
      </p>

      <p style="margin-top: 24px; color: #102641; font-weight: 600;">The Sterling team</p>
    `;

    const html = this.renderHtmlLayout(previewText, contentHtml);

    return this.sendEmail({
      to,
      subject: 'Welcome to Sterling Connect',
      html,
      triggerType: 'EM001_WELCOME_ONBOARDING',
    });
  }

  /**
   * EM003: Your {pathway_readiness_name} results are ready
   * Trigger: Once per completed attempt. Avoid sensitive score disclosure in email subject.
   */
  async sendAssessmentCompletedEmail(to: string, firstName: string, pathwayReadinessName: string) {
    const resultsUrl = `${this.frontendUrl}/assessment/results`;
    const previewText = 'Explore your preparation and practical next steps.';

    const contentHtml = `
      <p style="font-size: 16px; font-weight: 600; color: #102641; margin-top: 0;">Hi ${firstName},</p>
      <p style="margin: 16px 0;">
        You have completed your ${pathwayReadinessName} assessment. Your result and recommended next steps are available in Sterling Connect.
      </p>
      <p style="margin: 16px 0;">
        Use them to identify useful preparation actions while continuing to explore opportunities.
      </p>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${resultsUrl}" style="background-color: #087b63; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
          View my results
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-top: 20px; border-left: 3px solid #90cfc0; padding-left: 12px;">
        Your result is a development guide. It does not confirm eligibility or guarantee selection, employment or a scholarship award.
      </p>

      <p style="margin-top: 24px; color: #102641; font-weight: 600;">The Sterling team</p>
    `;

    const html = this.renderHtmlLayout(previewText, contentHtml);

    return this.sendEmail({
      to,
      subject: `Your ${pathwayReadinessName} results are ready`,
      html,
      triggerType: 'EM003_ASSESSMENT_RESULTS',
    });
  }

  /**
   * EM004: Reminder {opportunity_title} closes soon
   * Trigger: Seven days before deadline, once per user/opportunity/window; only open saved record.
   */
  async sendDeadlineReminderEmail(
    to: string,
    firstName: string,
    opportunityTitle: string,
    deadlineDisplay: string,
    opportunityId: string,
  ) {
    const opportunityUrl = `${this.frontendUrl}/opportunities/${opportunityId}`;
    const preferencesUrl = `${this.frontendUrl}/settings`;
    const previewText = 'Keep this deadline in view.';

    const contentHtml = `
      <p style="font-size: 16px; font-weight: 600; color: #102641; margin-top: 0;">Hi ${firstName},</p>
      <p style="margin: 16px 0;">
        You saved <strong>${opportunityTitle}</strong>. Its advertised application deadline is <strong>${deadlineDisplay}</strong>.
      </p>
      <p style="margin: 16px 0;">
        Review the requirements and submit through the provider’s official process if you decide to apply. Check the official website in case the details have changed.
      </p>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${opportunityUrl}" style="background-color: #087b63; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
          Review opportunity
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; margin: 16px 0;">
        Already applied? Update your application tracker in Sterling Connect.
      </p>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
        Manage these reminders: <a href="${preferencesUrl}" style="color: #087b63;">${preferencesUrl}</a>
      </p>

      <p style="margin-top: 24px; color: #102641; font-weight: 600;">The Sterling team</p>
    `;

    const html = this.renderHtmlLayout(previewText, contentHtml);

    return this.sendEmail({
      to,
      subject: `Reminder ${opportunityTitle} closes soon`,
      html,
      triggerType: 'EM004_DEADLINE_CLOSING_7D',
    });
  }

  /**
   * EM005: Any update on {opportunity_title}
   * Trigger: Proposed day 14 and day 28 after applied_at; maximum two. Stop terminal outcomes.
   */
  async sendApplicationFollowUpEmail(
    to: string,
    firstName: string,
    opportunityTitle: string,
    applicationId: string,
  ) {
    const updateApplicationUrl = `${this.frontendUrl}/applications/${applicationId}/update`;
    const preferencesUrl = `${this.frontendUrl}/settings`;
    const previewText = 'Keep your application tracker up to date.';

    const contentHtml = `
      <p style="font-size: 16px; font-weight: 600; color: #102641; margin-top: 0;">Hi ${firstName},</p>
      <p style="margin: 16px 0;">
        You recorded an application for <strong>${opportunityTitle}</strong>. Have you received an update?
      </p>
      <p style="margin: 16px 0;">
        You can record a shortlist, interview, offer, scholarship award or other outcome in your tracker. If you haven’t heard back, leave the status unchanged.
      </p>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${updateApplicationUrl}" style="background-color: #087b63; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
          Update my application
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; margin: 16px 0; border-left: 3px solid #cbd5e1; padding-left: 12px;">
        This reminder does not mean the provider has made a decision.
      </p>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
        Manage these reminders: <a href="${preferencesUrl}" style="color: #087b63;">${preferencesUrl}</a>
      </p>

      <p style="margin-top: 24px; color: #102641; font-weight: 600;">The Sterling team</p>
    `;

    const html = this.renderHtmlLayout(previewText, contentHtml);

    return this.sendEmail({
      to,
      subject: `Any update on ${opportunityTitle}`,
      html,
      triggerType: 'EM005_APPLICATION_FOLLOWUP',
    });
  }

  /**
   * AUTH_RESET: Reset your Sterling Connect password
   * Trigger: Send only to account email after valid request. Proposed token expiry 1 hour.
   */
  async sendPasswordResetEmail(to: string, firstName: string, resetToken: string) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;
    const previewText = 'Use this link to choose a new password.';

    const contentHtml = `
      <p style="font-size: 16px; font-weight: 600; color: #102641; margin-top: 0;">Hi ${firstName},</p>
      <p style="margin: 16px 0;">
        We received a request to reset your Sterling Connect password.
      </p>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #087b63; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
          Reset my password
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        If the button does not work, open this link: <br />
        <a href="${resetUrl}" style="color: #087b63; word-break: break-all;">${resetUrl}</a>
      </p>

      <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
        If you did not make this request, you can ignore this email. Your password will stay the same.
      </p>

      <p style="margin-top: 24px; color: #102641; font-weight: 600;">The Sterling team</p>
    `;

    const html = this.renderHtmlLayout(previewText, contentHtml);

    return this.sendEmail({
      to,
      subject: 'Reset your Sterling Connect password',
      html,
      triggerType: 'AUTH_RESET_PASSWORD',
    });
  }

  /**
   * EM006: New opportunities to explore in Sterling Connect
   * Trigger: Optional periodic digest, opt-in required.
   */
  async sendOpportunitiesDigestEmail(
    to: string,
    firstName: string,
    itemsHtml: string,
  ) {
    const opportunitiesUrl = `${this.frontendUrl}/opportunities`;
    const preferencesUrl = `${this.frontendUrl}/settings`;
    const previewText = 'Review new opportunities that may fit your profile.';

    const contentHtml = `
      <p style="font-size: 16px; font-weight: 600; color: #102641; margin-top: 0;">Hi ${firstName},</p>
      <p style="margin: 16px 0;">
        There are new opportunities you may want to explore:
      </p>

      <div style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background-color: #f8fafc;">
        ${itemsHtml}
      </div>

      <div style="margin: 28px 0; text-align: center;">
        <a href="${opportunitiesUrl}" style="background-color: #087b63; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
          Explore opportunities
        </a>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-top: 20px; border-left: 3px solid #90cfc0; padding-left: 12px;">
        Each suggestion uses the information available about your profile and the opportunity. Check the official requirements before applying.
      </p>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
        Manage updates or unsubscribe: <a href="${preferencesUrl}" style="color: #087b63;">${preferencesUrl}</a>
      </p>

      <p style="margin-top: 24px; color: #102641; font-weight: 600;">The Sterling team</p>
    `;

    const html = this.renderHtmlLayout(previewText, contentHtml);

    return this.sendEmail({
      to,
      subject: 'New opportunities to explore in Sterling Connect',
      html,
      triggerType: 'EM006_OPPORTUNITIES_DIGEST',
    });
  }
}

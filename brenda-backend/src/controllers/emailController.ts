import { Request, Response } from 'express';
import { sendEmail } from '../services/emailService';

export const testSendEmail = async (req: Request, res: Response) => {
  try {
    const { to, subject, html } = req.body;
    const result = await sendEmail({
      from: 'onboarding@resend.dev',
      to,
      subject,
      html,
    });
    res.status(200).json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

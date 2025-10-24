import nodemailer from 'nodemailer';

export interface MailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export const getMailerConfig = (): MailerConfig => {
  const user = process.env.MAILTRAP_USER;
  const pass = process.env.MAILTRAP_PASS;
  
  if (!user || !pass) {
    throw new Error('MAILTRAP_USER and MAILTRAP_PASS are required');
  }

  return {
    host: 'smtp.mailtrap.io',
    port: 2525,
    secure: false,
    auth: {
      user,
      pass
    }
  };
};

// STUB: Mailtrap Email Simulation
export const createTransporter = () => {
  const config = getMailerConfig();
  return nodemailer.createTransport(config);
};

export default getMailerConfig;

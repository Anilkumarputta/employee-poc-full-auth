import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generate2FASecret(userId: number) {
  const secret = speakeasy.generateSecret({ length: 20 });
  await prisma.user.update({
    where: { id: userId },
    data: { twoFASecret: secret.base32 },
  });
  const otpauthUrl = secret.otpauth_url;
  if (!otpauthUrl) throw new Error('Failed to generate 2FA otpauth URL');
  const qrCode = await qrcode.toDataURL(otpauthUrl);
  return { otpauthUrl, qrCode };
}

export function verify2FACode(secret: string, token: string) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  });
}

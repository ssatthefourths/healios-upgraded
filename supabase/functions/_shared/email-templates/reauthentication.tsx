/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Healios verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://yvctrcoftphjvcvgwbql.supabase.co/storage/v1/object/public/email-assets/healios-logo.png"
          alt="Healios"
          width="90"
          height="auto"
          style={logo}
        />
        <Heading style={h1}>Verify your identity</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }
const container = { padding: '40px 32px', maxWidth: '480px', margin: '0 auto' }
const logo = { marginBottom: '32px' }
const h1 = {
  fontSize: '24px',
  fontWeight: '300' as const,
  color: '#171717',
  margin: '0 0 16px',
  letterSpacing: '-0.01em',
}
const text = {
  fontSize: '15px',
  color: '#737373',
  lineHeight: '1.6',
  margin: '0 0 24px',
  fontWeight: '300' as const,
}
const codeStyle = {
  fontFamily: "'SF Mono', 'Courier New', monospace",
  fontSize: '28px',
  fontWeight: '300' as const,
  color: '#171717',
  margin: '0 0 32px',
  letterSpacing: '0.15em',
}
const footer = { fontSize: '13px', color: '#a3a3a3', margin: '32px 0 0', fontWeight: '300' as const }

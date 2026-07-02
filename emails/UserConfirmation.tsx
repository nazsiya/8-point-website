import { Html, Head, Body, Container, Heading, Text, Hr } from '@react-email/components';
import * as React from 'react';

interface Props {
  name: string;
  type: 'contact' | 'quote';
  siteName: string;
}

export function UserConfirmation({ name, type, siteName }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', background: '#f4f4f4' }}>
        <Container style={{ background: '#fff', padding: '32px', borderRadius: '8px', maxWidth: '600px', margin: '40px auto' }}>
          <Heading style={{ color: '#1a1a1a' }}>Thanks, {name}! ✅</Heading>
          <Text style={{ fontSize: '16px', color: '#333' }}>
            We've received your {type === 'quote' ? 'quote request' : 'message'} and will
            get back to you within 1–2 business days.
          </Text>
          <Hr />
          <Text style={{ color: '#888', fontSize: '13px' }}>
            — The {siteName} Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

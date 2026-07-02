import { Html, Head, Body, Container, Heading, Text, Hr, Section, Row, Column } from '@react-email/components';
import * as React from 'react';

interface Props {
  type: 'contact' | 'quote';
  fields: Record<string, string | undefined>;
}

export function AdminNotification({ type, fields }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', background: '#f4f4f4' }}>
        <Container style={{ background: '#fff', padding: '32px', borderRadius: '8px', maxWidth: '600px', margin: '40px auto' }}>
          <Heading style={{ color: '#1a1a1a' }}>
            New {type === 'quote' ? 'Quote Request' : 'Contact Message'} 🔔
          </Heading>
          <Hr />
          {Object.entries(fields).map(([key, value]) =>
            value ? (
              <Section key={key}>
                <Row>
                  <Column style={{ fontWeight: 'bold', color: '#555', width: '140px', textTransform: 'capitalize' }}>
                    {key.replace(/_/g, ' ')}
                  </Column>
                  <Column style={{ color: '#1a1a1a' }}>{value}</Column>
                </Row>
              </Section>
            ) : null
          )}
          <Hr />
          <Text style={{ color: '#888', fontSize: '12px' }}>
            Sent via website form. Reply directly to the sender's email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
